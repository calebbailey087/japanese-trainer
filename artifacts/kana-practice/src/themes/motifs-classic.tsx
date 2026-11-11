import type { ThemeId } from './ids';

const PETALS = [
  { l: '8%', d: '0s', t: '14s', s: 1 }, { l: '22%', d: '5s', t: '17s', s: 0.7 }, { l: '41%', d: '9s', t: '15s', s: 0.9 },
  { l: '63%', d: '2s', t: '19s', s: 0.6 }, { l: '78%', d: '7s', t: '16s', s: 1.1 }, { l: '91%', d: '11s', t: '18s', s: 0.8 },
];

export function ClassicMotif({ theme }: { theme: ThemeId }) {
  if (theme === 'sakura') return (
    <>
      <svg className="motif-corner motif-tr" viewBox="0 0 200 200" width="220" height="220">
        <path d="M200 20 C150 40 110 60 60 120" stroke="hsl(var(--ink) / .35)" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M130 60 C120 30 100 20 90 10" stroke="hsl(var(--ink) / .3)" strokeWidth="3" fill="none" strokeLinecap="round" />
        {[[150, 45], [100, 85], [70, 115], [95, 18], [175, 30]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            {[0, 72, 144, 216, 288].map((r) => (
              <ellipse key={r} cx="0" cy="-9" rx="6" ry="9" transform={`rotate(${r})`} fill="hsl(var(--sakura))" />
            ))}
            <circle r="2.5" fill="hsl(var(--primary) / .7)" />
          </g>
        ))}
      </svg>
      {PETALS.map((p, i) => (
        <span key={i} className="petal motif-moving" style={{ left: p.l, animationDelay: p.d, animationDuration: p.t, ['--s' as string]: p.s }} />
      ))}
    </>
  );
  if (theme === 'torii') return (
    <svg className="motif-corner motif-br" viewBox="0 0 240 200" width="300" height="250">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 34} ${i * 12}) scale(${1 - i * 0.18})`} opacity={1 - i * 0.28}>
          <path d="M10 40 Q120 22 230 40 L226 52 Q120 36 14 52 Z" fill="hsl(var(--ink) / .85)" />
          <rect x="30" y="58" width="180" height="10" fill="hsl(var(--primary))" />
          <rect x="54" y="48" width="14" height="160" fill="hsl(var(--primary))" />
          <rect x="172" y="48" width="14" height="160" fill="hsl(var(--primary))" />
          <rect x="112" y="52" width="16" height="16" fill="hsl(var(--primary) / .8)" />
        </g>
      ))}
    </svg>
  );
  if (theme === 'temple') return (
    <svg className="motif-corner motif-br" viewBox="0 0 300 160" width="360" height="190">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M0 ${70 + i * 14} Q75 ${62 + i * 14} 150 ${70 + i * 14} T300 ${70 + i * 14}`} stroke="hsl(var(--ink) / .18)" strokeWidth="1.5" fill="none" />
      ))}
      <ellipse cx="200" cy="105" rx="34" ry="18" fill="hsl(var(--ink) / .3)" />
      <ellipse cx="200" cy="105" rx="46" ry="26" stroke="hsl(var(--ink) / .16)" fill="none" />
      <ellipse cx="85" cy="120" rx="18" ry="9" fill="hsl(var(--primary) / .45)" />
      <path d="M240 60 L300 40 L300 60 Z" fill="hsl(var(--ink) / .25)" />
    </svg>
  );
  if (theme === 'yoru') return (
    <svg className="motif-corner motif-tr" viewBox="0 0 260 200" width="280" height="215">
      <circle cx="190" cy="70" r="40" fill="hsl(var(--primary) / .9)" />
      <circle cx="206" cy="58" r="36" fill="hsl(var(--background))" />
      {[[40, 40], [90, 110], [130, 30], [240, 150], [60, 170], [160, 160]].map(([x, y], i) => (
        <circle key={i} className="star" style={{ animationDelay: `${i * 0.7}s` }} cx={x} cy={y} r={i % 2 ? 1.6 : 2.2} fill="hsl(var(--foreground) / .8)" />
      ))}
    </svg>
  );
  return null;
}
