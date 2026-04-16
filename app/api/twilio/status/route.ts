import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const messageSid = formData.get('MessageSid') as string;
  const messageStatus = formData.get('MessageStatus') as string;

  if (!messageSid || !messageStatus) {
    return new NextResponse('Missing fields', { status: 400 });
  }

  const statusMap: Record<string, string> = {
    queued: 'QUEUED',
    sent: 'SENT',
    delivered: 'DELIVERED',
    failed: 'FAILED',
    undelivered: 'FAILED',
  };

  const prismaStatus = statusMap[messageStatus] ?? 'SENT';

  await prisma.message.updateMany({
    where: { twilioSid: messageSid },
    data: {
      status: prismaStatus as 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED',
      ...(prismaStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
    },
  });

  return new NextResponse('OK', { status: 200 });
}
