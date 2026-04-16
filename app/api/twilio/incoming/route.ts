import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { updateLeadStatus } from '@/lib/notion';

const OPT_OUT_KEYWORDS = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
const OPT_IN_KEYWORDS = ['START', 'YES', 'UNSTOP'];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const from = formData.get('From') as string;
  const body = (formData.get('Body') as string)?.trim().toUpperCase();

  if (!from || !body) {
    return new NextResponse('Missing fields', { status: 400 });
  }

  const normalizedPhone = from;
  const messageBody = (formData.get('Body') as string)?.trim();

  // ── Opt-Out ──────────────────────────────────────────────────────────────
  if (OPT_OUT_KEYWORDS.includes(body)) {
    await prisma.optOut.upsert({
      where: { phone: normalizedPhone },
      create: { phone: normalizedPhone },
      update: {},
    });

    // Pause campaign for this lead
    const lead = await prisma.lead.findFirst({ where: { phone: normalizedPhone } });
    if (lead) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { optedOut: true, optedOutAt: new Date() },
      });
      await prisma.campaignState.updateMany({
        where: { leadId: lead.id },
        data: { isActive: false, isPaused: true },
      });
    }

    return twimlResponse('You have been unsubscribed. Reply START to resubscribe.');
  }

  // ── Opt-In ───────────────────────────────────────────────────────────────
  if (OPT_IN_KEYWORDS.includes(body)) {
    await prisma.optOut.deleteMany({ where: { phone: normalizedPhone } });
    const lead = await prisma.lead.findFirst({ where: { phone: normalizedPhone } });
    if (lead) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { optedOut: false, optedOutAt: null },
      });
    }
    return twimlResponse('You have been re-subscribed.');
  }

  // ── Normal Reply — pause drip, flag as Replied ───────────────────────────
  const lead = await prisma.lead.findFirst({
    where: { phone: normalizedPhone },
    include: { campaignState: true },
  });

  if (lead) {
    // Record inbound message
    await prisma.message.create({
      data: {
        leadId: lead.id,
        direction: 'INBOUND',
        body: messageBody,
        status: 'RECEIVED',
      },
    });

    // Pause drip campaign
    if (lead.campaignState?.isActive) {
      await prisma.campaignState.update({
        where: { leadId: lead.id },
        data: { isPaused: true },
      });
    }

    // Update lead status to Replied if still in drip
    if (lead.status === 'DRIP_ACTIVE') {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: 'REPLIED', repliedAt: new Date() },
      });

      // Sync back to Notion
      if (lead.notionId) {
        try {
          await updateLeadStatus(lead.notionId, 'Replied');
        } catch (err) {
          console.error('[Webhook] Failed to update Notion status:', err);
        }
      }
    }
  }

  // No auto-response for real replies — handled manually
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  });
}

function twimlResponse(message: string) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}
