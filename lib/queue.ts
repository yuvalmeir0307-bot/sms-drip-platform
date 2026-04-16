import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const connection = new IORedis(process.env.UPSTASH_REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: process.env.UPSTASH_REDIS_URL?.startsWith('rediss://') ? {} : undefined,
});

export const SMS_QUEUE = 'sms-send';
export const DRIP_SCHEDULE_QUEUE = 'drip-schedule';
export const NURTURE_SCHEDULE_QUEUE = 'nurture-schedule';

export const smsQueue = new Queue(SMS_QUEUE, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
});

export const dripScheduleQueue = new Queue(DRIP_SCHEDULE_QUEUE, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
});

export const nurtureScheduleQueue = new Queue(NURTURE_SCHEDULE_QUEUE, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
});

export interface SMSJobData {
  leadId: string;
  phone: string;
  body: string;
  step: number;
  campaignType: 'DRIP' | 'NURTURE';
}

export interface ScheduleJobData {
  leadId: string;
  step: number;
}
