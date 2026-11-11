// Shared by backup validation and the visual theme registry.
export const THEME_IDS = [
  'paper', 'sakura', 'torii', 'temple', 'yoru',
  'matcha', 'fuji', 'konbini', 'shinkansen', 'neon-shinjuku', 'washi',
  'koi', 'momiji', 'onsen', 'ukiyo-e',
  'sage-cream', 'mocha', 'midnight-ink', 'lofi',
] as const;
export type ThemeId = typeof THEME_IDS[number];
export type Appearance = 'theme' | 'light' | 'dark';
