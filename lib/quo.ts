import crypto from 'crypto';

const QUO_API_BASE = 'https://api.openphone.com/v1';

export interface SendSMSParams {
  to: string;
  body: string;
}

export async function sendSMS({ to, body }: SendSMSParams) {
  const apiKey = process.env.QUO_API_KEY!;
  const fromNumber = process.env.QUO_PHONE_NUMBER!;

  const res = await fetch(`${QUO_API_BASE}/messages`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromNumber, to: [to], content: body }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Quo API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const msg = json.data;
  return { sid: msg.id, ...msg };
}

export async function listPhoneNumbers(): Promise<Array<{ id: string; phoneNumber: string; name: string }>> {
  const res = await fetch(`${QUO_API_BASE}/phone-numbers`, {
    headers: { Authorization: process.env.QUO_API_KEY! },
  });
  if (!res.ok) throw new Error(`Quo API error ${res.status}`);
  const json = await res.json();
  return json.data;
}

export function validateQuoSignature(signature: string, rawBody: string, secretEnvVar: string): boolean {
  const secret = process.env[secretEnvVar];
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
