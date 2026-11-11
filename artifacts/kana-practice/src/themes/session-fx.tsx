import { useEffect, useState } from 'react';

/** Washi: red seal for correct first answers. */
export function Hanko() {
  return <span className="hanko font-kana" data-testid="fx-hanko">よし</span>;
}

/** Koi Pond: swims across once when a session completes; static when motion is reduced. */
export function KoiSwim() {
  const [moving, setMoving] = useState(true);
  useEffect(() => { const t = window.setTimeout(() => setMoving(false), 9500); return () => window.clearTimeout(t); }, []);
  return (
    <svg className={`koi-swim ${moving ? 'moving' : ''}`} viewBox="0 0 160 60" width="160" height="60" aria-hidden="true" data-testid="fx-koi">
      <g className="tail"><path d="M30 30 L4 14 Q12 30 4 46 Z" fill="hsl(22 90% 58%)" /></g>
      <ellipse cx="80" cy="30" rx="54" ry="18" fill="hsl(40 60% 96%)" />
      <path d="M60 14 Q80 20 92 14 Q96 30 84 40 Q66 42 60 30 Z" fill="hsl(22 90% 56%)" />
      <circle cx="116" cy="24" r="12" fill="hsl(22 90% 56%)" />
      <circle cx="124" cy="26" r="2" fill="hsl(200 40% 12%)" />
      <path d="M70 46 l10 10 l6 -10 Z M70 14 l10 -10 l6 10 Z" fill="hsl(40 60% 92%)" />
    </svg>
  );
}