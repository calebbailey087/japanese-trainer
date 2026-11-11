import { STORAGE_KEY } from '@/storage/store';
import { THEME_IDS, type ThemeId, type Appearance } from './ids';
import { generateTokens, TOKEN_KEYS, type PaletteSpec } from './palettes';

export { THEME_IDS, type ThemeId, type Appearance };

export type ThemeGroup = 'classic' | 'japan' | 'cozy';
export const GROUPS: { id: ThemeGroup; label: string }[] = [
  { id: 'classic', label: 'Originals' }, { id: 'japan', label: 'Japan' },
  { id: 'cozy', label: 'Cozy & minimal' },
];

export interface ThemeDef {
  id: ThemeId; name: string; jp: string; tagline: string; group: ThemeGroup;
  dark: boolean; /** native mode */
  css?: boolean; /** native palette lives in index.css */
  spec: PaletteSpec;
}

const d = (id: ThemeId, name: string, jp: string, group: ThemeGroup, dark: boolean, tagline: string, spec: PaletteSpec, css = false): ThemeDef =>
  ({ id, name, jp, group, dark, tagline, spec, css });

export const THEMES: ThemeDef[] = [
  d('paper', 'Paper', '和紙', 'classic', false, 'The original: shoji paper, indigo ink, persimmon stamp.',
    { hue: 40, sat: 30, inkHue: 232, inkSat: 38, pL: '12 78% 52%', pD: '14 82% 64%', accentHue: 340 }, true),
  d('sakura', 'Sakura', '桜', 'classic', false, 'Cherry blossom: blush petals over deep plum bark.',
    { hue: 342, sat: 45, inkHue: 320, inkSat: 36, pL: '342 61% 46%', pD: '342 72% 74%', accentHue: 342 }, true),
  d('torii', 'Torii', '鳥居', 'classic', false, 'Vermilion shrine gates against sumi black and cream.',
    { hue: 36, sat: 40, inkHue: 18, inkSat: 20, pL: '9 77% 47%', pD: '10 80% 62%', accentHue: 36 }, true),
  d('temple', 'Temple', '寺', 'classic', false, 'Garden and timber: moss, raked gravel, aged cedar.',
    { hue: 70, sat: 16, inkHue: 28, inkSat: 30, pL: '92 35% 31%', pD: '92 38% 62%', accentHue: 36 }, true),
  d('yoru', 'Yoru', '夜', 'classic', true, 'Night: indigo sky, lantern-gold moon, a rare shooting star.',
    { hue: 234, sat: 30, inkHue: 234, inkSat: 44, pL: '40 80% 34%', pD: '42 82% 68%', accentHue: 236, darkSat: 44 }, true),

  d('matcha', 'Matcha', 'まっちゃ', 'japan', false, 'Sage foam, cream cups, a wooden counter.',
    { hue: 48, sat: 36, inkHue: 25, inkSat: 35, pL: '95 26% 34%', pD: '92 32% 62%', accentHue: 95 }),
  d('fuji', 'Fuji at Dawn', 'ふじ', 'japan', false, 'Peach sky, lavender ridge, the faint line of the mountain.',
    { hue: 22, sat: 62, inkHue: 255, inkSat: 30, pL: '262 34% 44%', pD: '262 52% 78%', accentHue: 18 }),
  d('konbini', 'Konbini', 'コンビニ', 'japan', false, 'Bright aisle light, three stripes, receipt-paper stats.',
    { hue: 200, sat: 18, inkHue: 215, inkSat: 45, pL: '148 72% 28%', pD: '148 55% 55%', accentHue: 28 }),
  d('shinkansen', 'Shinkansen', 'しんかんせん', 'japan', false, 'Steel and white with one blue stripe. Next stop: Tokyo.',
    { hue: 210, sat: 10, inkHue: 214, inkSat: 30, pL: '214 82% 40%', pD: '210 85% 68%', accentHue: 210 }),
  d('neon-shinjuku', 'Neon Shinjuku', 'ネオン', 'japan', true, 'Late alleys, pink signs, a cyan hum. Low-key, never flashing.',
    { hue: 285, sat: 32, inkHue: 290, inkSat: 30, pL: '328 72% 42%', pD: '328 88% 70%', accentHue: 186, accentL: '186 62% 86%', accentD: '186 50% 20%', fgD: '300 30% 93%' }),
  d('washi', 'Washi Paper', 'わし', 'japan', false, 'Fibrous handmade sheet, sumi ink, a red seal for every hit.',
    { hue: 42, sat: 20, inkHue: 30, inkSat: 10, pL: '358 72% 42%', pD: '358 70% 65%', accentHue: 358, accentL: '20 30% 88%' }),
  d('koi', 'Koi Pond', 'こい', 'japan', true, 'Deep teal water, orange and white fins, slow ripples.',
    { hue: 186, sat: 40, inkHue: 190, inkSat: 50, pL: '20 82% 42%', pD: '22 90% 62%', accentHue: 185, fgD: '180 25% 93%' }),
  d('momiji', 'Momiji', 'もみじ', 'japan', false, 'Burnt orange, deep red, maple leaves drifting down.',
    { hue: 34, sat: 52, inkHue: 10, inkSat: 45, pL: '12 76% 40%', pD: '18 85% 62%', accentHue: 2 }),
  d('onsen', 'Onsen', 'おんせん', 'japan', false, 'Misty blue-grey, cedar wood, soft steam.',
    { hue: 205, sat: 18, inkHue: 25, inkSat: 32, pL: '24 44% 36%', pD: '28 52% 64%', accentHue: 205 }),
  d('ukiyo-e', 'Ukiyo-e', 'うきよえ', 'japan', false, 'Prussian indigo on faded beige, carved wave lines.',
    { hue: 38, sat: 34, inkHue: 222, inkSat: 55, pL: '222 58% 32%', pD: '214 58% 72%', accentHue: 205 }),

  d('sage-cream', 'Sage Cream', 'セージ', 'cozy', false, 'Muted green, oat, soft charcoal text.',
    { hue: 60, sat: 22, inkHue: 210, inkSat: 8, pL: '110 20% 34%', pD: '110 24% 64%', accentHue: 110 }),
  d('mocha', 'Mocha Latte', 'モカ', 'cozy', false, 'Espresso browns poured into cream.',
    { hue: 32, sat: 36, inkHue: 22, inkSat: 40, pL: '24 46% 32%', pD: '30 50% 66%', accentHue: 28 }),
  d('midnight-ink', 'Midnight Ink', 'すみ', 'cozy', true, 'Near-black, soft gold letters, nothing else.',
    { hue: 230, sat: 10, inkHue: 230, inkSat: 20, pL: '40 62% 30%', pD: '43 60% 66%', accentHue: 43, darkSat: 12, accentD: '230 10% 18%', fgD: '44 52% 80%' }),
  d('lofi', 'Lofi Study', 'ローファイ', 'cozy', true, 'Dusty purple dusk, a warm desk lamp, slow beats.',
    { hue: 268, sat: 18, inkHue: 268, inkSat: 30, pL: '24 72% 40%', pD: '28 86% 65%', accentHue: 268, accentD: '268 22% 26%', fgD: '35 40% 91%' }),
];

