export interface SessionClock {
  deadline: number;
  pausedAt: number | null;
}

export function createClock(durationMs: number, now = Date.now()): SessionClock {
  return { deadline: now + durationMs, pausedAt: null };
}

export function remainingTime(clock: SessionClock, now = Date.now()): number {
  return Math.max(0, clock.deadline - (clock.pausedAt ?? now));
}

export function pauseClock(clock: SessionClock, now = Date.now()): SessionClock {
  if (clock.pausedAt !== null || remainingTime(clock, now) === 0) return clock;
  return { ...clock, pausedAt: now };
}

export function resumeClock(clock: SessionClock, now = Date.now()): SessionClock {
  if (clock.pausedAt === null) return clock;
  return { deadline: clock.deadline + Math.max(0, now - clock.pausedAt), pausedAt: null };
}
