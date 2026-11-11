import type { ThemeId } from './ids';

export const MAPLE = 'M0-11 L2.5-4.5 L9-7 L6-0.5 L10.5 3 L3.5 3.5 L1.5 10 L0 5.5 L-1.5 10 L-3.5 3.5 L-10.5 3 L-6-0.5 L-9-7 L-2.5-4.5Z';
const LEAVES = [
  { l: '6%', d: '0s', t: '22s', s: 1 }, { l: '31%', d: '8s', t: '26s', s: 0.8 },
  { l: '57%', d: '3s', t: '24s', s: 1.1 }, { l: '84%', d: '13s', t: '28s', s: 0.9 },
];

export function JapanMotif({ theme }: { theme: ThemeId }) {
  switch (theme) {
    case 'matcha': return (
      <svg className="motif-corner motif-br" viewBox="0 0 260 180" width="300" height="210">
        <path d="M40 80 Q130 180 220 80 Z" fill="hsl(var(--primary) / .28)" />
        <path d="M30 80 H230" stroke="hsl(var(--ink) / .35)" strokeWidth="3" strokeLinecap="round" />
        {[18, 30, 42].map((r) => <ellipse key={r} cx="130" cy="80" rx={r * 2} ry={r / 3} stroke="hsl(var(--ink) / .16)" fill="none" />)}
        <path d="M80 160 H180" stroke="hsl(var(--ink) / .25)" strokeWidth="6" strokeLinecap="round" />
        <path className="steam motif-moving" d="M120 60 q-10 -18 0 -34 q10 -16 0 -30" stroke="hsl(var(--ink) / .2)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
    case 'fuji': return (
      <>
        <div className="fuji-glow" />
        <svg className="motif-wide" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice">
          <path d="M0 300 L380 120 Q520 40 560 40 L640 40 Q690 40 820 120 L1200 300 Z" fill="hsl(var(--primary) / .08)" />
          <path d="M380 120 Q520 40 560 40 L640 40 Q690 40 820 120" stroke="hsl(var(--primary) / .35)" strokeWidth="2" fill="none" />
          <path d="M500 78 L540 92 L572 74 L610 96 L650 72 L690 88 L716 78" stroke="hsl(var(--primary) / .28)" strokeWidth="1.5" fill="none" />
        </svg>
      </>
    );
    case 'konbini': return (
      <>
        <div className="konbini-stripes" />
        <svg className="motif-corner motif-tr" viewBox="0 0 200 120" width="200" height="120">
          {[0, 1, 2, 3].map((i) => <rect key={i} x={20 + i * 42} y="20" width="38" height="70" rx="3" fill="none" stroke="hsl(var(--ink) / .14)" strokeWidth="2" />)}
          <rect x="10" y="10" width="180" height="10" fill="hsl(var(--primary) / .35)" />
        </svg>
      </>
    );
    case 'shinkansen': return (
      <>
        <div className="shink-stripe" />
        <svg className="motif-corner motif-br" viewBox="0 0 320 120" width="340" height="128">
          <path d="M320 40 H120 Q30 44 8 90 L320 90 Z" fill="hsl(var(--card))" stroke="hsl(var(--ink) / .22)" strokeWidth="2" />
          <path d="M60 74 H320" stroke="hsl(var(--primary) / .7)" strokeWidth="6" />
          {[150, 190, 230, 270].map((x) => <rect key={x} x={x} y="50" width="26" height="12" rx="3" fill="hsl(var(--ink) / .2)" />)}
          <path d="M0 104 H320" stroke="hsl(var(--ink) / .2)" strokeWidth="2" strokeDasharray="10 6" />
        </svg>
      </>
    );
    case 'neon-shinjuku': return (
      <svg className="motif-corner motif-tr neon-sign" viewBox="0 0 220 220" width="230" height="230">
        <rect x="120" y="10" width="70" height="190" rx="10" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" />
        <text x="155" y="60" textAnchor="middle" className="font-kana" fontSize="34" fontWeight="900" fill="hsl(var(--primary))">よ</text>
        <text x="155" y="105" textAnchor="middle" className="font-kana" fontSize="34" fontWeight="900" fill="hsl(var(--primary))">る</text>
        <text x="155" y="150" textAnchor="middle" className="font-kana" fontSize="34" fontWeight="900" fill="hsl(var(--primary))">の</text>
        <rect x="20" y="60" width="80" height="44" rx="8" fill="none" stroke="hsl(186 80% 60%)" strokeWidth="3" className="neon-alt" />
        <text x="60" y="90" textAnchor="middle" fontSize="18" fontWeight="800" fill="hsl(186 80% 62%)" className="neon-alt">OPEN</text>
      </svg>
    );
    case 'washi': return (
      <svg className="motif-corner motif-br" viewBox="0 0 260 200" width="280" height="215">
        <path d="M20 150 C80 120 140 170 240 130" stroke="hsl(var(--ink) / .3)" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M40 170 C110 158 170 182 230 160" stroke="hsl(var(--ink) / .14)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <rect x="170" y="40" width="54" height="54" rx="8" fill="none" stroke="hsl(var(--primary) / .55)" strokeWidth="5" transform="rotate(-6 197 67)" />
        <text x="197" y="76" textAnchor="middle" className="font-kana" fontSize="22" fontWeight="900" fill="hsl(var(--primary) / .55)" transform="rotate(-6 197 67)">かな</text>
      </svg>
    );
    case 'koi': return (
      <svg className="motif-corner motif-br" viewBox="0 0 260 200" width="300" height="230">
        {[0, 1, 2].map((i) => <circle key={i} className="ripple motif-moving" style={{ animationDelay: `${i * 3}s` }} cx="130" cy="110" r="60" fill="none" stroke="hsl(var(--foreground) / .25)" strokeWidth="1.5" />)}
        <circle cx="130" cy="110" r="26" fill="none" stroke="hsl(var(--foreground) / .14)" />
        <path d="M200 150 a26 26 0 1 0 1 0 l-14 14 Z" fill="hsl(150 40% 34% / .5)" />
      </svg>
    );
    case 'momiji': return (
      <>
        <svg className="motif-corner motif-tr" viewBox="0 0 200 160" width="210" height="170">
          <path d="M200 30 C150 40 110 70 70 120" stroke="hsl(var(--ink) / .3)" strokeWidth="4" fill="none" strokeLinecap="round" />
          {[[150, 42, 1.6, 'primary'], [110, 72, 1.3, 'accent-foreground'], [82, 108, 1.1, 'primary'], [175, 64, 1, 'accent-foreground']].map(([x, y, s, c], i) => (
            <path key={i} d={MAPLE} transform={`translate(${x} ${y}) scale(${s}) rotate(${i * 25})`} fill={`hsl(var(--${c}) / .7)`} />
          ))}
        </svg>
        {LEAVES.map((p, i) => (
          <svg key={i} className="leaf motif-moving" viewBox="-12 -12 24 24" width="18" height="18" style={{ left: p.l, animationDelay: p.d, animationDuration: p.t, ['--s' as string]: p.s }}>
            <path d={MAPLE} fill={i % 2 ? 'hsl(var(--primary) / .75)' : 'hsl(2 62% 40% / .7)'} />
          </svg>
        ))}
      </>
    );
    case 'onsen': return (
      <>
        <div className="onsen-mist" />
        <svg className="motif-corner motif-br" viewBox="0 0 280 200" width="300" height="215">
          {[0, 1, 2].map((i) => (
            <path key={i} className="steam motif-moving" style={{ animationDelay: `${i * 2.4}s` }} d={`M${90 + i * 50} 120 q-14 -24 0 -48 q14 -24 0 -48`} stroke="hsl(var(--foreground) / .22)" strokeWidth="5" fill="none" strokeLinecap="round" />
          ))}
          <path d="M40 130 Q140 110 250 130 L250 150 L40 150 Z" fill="hsl(var(--accent) / .9)" />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={30 + i * 40} y="152" width="36" height="40" fill="hsl(var(--primary) / .3)" />)}
        </svg>
      </>
    );
    case 'ukiyo-e': return (
      <svg className="motif-corner motif-br" viewBox="0 0 320 220" width="360" height="245">
        <path d="M0 220 L0 150 Q60 110 120 140 Q150 60 230 40 Q300 30 320 80 Q270 60 240 90 Q270 90 280 120 Q230 100 210 140 Q260 150 320 140 L320 220 Z" fill="hsl(var(--primary) / .18)" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${20 + i * 30} ${200 - i * 14} Q${120 + i * 20} ${120 - i * 10} ${230 - i * 4} ${60 + i * 10}`} stroke="hsl(var(--primary) / .45)" strokeWidth="2" fill="none" />
        ))}
        {[[240, 46], [262, 58], [282, 52], [298, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="hsl(var(--card))" stroke="hsl(var(--primary) / .5)" />)}
      </svg>
    );
    default: return null;
  }
}