export function getTheme(id: string | undefined): ThemeDef {
  return THEMES.find((x) => x.id === id) ?? THEMES[0];
}

export function isDarkFor(t: ThemeDef, appearance: Appearance | undefined) {
  return appearance === 'light' ? false : appearance === 'dark' ? true : t.dark;
}

export function applyTheme(id: string | undefined, appearance: Appearance = 'theme', reduced = false) {
  const t = getTheme(id);
  const root = document.documentElement;
  const dark = isDarkFor(t, appearance);
  root.dataset.theme = t.id;
  root.dataset.mode = dark ? 'dark' : 'light';
  root.dataset.reduceMotion = reduced ? 'true' : 'false';
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  const useCss = t.css && dark === t.dark;
  const tokens = generateTokens(t.spec, dark);
  for (const k of TOKEN_KEYS) {
    if (useCss) root.style.removeProperty(`--${k}`);
    else root.style.setProperty(`--${k}`, tokens[k]);
  }
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'theme-color'); document.head.appendChild(meta); }
  meta.setAttribute('content', useCss ? getComputedStyle(root).getPropertyValue('--background').trim().replace(/^(.*)$/, 'hsl($1)') : `hsl(${tokens.background})`);
}

/** Synchronous early apply from saved data to avoid a flash before React mounts. */
export function applySavedThemeEarly() {
  const sys = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const s = raw ? JSON.parse(raw)?.settings : undefined;
    const ap = s?.appearance === 'light' || s?.appearance === 'dark' ? s.appearance : 'theme';
    applyTheme(s?.theme, ap, sys || s?.reduceMotion === true);
  } catch {
    applyTheme('paper', 'theme', sys);
  }
}
