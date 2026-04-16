import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const SMS_QUEUE = 'sms-send';
export const DRIP_SCHEDULE_QUEUE = 'drip-schedule';
export const NURTURE_SCHEDULE_QUEUE = 'nurture-schedule';

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

// ── Lazy singletons — instantiated only on first use at runtime ───────────────

let _connection: IORedis | undefined;
export function getConnection(): IORedis {
  if (!_connection) {
    _connection = new IORedis(process.env.UPSTASH_REDIS_URL!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: process.env.UPSTASH_REDIS_URL?.startsWith('rediss://') ? {} : undefined,
    });
  }
  return _connection;
}

let _smsQueue: Queue | undefined;
export function getSmsQueue(): Queue {
  if (!_smsQueue) {
    _smsQueue = new Queue(SMS_QUEUE, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 1000 },
      },
    });
  }
  return _smsQueue;
}

let _dripQueue: Queue | undefined;
export function getDripScheduleQueue(): Queue {
  if (!_dripQueue) {
    _dripQueue = new Queue(DRIP_SCHEDULE_QUEUE, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return _dripQueue;
}

let _nurtureQueue: Queue | undefined;
export function getNurtureScheduleQueue(): Queue {
  if (!_nurtureQueue) {
    _nurtureQueue = new Queue(NURTURE_SCHEDULE_QUEUE, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return _nurtureQueue;
}

// Legacy named exports for worker files (workers run in Node, not Next.js build)
export const smsQueue = { add: (...a: Parameters<Queue['add']>) => getSmsQueue().add(...a) };
export const dripScheduleQueue = { add: (...a: Parameters<Queue['add']>) => getDripScheduleQueue().add(...a) };
export const nurtureScheduleQueue = { add: (...a: Parameters<Queue['add']>) => getNurtureScheduleQueue().add(...a) };
