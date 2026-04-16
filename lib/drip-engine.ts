import { addHours, addDays, addMinutes } from 'date-fns';

export const DRIP_STEPS = [
  {
    step: 1,
    delayMs: 0, // immediate on enrollment
    template: (name: string, senderName: string) =>
      `Hi ${name}, this is ${senderName}. I'm looking to buy a house in the area, can you get back to me?`,
  },
  {
    step: 2,
    delayMs: hoursMs(5), // ~5 hrs same day
    template: (_name: string, _senderName: string) =>
      `Hi, can you help me with this? Are you available for a quick call today?`,
  },
  {
    step: 3,
    delayMs: hoursMs(24), // day 2
    template: (name: string, _senderName: string) =>
      `Hi ${name}, I wanted to verify — are you still active with your license or not anymore?`,
  },
  {
    step: 4,
    delayMs: hoursMs(48), // day 3
    template: (_name: string, _senderName: string) =>
      `Hi, trying again — did you get my earlier message? Would love to connect.`,
  },
  {
    step: 5,
    delayMs: hoursMs(72), // day 4
    template: (_name: string, _senderName: string) =>
      `Hey, maybe you missed this — I'm a serious cash buyer looking in your area. Let me know if you have anything or know someone.`,
  },
];

export const DRIP_REST_MS = daysMs(60);

export function getDripStep(step: number) {
  return DRIP_STEPS.find((s) => s.step === step) ?? null;
}

export function getNextDripDelay(currentStep: number): number {
  const nextStep = DRIP_STEPS.find((s) => s.step === currentStep + 1);
  if (!nextStep) return -1; // no next step
  return nextStep.delayMs;
}

export function isAfterLastDripStep(step: number) {
  return step >= DRIP_STEPS.length;
}

function hoursMs(hours: number) {
  return hours * 60 * 60 * 1000;
}

function daysMs(days: number) {
  return days * 24 * 60 * 60 * 1000;
}
