import { useCallback, useEffect, useState } from 'react';
import { stopSpeech } from '@/learning/audio';
import { createClock, pauseClock, remainingTime, resumeClock } from './session-clock';

/** Count only active session time. Question components stay mounted while paused. */
export function useSessionTimer(minutes: number) {
  const [clock, setClock] = useState(() => createClock(minutes * 60000));
  const [now, setNow] = useState(Date.now());
  const paused = clock.pausedAt !== null;
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [paused]);
  const pause = () => {
    const at = Date.now();
    setClock((current) => pauseClock(current, at));
    setNow(at);
    stopSpeech();
  };
  const resume = () => {
    const at = Date.now();
    setClock((current) => resumeClock(current, at));
    setNow(at);
  };
  const readRemaining = useCallback(() => remainingTime(clock), [clock]);
  return { remaining: remainingTime(clock, now), paused, pause, resume, readRemaining };
}
