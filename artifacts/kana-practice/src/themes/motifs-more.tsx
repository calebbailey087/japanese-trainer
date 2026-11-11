import type { ThemeId } from './ids';

export function MoreMotif({ theme }: { theme: ThemeId }) {
  switch (theme) {
    case 'sage-cream': return (
      <svg className="motif-corner motif-br" viewBox="0 0 200 200" width="200" height="200">
        <path d="M40 190 C80 140 110 90 170 30" stroke="hsl(var(--primary) / .45)" strokeWidth="2.5" fill="none" />
        {[[70, 150, -30], [95, 115, 20], [120, 85, -35], [145, 58, 15]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx="16" ry="7" transform={`rotate(${r - 20} ${x} ${y})`} fill="hsl(var(--primary) / .22)" />
        ))}
      </svg>
    );
    case 'mocha': return (
      <svg className="motif-corner motif-br" viewBox="0 0 220 200" width="220" height="200">
        <ellipse cx="100" cy="110" rx="80" ry="28" fill="hsl(var(--primary) / .22)" />
        <path d="M100 96 C86 104 86 120 100 128 C114 120 114 104 100 96Z M100 100 V128" stroke="hsl(var(--card))" strokeWidth="3" fill="none" />
        <path d="M180 104 q28 4 18 26 q-8 10 -22 4" stroke="hsl(var(--ink) / .3)" strokeWidth="5" fill="none" />
        <path className="steam motif-moving" d="M100 70 q-10 -18 0 -34 q10 -16 0 -30" stroke="hsl(var(--ink) / .18)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
    case 'midnight-ink': return (
      <svg className="motif-corner motif-br" viewBox="0 0 200 200" width="180" height="180">
        <path d="M150 60 A60 60 0 1 0 160 110" stroke="hsl(var(--primary) / .35)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
    case 'lofi': return (
      <>
        <div className="lamp-glow" />
        <svg className="motif-corner motif-tr" viewBox="0 0 200 200" width="200" height="200">
          <path d="M60 40 L120 40 L140 80 L40 80 Z" fill="hsl(var(--primary) / .7)" />
          <path d="M90 80 L90 150 M60 150 H120" stroke="hsl(var(--foreground) / .35)" strokeWidth="5" strokeLinecap="round" />
        </svg>
        <svg className="motif-corner motif-br" viewBox="0 0 200 120" width="220" height="132">
          <rect x="20" y="80" width="160" height="12" rx="3" fill="hsl(var(--foreground) / .15)" />
          <rect x="40" y="56" width="70" height="10" rx="2" fill="hsl(var(--primary) / .35)" />
          <rect x="46" y="66" width="60" height="14" rx="2" fill="hsl(var(--accent))" />
          <path d="M140 50 h26 v30 h-26 z M166 58 q10 0 10 8 q0 8 -10 8" stroke="hsl(var(--foreground) / .3)" strokeWidth="3" fill="none" />
        </svg>
      </>
    );
    default: return null;
  }
}
