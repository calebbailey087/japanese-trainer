/** Compact palette specs; full light + dark token sets are generated from them. */
export interface PaletteSpec {
  hue: number; sat: number;            // neutral tint of surfaces
  inkHue: number; inkSat: number;      // text ink (light mode)
  pL: string; pD: string;              // primary for light / dark
  accentHue: number;
  accentL?: string; accentD?: string;
  fgD?: string;                        // dark-mode text override
  darkSat?: number;
}

export type Tokens = Record<string, string>;

export function generateTokens(p: PaletteSpec, dark: boolean): Tokens {
  const { hue: h, sat: s, inkHue: ih, inkSat: is, accentHue: ah } = p;
  if (!dark) {
    const fg = `${ih} ${is}% 14%`;
    const card = `${h} ${Math.min(s + 18, 75)}% 98.5%`;
    const accent = p.accentL ?? `${ah} 58% 90%`;
    return base({
      background: `${h} ${s}% 95%`, foreground: fg, card, border: `${h} ${Math.round(s * 0.7)}% 84%`,
      'card-border': `${h} ${Math.round(s * 0.7)}% 86%`, muted: `${h} ${s}% 90%`, 'muted-foreground': `${ih} 12% 37%`,
      secondary: `${h} ${s}% 87%`, accent, 'accent-foreground': `${ah} 48% 25%`, input: `${h} ${Math.round(s * 0.6)}% 74%`,
      primary: p.pL, 'primary-foreground': `${h} 40% 98%`, destructive: '356 68% 43%', 'destructive-foreground': `${h} 40% 98%`,
      matcha: '150 50% 28%', ink: fg, sakura: accent, sidebar: `${h} ${s}% 92%`,
    });
  }
  const sd = p.darkSat ?? Math.min(40, Math.round(s * 1.4) + 8);
  const fg = p.fgD ?? `${ih} 28% 91%`;
  const accent = p.accentD ?? `${ah} 32% 24%`;
  return base({
    background: `${h} ${sd}% 9%`, foreground: fg, card: `${h} ${sd}% 13%`, border: `${h} ${Math.round(sd * 0.8)}% 23%`,
    'card-border': `${h} ${Math.round(sd * 0.8)}% 23%`, muted: `${h} ${sd}% 17%`, 'muted-foreground': `${h} 14% 71%`,
    secondary: `${h} ${sd}% 21%`, accent, 'accent-foreground': `${ah} 60% 88%`, input: `${h} ${Math.round(sd * 0.7)}% 31%`,
    primary: p.pD, 'primary-foreground': `${h} ${sd}% 9%`, destructive: '354 80% 68%', 'destructive-foreground': `${h} ${sd}% 9%`,
    matcha: '150 52% 60%', ink: fg, sakura: accent, sidebar: `${h} ${sd}% 11%`, 'noise-opacity': '0.12',
  });
}

function base(t: Tokens): Tokens {
  return {
    ...t,
    popover: t.card, 'popover-foreground': t.foreground, 'popover-border': t.border,
    'card-foreground': t.foreground, 'secondary-foreground': t.foreground,
    'sidebar-foreground': t.foreground, 'sidebar-border': t.border, 'sidebar-primary': t.primary,
    'sidebar-primary-foreground': t['primary-foreground'], 'sidebar-accent': t.muted, 'sidebar-accent-foreground': t.foreground,
    'sidebar-ring': t.primary, ring: t.primary, 'chart-1': t.primary, 'chart-4': t.accent,
    'noise-opacity': t['noise-opacity'] ?? '0.35',
  };
}

export const TOKEN_KEYS = Object.keys(generateTokens({ hue: 0, sat: 0, inkHue: 0, inkSat: 0, pL: '0 0% 0%', pD: '0 0% 0%', accentHue: 0 }, true));
