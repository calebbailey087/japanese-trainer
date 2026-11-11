import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ALL_KANA, ALL_WORDS, KANA_ROWS, KATAKANA_ROWS, KATAKANA_WORDS, ROW_IDS,
  getRows, getWords,
} from '../src/data/kana';
import { buildPool, eligibleGroups, eligibleWords, isCorrect, weight } from '../src/practice/engine';

test('the supplied character and word sets are complete and isolated', () => {
  assert.equal(KANA_ROWS.flatMap((row) => row.kana).length, 46);
  assert.equal(KATAKANA_ROWS.flatMap((row) => row.kana).length, 46);
  assert.equal(ALL_KANA.length, 92);
  assert.equal(new Set(ALL_KANA.map((kana) => kana.char)).size, 92);
  assert.equal(ROW_IDS.length, 20);
  assert.equal(getWords('hiragana').length, 30);
  assert.equal(KATAKANA_WORDS.length, 16);
  assert.equal(ALL_WORDS.length, 46);
  assert.equal(KATAKANA_ROWS.map((row) => row.kana.map((k) => k.char).join('')).join(' '),
    'アイウエオ カキクケコ サシスセソ タチツテト ナニヌネノ ハヒフヘホ マミムメモ ヤユヨ ラリルレロ ワヲン');
  for (const kana of ALL_KANA) {
    assert.ok(isCorrect(kana.char, kana.romaji));
    assert.ok(isCorrect(kana.char, ` ${kana.romaji.toUpperCase()} `));
  }
  for (const word of ALL_WORDS) assert.ok(isCorrect(word.kana, word.romaji), word.kana);
});

test('romaji variants work for both scripts and within words', () => {
  for (const [prompt, answers] of [
    ['シ', ['shi', 'si']], ['チ', ['chi', 'ti']], ['ツ', ['tsu', 'tu']],
    ['フ', ['fu', 'hu']], ['ヲ', ['wo', 'o']], ['ン', ['n', 'nn']],
    ['し', ['shi', 'si']], ['ち', ['chi', 'ti']], ['つ', ['tsu', 'tu']],
    ['ふ', ['fu', 'hu']], ['を', ['wo', 'o']], ['ん', ['n', 'nn']],
  ] as [string, string[]][]) {
    for (const answer of answers) assert.ok(isCorrect(prompt, answer), `${prompt}: ${answer}`);
  }
  assert.ok(isCorrect('タクシー', 'takusii'));
  assert.ok(isCorrect('すし', 'susi'));
  assert.ok(isCorrect('ラーメン', 'raamenn'));
  assert.ok(!isCorrect('シ', 'tsu'));
  assert.ok(!isCorrect('未知', 'a'));
  assert.ok(!isCorrect('ガ', 'ga')); // combinations intentionally not enabled
});

test('the long-vowel mark repeats the preceding vowel and has no standalone answer', () => {
  for (const [prompt, answer] of [
    ['コーヒー', 'koohii'], ['ケーキ', 'keeki'], ['ノート', 'nooto'],
    ['ホーム', 'hoomu'], ['タクシー', 'takushii'],
  ]) assert.ok(isCorrect(prompt, answer));
  for (const answer of ['kohii', 'koohi', 'koh i', 'koohiii', 'coffee']) {
    assert.ok(!isCorrect('コーヒー', answer), answer);
  }
  assert.ok(!isCorrect('ー', 'a'));
  assert.ok(!isCorrect('ンー', 'na'));
  assert.ok(!isCorrect('コーヒー', ''));
});

