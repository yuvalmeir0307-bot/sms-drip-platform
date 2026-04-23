import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { dripScheduleQueue } from '@/lib/queue';

export async function POST(req: NextRequest) {
  const { name, phone } = await req.json();

  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'name and phone required' }, { status: 400 });
  }

  // Normalize phone to E.164
  const normalized = phone.trim().replace(/\D/g, '');
  const e164 = normalized.startsWith('1') ? `+${normalized}` : `+1${normalized}`;

  // Check opt-out
  const optedOut = await prisma.optOut.findUnique({ where: { phone: e164 } });
  if (optedOut) {
    return NextResponse.json({ error: 'This number has opted out' }, { status: 400 });
  }

  // Create or re-enroll existing lead
  let lead = await prisma.lead.findFirst({ where: { phone: e164 } });
  if (lead) {
    lead = await prisma.lead.update({
      where: { id: lead.id },
      data: { name: name.trim(), status: 'DRIP_ACTIVE', campaignType: 'DRIP', enrolledAt: new Date() },
    });
  } else {
    lead = await prisma.lead.create({
      data: { name: name.trim(), phone: e164, status: 'DRIP_ACTIVE', campaignType: 'DRIP', enrolledAt: new Date() },
    });
  }

  // Reset / create campaign state
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

  // Kick off drip step 1 immediately
  await dripScheduleQueue.add(
    `drip-${lead.id}-step1`,
    { leadId: lead.id, step: 1 },
    { delay: 0, jobId: `drip-${lead.id}-step1-${Date.now()}` }
  );

  return NextResponse.json({ success: true, lead });
}
