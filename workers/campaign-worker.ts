import { Worker, Job } from 'bullmq';
import { prisma } from '../lib/db';
import { connection, SMS_QUEUE, DRIP_SCHEDULE_QUEUE, NURTURE_SCHEDULE_QUEUE, SMSJobData, ScheduleJobData, smsQueue, dripScheduleQueue, nurtureScheduleQueue } from '../lib/queue';
import { sendSMS } from '../lib/twilio';
import { getDripStep, getNextDripDelay, isAfterLastDripStep, DRIP_REST_MS } from '../lib/drip-engine';
import { getNurtureStep, getNurtureLoopVariant, getLoopDelayMs, getNurtureGapMs, isAfterLastNurtureTouch } from '../lib/nurture-engine';
import { isQuietHours, msUntilQuietHoursEnd } from '../lib/quiet-hours';

const SENDER_NAME = process.env.SENDER_NAME ?? 'Your Name';
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_DURATION_MS = 60_000;

// ── SMS Worker ────────────────────────────────────────────────────────────────
const smsWorker = new Worker<SMSJobData>(
  SMS_QUEUE,
  async (job: Job<SMSJobData>) => {
    const { leadId, phone, body, step, campaignType } = job.data;

    // Check opt-out at execution time
    const optOut = await prisma.optOut.findUnique({ where: { phone } });
    if (optOut) {
      console.log(`[SMS] Skipping opt-out phone ${phone}`);
      return;
    }

    // Check quiet hours at execution time
    if (isQuietHours()) {
      const delay = msUntilQuietHoursEnd();
      console.log(`[SMS] Quiet hours — requeueing job in ${Math.round(delay / 60000)}min`);
      await smsQueue.add(job.name, job.data, { delay });
      return;
    }

    // Send the message
    const message = await sendSMS({ to: phone, body });

    // Record in DB
    await prisma.message.create({
      data: {
        leadId,
        direction: 'OUTBOUND',
        body,
        twilioSid: message.sid,
        status: 'SENT',
        step,
        campaignType,
        sentAt: new Date(),
      },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: { lastContactAt: new Date() },
    });

    console.log(`[SMS] Sent step ${step} to ${phone} — SID: ${message.sid}`);
  },
  {
    connection,
    concurrency: 5,
    limiter: { max: RATE_LIMIT_MAX, duration: RATE_LIMIT_DURATION_MS },
  }
);

// ── Drip Schedule Worker ──────────────────────────────────────────────────────
const dripWorker = new Worker<ScheduleJobData>(
  DRIP_SCHEDULE_QUEUE,
  async (job: Job<ScheduleJobData>) => {
    const { leadId, step } = job.data;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { campaignState: true },
    });

    if (!lead || lead.optedOut) return;
    if (!lead.campaignState?.isActive || lead.campaignState.isPaused) return;

    // Status check — only run drip if still in drip-eligible statuses
    const dripStatuses = ['DRIP_ACTIVE'];
    if (!dripStatuses.includes(lead.status)) return;

    const dripStep = getDripStep(step);
    if (!dripStep) return;

    const body = dripStep.template(lead.name, SENDER_NAME);

    // Enqueue the actual SMS send
    await smsQueue.add(`drip-${leadId}-step${step}`, {
      leadId,
      phone: lead.phone,
      body,
      step,
      campaignType: 'DRIP',
    });

    // Schedule the next step
    if (!isAfterLastDripStep(step)) {
      const nextDelay = getNextDripDelay(step);
      if (nextDelay > 0) {
        await dripScheduleQueue.add(
          `drip-${leadId}-step${step + 1}`,
          { leadId, step: step + 1 },
          { delay: nextDelay }
        );
      }
    } else {
      // All steps done — enter 60-day rest, then restart
      await prisma.campaignState.update({
        where: { leadId },
        data: { restUntil: new Date(Date.now() + DRIP_REST_MS) },
      });
      await dripScheduleQueue.add(
        `drip-${leadId}-restart`,
        { leadId, step: 1 },
        { delay: DRIP_REST_MS }
      );
      console.log(`[DRIP] Lead ${leadId} entering 60-day rest`);
    }

    await prisma.campaignState.update({
      where: { leadId },
      data: { currentStep: step, nextSendAt: new Date() },
    });
  },
  { connection, concurrency: 10 }
);

// ── Nurture Schedule Worker ───────────────────────────────────────────────────
const nurtureWorker = new Worker<ScheduleJobData>(
  NURTURE_SCHEDULE_QUEUE,
  async (job: Job<ScheduleJobData>) => {
    const { leadId, step } = job.data;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { campaignState: true },
    });

    if (!lead || lead.optedOut) return;
    if (!lead.campaignState?.isActive || lead.campaignState.isPaused) return;

    // Stop nurture if deal progressed
    const stopStatuses = ['DEAL_SENT', 'DEAL_UNDER_REVIEW', 'CLOSED_WON', 'CLOSED_LOST'];
    if (stopStatuses.includes(lead.status)) {
      await prisma.campaignState.update({
        where: { leadId },
        data: { isActive: false },
      });
      return;
    }

    let body: string;
    let nextDelay: number;

    if (!isAfterLastNurtureTouch(step)) {
      const touch = getNurtureStep(step);
      if (!touch) return;
      body = touch.template(lead.name, SENDER_NAME);
      // Use gap between consecutive touches (absolute delays → relative gaps)
      nextDelay = step < 4 ? getNurtureGapMs(step, step + 1) : getLoopDelayMs();
    } else {
      // Infinite loop
      const cycleCount = lead.campaignState?.cycleCount ?? 0;
      body = getNurtureLoopVariant(cycleCount, lead.name);
      nextDelay = getLoopDelayMs();

      await prisma.campaignState.update({
        where: { leadId },
        data: { cycleCount: cycleCount + 1 },
      });
    }

    await smsQueue.add(`nurture-${leadId}-step${step}`, {
      leadId,
      phone: lead.phone,
      body,
      step,
      campaignType: 'NURTURE',
    });

    const nextStep = step + 1;
    await nurtureScheduleQueue.add(
      `nurture-${leadId}-step${nextStep}`,
      { leadId, step: nextStep },
      { delay: nextDelay }
    );

    await prisma.campaignState.update({
      where: { leadId },
      data: { currentStep: step, nextSendAt: new Date(Date.now() + nextDelay) },
    });
  },
  { connection, concurrency: 10 }
);

// ── Error Handlers ────────────────────────────────────────────────────────────
smsWorker.on('failed', (job, err) => {
  console.error(`[SMS] Job ${job?.id} failed:`, err.message);
});
dripWorker.on('failed', (job, err) => {
  console.error(`[DRIP] Job ${job?.id} failed:`, err.message);
});
nurtureWorker.on('failed', (job, err) => {
  console.error(`[NURTURE] Job ${job?.id} failed:`, err.message);
});

smsWorker.on('stalled', (jobId) => {
  console.warn(`[SMS] Job ${jobId} stalled`);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const shutdown = async () => {
  console.log('[Workers] Shutting down gracefully...');
  await Promise.all([
    smsWorker.close(),
    dripWorker.close(),
    nurtureWorker.close(),
  ]);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('[Workers] Campaign workers running...');