test('row filtering never leaks characters, words, or look-alikes across scripts', () => {
  const both = ROW_IDS;
  assert.equal(buildPool('kana', both, 'all', 'hiragana').length, 46);
  assert.equal(buildPool('kana', both, 'all', 'katakana').length, 46);
  assert.equal(buildPool('words', both, 'all', 'katakana').length, 16);
  assert.equal(eligibleGroups(both, 'katakana').length, 9);
  assert.equal(eligibleGroups(both, 'hiragana').length, 10);
  assert.equal(buildPool('kana', ['a'], 'all', 'katakana').length, 0);
  assert.deepEqual(buildPool('kana', ['kata-a'], 'all', 'katakana').map((item) => item.prompt), ['ア', 'イ', 'ウ', 'エ', 'オ']);
  assert.equal(eligibleGroups(['kata-sa'], 'katakana').length, 0);
  assert.deepEqual(eligibleGroups(['kata-sa', 'kata-ta'], 'katakana').map((g) => g.group.id), ['シツ', 'チテ']);
  assert.equal(eligibleWords(['kata-ka'], 'katakana').length, 1);
  assert.equal(eligibleWords(['kata-ka'], 'katakana')[0].kana, 'ケーキ');
  assert.ok(!eligibleWords(['kata-ka'], 'katakana').some((word) => word.kana === 'コーヒー'));
  assert.ok(eligibleWords(['kata-ka', 'kata-ha'], 'katakana').some((word) => word.kana === 'コーヒー'));
  for (const script of ['hiragana', 'katakana'] as const) {
    const allowed = new Set(getRows(script).flatMap((row) => row.kana.map((kana) => kana.char)));
    assert.ok(buildPool('confusable', both, 'all', script).every((item) => allowed.has(item.prompt)));
  }
});

test('mistakes retain higher repetition weights than a correct streak', () => {
  assert.ok(weight({ seen: 10, correct: 3, streak: 0 }) > weight({ seen: 10, correct: 10, streak: 10 }));
});

test('old saved progress and backups migrate without losing history or selections', async () => {
  const old = {
    version: 1,
    settings: { rows: ['a', 'ka'], minutes: 5, mode: 'kana', groupId: 'all' },
    kana: { あ: { seen: 12, correct: 10, streak: 2 } },
    words: { あか: { seen: 3, correct: 2, streak: 1 } },
    practiceDays: ['2026-11-06', '2026-11-07'],
  };
  const memory = new Map<string, string>([['kana-practice:v1', JSON.stringify(old)]]);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, value); },
  } });
  const store = await import('../src/storage/store');
  assert.equal(store.getData().settings.script, 'hiragana');
  assert.equal(store.getData().settings.theme, 'paper');
  assert.deepEqual(store.getData().kana, old.kana);
  assert.deepEqual(store.getData().words, old.words);
  assert.deepEqual(store.getData().practiceDays, old.practiceDays);
  assert.deepEqual(store.getData().settings.rows, old.settings.rows);
  // Loading alone must not overwrite the original stored data.
  assert.equal(memory.get(store.STORAGE_KEY), JSON.stringify(old));
  store.updateSettings({ script: 'katakana', theme: 'sakura', rows: ['a', 'ka', 'kata-a'] });
  store.recordAnswer('kana', 'ア', false);
  store.recordAnswer('word', 'ケーキ', true);
  const backup = store.validateData(JSON.parse(memory.get(store.STORAGE_KEY)!));
  assert.equal(backup.settings.theme, 'sakura');
  assert.equal(backup.settings.script, 'katakana');
  assert.deepEqual(backup.kana.あ, old.kana.あ);
  assert.deepEqual(backup.words.あか, old.words.あか);
  assert.deepEqual(backup.kana.ア, { seen: 1, correct: 0, streak: 0 });
  assert.deepEqual(backup.words['ケーキ'], { seen: 1, correct: 1, streak: 1 });
  store.updateSettings({ script: 'hiragana' });
  assert.ok(store.getData().settings.rows.includes('kata-a'));
  for (const value of ['sakura', 'torii', 'temple', 'yoru', 'paper']) {
    assert.equal(store.validateData({ ...old, settings: { ...old.settings, theme: value } }).settings.theme, value);
  }
  assert.throws(() => store.validateData({ ...old, settings: { ...old.settings, theme: 'unknown' } }));
  assert.throws(() => store.validateData({ ...old, settings: { ...old.settings, script: 'kanji' } }));
  assert.throws(() => store.validateData({ ...old, kana: { ア: { seen: -1, correct: 0, streak: 0 } } }));
  assert.throws(() => store.validateData({ ...old, kana: { ア: { seen: 1, correct: 2, streak: 0 } } }));
});
