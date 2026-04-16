// Nurture campaign — runs after lead is in Follow-up Pool (Qualified)
// 4 fixed touches then infinite loop with variations every 10–30 days

export const NURTURE_TOUCHES = [
  {
    step: 1,
    delayMs: daysMs(7),
    template: (name: string, _senderName: string) =>
      `Hi ${name}, enjoyed talking last week. Anything interesting come up since?`,
  },
  {
    step: 2,
    delayMs: daysMs(14),
    template: (name: string, _senderName: string) =>
      `Hi ${name}, what do you think about interest rates/the economy right now? Should I keep buying or wait?`,
  },
  {
    step: 3,
    delayMs: daysMs(30),
    template: (name: string, _senderName: string) =>
      `Hi ${name}, if you ever need a recommendation for a contractor or cleaner for your clients, let me know — happy to help.`,
  },
  {
    step: 4,
    delayMs: daysMs(45),
    template: (name: string, _senderName: string) =>
      `By the way ${name}, do you have anything dirty/neglected coming to market soon? I'm ready to buy cash.`,
  },
];

// Loop variants — cycled after the 4 fixed touches
const LOOP_VARIANTS = [
  (name: string) =>
    `Hey ${name}, still looking to buy in your area. Anything off-market or coming soon?`,
  (name: string) =>
    `Hi ${name}, quick check-in — how's the market looking out there lately?`,
  (name: string) =>
    `Hey ${name}, any distressed or fixer-upper properties on your radar? Cash buyer, quick close.`,
  (name: string) =>
    `Hi ${name}, hope things are going well. Still actively buying — let me know if anything pops up.`,
];

export const NURTURE_LOOP_MIN_DAYS = 10;
export const NURTURE_LOOP_MAX_DAYS = 30;

export function getNurtureStep(step: number) {
  return NURTURE_TOUCHES.find((t) => t.step === step) ?? null;
}

export function getNurtureLoopVariant(cycleCount: number, name: string): string {
  const variant = LOOP_VARIANTS[cycleCount % LOOP_VARIANTS.length];
  return variant(name);
}

export function getLoopDelayMs(): number {
  const days =
    NURTURE_LOOP_MIN_DAYS +
    Math.floor(
      Math.random() * (NURTURE_LOOP_MAX_DAYS - NURTURE_LOOP_MIN_DAYS + 1)
    );
  return daysMs(days);
}

export function isAfterLastNurtureTouch(step: number) {
  return step >= NURTURE_TOUCHES.length;
}

// Returns the gap (ms) between two consecutive touches.
// Delays in NURTURE_TOUCHES are absolute from enrollment, so gap = next.delayMs - current.delayMs
export function getNurtureGapMs(fromStep: number, toStep: number): number {
  const from = NURTURE_TOUCHES.find((t) => t.step === fromStep);
  const to = NURTURE_TOUCHES.find((t) => t.step === toStep);
  if (!from || !to) return getLoopDelayMs();
  return Math.max(to.delayMs - from.delayMs, daysMs(1)); // min 1 day gap
}

function daysMs(days: number) {
  return days * 24 * 60 * 60 * 1000;
}
