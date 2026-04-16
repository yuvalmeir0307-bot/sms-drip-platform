import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export interface SendSMSParams {
  to: string;
  body: string;
}

export async function sendSMS({ to, body }: SendSMSParams) {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  const message = await client.messages.create({
    body,
    to,
    ...(messagingServiceSid
      ? { messagingServiceSid }
      : { from: process.env.TWILIO_PHONE_NUMBER! }),
    statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/status`,
  });

  return message;
}

export async function lookupPhone(phone: string) {
  try {
    const result = await client.lookups.v2.phoneNumbers(phone).fetch();
    return { valid: result.valid, lineType: result.lineTypeIntelligence };
  } catch {
    return { valid: false, lineType: null };
  }
}

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
) {
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  );
}

export default client;
