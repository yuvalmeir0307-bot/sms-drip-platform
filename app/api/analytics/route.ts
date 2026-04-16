import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const [
    totalLeads,
    activeLeads,
    repliedLeads,
    qualifiedLeads,
    optedOutLeads,
    totalMessages,
    deliveredMessages,
    failedMessages,
    todayMessages,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: 'DRIP_ACTIVE' } }),
    prisma.lead.count({ where: { status: 'REPLIED' } }),
    prisma.lead.count({ where: { status: { in: ['QUALIFIED', 'FOLLOW_UP_POOL'] } } }),
    prisma.lead.count({ where: { optedOut: true } }),
    prisma.message.count({ where: { direction: 'OUTBOUND' } }),
    prisma.message.count({ where: { status: 'DELIVERED', direction: 'OUTBOUND' } }),
    prisma.message.count({ where: { status: 'FAILED', direction: 'OUTBOUND' } }),
    prisma.message.count({
      where: {
        direction: 'OUTBOUND',
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  const deliveryRate = totalMessages > 0 ? Math.round((deliveredMessages / totalMessages) * 100) : 0;
  const replyRate = totalMessages > 0 ? Math.round((repliedLeads / Math.max(totalLeads, 1)) * 100) : 0;
  const optOutRate = totalLeads > 0 ? Math.round((optedOutLeads / totalLeads) * 100) : 0;

  return NextResponse.json({
    totalLeads,
    activeLeads,
    repliedLeads,
    qualifiedLeads,
    optedOutLeads,
    totalMessages,
    deliveredMessages,
    failedMessages,
    todayMessages,
    deliveryRate,
    replyRate,
    optOutRate,
  });
}
