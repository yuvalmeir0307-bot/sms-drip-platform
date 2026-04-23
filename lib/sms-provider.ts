import { sendSMS as sendViaTwilio } from './twilio';
import { sendSMS as sendViaQuo } from './quo';

export interface SendSMSParams {
  to: string;
  body: string;
}

export type SMSProvider = 'twilio' | 'quo';

export function getActiveProvider(): SMSProvider {
  const p = process.env.SMS_PROVIDER?.toLowerCase();
  return p === 'quo' ? 'quo' : 'twilio';
}

export async function sendSMS(params: SendSMSParams): Promise<{ sid: string }> {
  if (getActiveProvider() === 'quo') {
    return sendViaQuo(params);
  }
  return sendViaTwilio(params);
}
