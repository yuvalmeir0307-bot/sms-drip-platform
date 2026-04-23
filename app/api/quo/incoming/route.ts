import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { updateLeadStatus } from '@/lib/notion';
import { validateQuoSignature } from '@/lib/quo';

const OPT_OUT_KEYWORDS = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
const OPT_IN_KEYWORDS = ['START', 'YES', 'UNSTOP'];

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (process.env.NODE_ENV === 'production') {
    const signature = req.headers.get('x-openphone-signature') ?? '';
    if (!validateQuoSignature(signature, rawBody, 'QUO_WEBHOOK_SECRET_INCOMING')) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  let payload: { type: string; data: { object: Record<string, unknown> } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  const { type } = payload;

  // ── Incoming Call ──────────────────────────────────────────────────────────
  if (type === 'call.ringing') {
    const call = payload.data.object;
    const direction = call.direction as string;
    if (direction !== 'incoming') return new NextResponse('OK', { status: 200 });

    const from = call.from as string;
    if (!from) return new NextResponse('OK', { status: 200 });

    await markLeadReplied(from, '[Incoming call]');
    return new NextResponse('OK', { status: 200 });
  }

  // ── Incoming SMS ───────────────────────────────────────────────────────────
  if (type !== 'message.received') {
    return new NextResponse('OK', { status: 200 });
  }

  const msg = payload.data.object;
  const from = msg.from as string;
  const messageBody = (msg.body as string) ?? '';

  if (!from) return new NextResponse('Missing fields', { status: 400 });

  const normalizedPhone = from;
  const upperBody = messageBody.trim().toUpperCase();

  // ── Opt-Out ────────────────────────────────────────────────────────────────
  if (OPT_OUT_KEYWORDS.includes(upperBody)) {
    await prisma.optOut.upsert({
      where: { phone: normalizedPhone },
      create: { phone: normalizedPhone },
      update: {},
    });

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
    return new NextResponse('OK', { status: 200 });
  }

  // ── Opt-In ─────────────────────────────────────────────────────────────────
  if (OPT_IN_KEYWORDS.includes(upperBody)) {
    await prisma.optOut.deleteMany({ where: { phone: normalizedPhone } });
    const lead = await prisma.lead.findFirst({ where: { phone: normalizedPhone } });
    if (lead) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { optedOut: false, optedOutAt: null },
      });
    }
    return new NextResponse('OK', { status: 200 });
  }

  // ── Normal SMS Reply ───────────────────────────────────────────────────────
  await markLeadReplied(normalizedPhone, messageBody);
  return new NextResponse('OK', { status: 200 });
}

async function markLeadReplied(phone: string, messageBody: string) {
  const lead = await prisma.lead.findFirst({
    where: { phone },
    include: { campaignState: true },
  });

  if (!lead) return;

  await prisma.message.create({
    data: {
      leadId: lead.id,
      direction: 'INBOUND',
      body: messageBody,
      status: 'RECEIVED',
    },
  });

  if (lead.campaignState?.isActive) {
    await prisma.campaignState.update({
      where: { leadId: lead.id },
      data: { isPaused: true },
    });
  }

  if (lead.status === 'DRIP_ACTIVE') {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'REPLIED', repliedAt: new Date() },
    });

    if (lead.notionId) {
      try {
        await updateLeadStatus(lead.notionId, 'Replied');
      } catch (err) {
        console.error('[Quo Webhook] Failed to update Notion status:', err);
      }
    }
  }
}
