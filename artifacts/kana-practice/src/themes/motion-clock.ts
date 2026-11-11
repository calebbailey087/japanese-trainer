export const SHOOTING_STAR_INTERVAL = 30 * 60 * 1000;

/**
 * An active-view clock: hidden time does not count, and a delayed tick fires at
 * most once. Call tick on visibility changes as well as at a regular interval.
 */
export function createActiveClock(intervalMs: number) {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) throw new Error('Invalid interval.');
  let last: number | null = null;
  let previouslyActive = false;
  let elapsed = 0;
  return {
    tick(now: number, active: boolean): boolean {
      if (!Number.isFinite(now)) return false;
      if (last !== null && previouslyActive) elapsed += Math.max(0, now - last);
      last = now;
      previouslyActive = active;
      if (!active || elapsed < intervalMs) return false;
      elapsed %= intervalMs;
      return true;
    },
  };
}
