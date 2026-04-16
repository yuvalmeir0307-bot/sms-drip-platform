import { PrismaClient } from '@prisma/client';
import { getDripActiveLeads } from '../lib/notion';
import { lookupPhone } from '../lib/twilio';
import { dripScheduleQueue } from '../lib/queue';

const prisma = new PrismaClient();

const POLL_INTERVAL_MS = 2 * 60 * 1000; // every 2 minutes

async function pollNotion() {
  try {
    const leads = await getDripActiveLeads();
    console.log(`[Poller] Found ${leads.length} Drip Active leads in Notion`);

    for (const notionLead of leads) {
      // Skip if already enrolled
      const existing = await prisma.lead.findUnique({
        where: { notionId: notionLead.notionId },
      });

      if (existing) {
        // Already in DB — skip if already drip active or further
        const skipStatuses = [
          'DRIP_ACTIVE', 'REPLIED', 'QUALIFIED', 'FOLLOW_UP_POOL',
          'DEAL_SENT', 'DEAL_UNDER_REVIEW', 'CLOSED_WON', 'CLOSED_LOST',
        ];
        if (skipStatuses.includes(existing.status)) continue;
      }

      // Validate phone number via Twilio Lookup
      const lookup = await lookupPhone(notionLead.phone);
      if (!lookup.valid) {
        console.warn(`[Poller] Invalid phone ${notionLead.phone} for ${notionLead.name} — skipping`);
        continue;
      }

      // Check opt-out list
      const optOut = await prisma.optOut.findUnique({ where: { phone: notionLead.phone } });
      if (optOut) {
        console.warn(`[Poller] Phone ${notionLead.phone} is opted out — skipping`);
        continue;
      }

      // Upsert lead
      const lead = await prisma.lead.upsert({
        where: { notionId: notionLead.notionId },
        create: {
          notionId: notionLead.notionId,
          name: notionLead.name,
          phone: notionLead.phone,
          status: 'DRIP_ACTIVE',
          campaignType: 'DRIP',
          enrolledAt: new Date(),
        },
        update: {
          status: 'DRIP_ACTIVE',
          enrolledAt: new Date(),
        },
      });

      // Create or reset campaign state
      await prisma.campaignState.upsert({
        where: { leadId: lead.id },
        create: {
          leadId: lead.id,
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

      // Enqueue step 1 (immediate)
      await dripScheduleQueue.add(
        `drip-${lead.id}-step1`,
        { leadId: lead.id, step: 1 },
        { delay: 0, jobId: `drip-${lead.id}-step1-${Date.now()}` }
      );

      console.log(`[Poller] Enrolled ${lead.name} (${lead.phone}) into drip campaign`);
    }
  } catch (err) {
    console.error('[Poller] Error polling Notion:', err);
  }
}

// Run immediately, then on interval
pollNotion();
setInterval(pollNotion, POLL_INTERVAL_MS);

const shutdown = async () => {
  console.log('[Poller] Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('[Poller] Notion poller started — checking every 2 minutes');
