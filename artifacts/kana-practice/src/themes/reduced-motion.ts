import { useEffect, useState } from 'react';
import { useStore } from '@/storage/store';

const Q = '(prefers-reduced-motion: reduce)';

export function useSystemReducedMotion() {
  const [on, setOn] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(Q).matches);
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia(Q);
    const fn = () => setOn(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return on;
}

/** User toggle OR system preference; the system preference can never be overridden. */
export function useEffectiveReducedMotion() {
  const { data } = useStore();
  const sys = useSystemReducedMotion();
  return data.settings.reduceMotion === true || sys;
}
