import assert from 'node:assert/strict';
import test from 'node:test';
import { THEME_IDS } from '../src/themes/ids';
import { SHOOTING_STAR_INTERVAL, createActiveClock } from '../src/themes/motion-clock';
import { emptyData, validateData } from '../src/storage/store';
import { THEMES } from '../src/themes/themes';
import { generateTokens } from '../src/themes/palettes';

test('all 19 public themes are available exactly once', () => {
  assert.equal(THEME_IDS.length, 19);
  assert.equal(new Set(THEME_IDS).size, 19);
  assert.deepEqual(THEMES.map((theme) => theme.id).sort(), [...THEME_IDS].sort());
});

test('all theme, appearance, and motion choices round-trip through backups', () => {
  const data = emptyData();
  data.kana = { あ: { seen: 12, correct: 10, streak: 2 }, ア: { seen: 1, correct: 0, streak: 0 } };
  data.settings.rows = ['a', 'kata-a'];
  data.practiceDays = ['2026-11-07'];
  for (const theme of THEME_IDS) {
    for (const appearance of ['theme', 'light', 'dark'] as const) {
      for (const reduceMotion of [true, false]) {
        const input = { ...data, settings: { ...data.settings, theme, appearance, reduceMotion } };
        assert.deepEqual(validateData(JSON.parse(JSON.stringify(input))), input);
      }
    }
  }
  const old = JSON.parse(JSON.stringify(data));
  delete old.settings.appearance;
  delete old.settings.reduceMotion;
  const migrated = validateData(old);
  assert.equal(migrated.settings.appearance, 'theme');
  assert.equal(migrated.settings.reduceMotion, false);
  assert.deepEqual(migrated.kana, data.kana);
  assert.deepEqual(migrated.settings.rows, data.settings.rows);
  assert.deepEqual(migrated.practiceDays, data.practiceDays);
  assert.throws(() => validateData({ ...data, settings: { ...data.settings, reduceMotion: 'false' } }));
  assert.throws(() => validateData({ ...data, settings: { ...data.settings, appearance: 'bright' } }));
  assert.throws(() => validateData({ ...data, settings: { ...data.settings, theme: 'unknown' } }));
});

test('Yoru shooting stars wait a full 30 minutes, then repeat at that cadence', () => {
  assert.equal(SHOOTING_STAR_INTERVAL, 1_800_000);
  const clock = createActiveClock(SHOOTING_STAR_INTERVAL);
  assert.equal(clock.tick(0, true), false);
  assert.equal(clock.tick(1_799_999, true), false);
  assert.equal(clock.tick(1_800_000, true), true);
  assert.equal(clock.tick(1_800_001, true), false);
  assert.equal(clock.tick(3_600_000, true), true);
});

test('hidden, different-theme, and reduced-motion time do not advance the clock', () => {
  const clock = createActiveClock(SHOOTING_STAR_INTERVAL);
  assert.equal(clock.tick(0, true), false);
  assert.equal(clock.tick(600_000, false), false);
  assert.equal(clock.tick(6_000_000, false), false);
  assert.equal(clock.tick(6_000_000, true), false);
  assert.equal(clock.tick(7_199_999, true), false);
  assert.equal(clock.tick(7_200_000, true), true);
});

test('late timers do not produce queued bursts or invalid initial events', () => {
  const clock = createActiveClock(SHOOTING_STAR_INTERVAL);
  assert.equal(clock.tick(0, true), false);
  assert.equal(clock.tick(3 * SHOOTING_STAR_INTERVAL, true), true);
  assert.equal(clock.tick(3 * SHOOTING_STAR_INTERVAL + 1, true), false);
  assert.equal(clock.tick(Infinity, true), false);
  assert.throws(() => createActiveClock(0));
});

test('retired visual settings migrate without losing learning data', () => {
  const data = emptyData();
  data.kana = { あ: { seen: 3, correct: 1, streak: 0 } };
  for (const theme of ['hashira', 'grand-line', 'boxing']) {
    const migrated = validateData({ ...data, settings: { ...data.settings, theme } });
    assert.equal(migrated.settings.theme, 'paper');
    assert.deepEqual(migrated.kana, data.kana);
    assert.deepEqual(migrated.study, data.study);
  }
});

function luminance(hsl: string): number {
  const [h, s0, l0] = hsl.match(/[\d.]+/g)!.map(Number);
  const s = s0 / 100, l = l0 / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(0) + 0.7152 * f(8) + 0.0722 * f(4);
}

test('generated light and dark palettes keep quiz text high-contrast', () => {
  for (const theme of THEMES) {
    for (const dark of [false, true]) {
      const tokens = generateTokens(theme.spec, dark);
      for (const surface of ['background', 'card']) {
        const a = luminance(tokens.foreground), b = luminance(tokens[surface]);
        const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        assert.ok(contrast >= 7, `${theme.id}, ${dark ? 'dark' : 'light'}, ${surface}: ${contrast}`);
      }
    }
  }
});
