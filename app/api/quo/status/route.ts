import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateQuoSignature } from '@/lib/quo';

// Quo event types that carry status updates
const STATUS_EVENT_TYPES = new Set([
  'message.sent',
  'message.delivered',
  'message.failed',
]);

const STATUS_MAP: Record<string, 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED'> = {
  'message.sent': 'SENT',
  'message.delivered': 'DELIVERED',
  'message.failed': 'FAILED',
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (process.env.NODE_ENV === 'production') {
    const signature = req.headers.get('x-openphone-signature') ?? '';
    if (!validateQuoSignature(signature, rawBody, 'QUO_WEBHOOK_SECRET_STATUS')) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  let payload: { type: string; data: { object: Record<string, unknown> } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  if (!STATUS_EVENT_TYPES.has(payload.type)) {
    return new NextResponse('OK', { status: 200 });
  }

  const messageId = payload.data.object.id as string;
  const status = STATUS_MAP[payload.type];

  if (!messageId || !status) {
    return new NextResponse('Missing fields', { status: 400 });
  }

  await prisma.message.updateMany({
    where: { twilioSid: messageId },
    data: {
      status,
      ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
    },
  });

  return new NextResponse('OK', { status: 200 });
}
