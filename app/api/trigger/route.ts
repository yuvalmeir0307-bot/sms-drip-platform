import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { dripScheduleQueue, nurtureScheduleQueue } from '@/lib/queue';

// Manual enrollment endpoint — enroll a single lead by leadId into drip or nurture
export async function POST(req: NextRequest) {
  const { leadId, campaignType = 'DRIP' } = await req.json();

  if (!leadId) {
    return NextResponse.json({ error: 'leadId required' }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (lead.optedOut) {
    return NextResponse.json({ error: 'Lead has opted out' }, { status: 400 });
  }

  if (campaignType === 'NURTURE') {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'FOLLOW_UP_POOL', campaignType: 'NURTURE' },
    });

    await prisma.campaignState.upsert({
      where: { leadId },
      create: {
        leadId,
        campaignType: 'NURTURE',
        currentStep: 0,
        isActive: true,
        isPaused: false,
        cycleCount: 0,
      },
      update: {
        campaignType: 'NURTURE',
        currentStep: 0,
        isActive: true,
        isPaused: false,
        cycleCount: 0,
      },
    });

    await nurtureScheduleQueue.add(
      `nurture-${leadId}-step1`,
      { leadId, step: 1 },
      { delay: 0, jobId: `nurture-${leadId}-step1-${Date.now()}` }
    );
  } else {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'DRIP_ACTIVE', campaignType: 'DRIP', enrolledAt: new Date() },
    });

    await prisma.campaignState.upsert({
      where: { leadId },
      create: {
        leadId,
        campaignType: 'DRIP',
        currentStep: 0,
        isActive: true,
        isPaused: false,
      },
      update: {
        campaignType: 'DRIP',
        currentStep: 0,
        isActive: true,
        isPaused: false,
        restUntil: null,
      },
    });

    await dripScheduleQueue.add(
      `drip-${leadId}-step1`,
      { leadId, step: 1 },
      { delay: 0, jobId: `drip-${leadId}-step1-${Date.now()}` }
    );
  }

  return NextResponse.json({ success: true, leadId, campaignType });
}
