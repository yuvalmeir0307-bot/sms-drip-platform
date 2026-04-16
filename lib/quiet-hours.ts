// Quiet hours: no SMS between 9pm and 8am
// Checked at job EXECUTION time (not just enqueue time)

const DEFAULT_QUIET_START = 21; // 9pm
const DEFAULT_QUIET_END = 8;    // 8am

export function isQuietHours(
  quietStart = DEFAULT_QUIET_START,
  quietEnd = DEFAULT_QUIET_END
): boolean {
  const hour = new Date().getHours();
  if (quietStart > quietEnd) {
    // spans midnight: e.g. 21 → 8
    return hour >= quietStart || hour < quietEnd;
  }
  return hour >= quietStart && hour < quietEnd;
}

// Returns ms until quiet hours end (i.e. until quietEnd o'clock today or tomorrow)
export function msUntilQuietHoursEnd(
  quietEnd = DEFAULT_QUIET_END
): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(quietEnd, 0, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}
