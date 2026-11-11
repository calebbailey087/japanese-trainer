import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, validateData } from '../src/storage/store';
import { dayKey, emptySchedule, recordReadingExposure, recordStudy, scheduleAnswer, stageOf } from '../src/learning/srs';
import { checkStudyAnswer, groupUnlocked, makeQueue, studyCounts, tutorSummary, unlockReason } from '../src/learning/service';
import { COMBINATIONS } from '../src/learning/combos';
import { PHRASES } from '../src/learning/phrases';
import { validateStudy } from '../src/learning/validation';
import type { Catalog, Direction, StudyItem } from '../src/learning/types';
import raw from '../src/data/generated/content.json';

const now = new Date('2026-06-01T12:00:00Z');
const item = (id: string, extra: Partial<StudyItem> = {}): StudyItem => ({
  id, kind: 'custom', japanese: 'ねこ', reading: 'ねこ', meanings: ['cat'], requiresKana: [], requiresKanji: [], requiresWords: [], ...extra,
});
const catalog = (items: StudyItem[]): Catalog => ({
  items, kanji: [], groups: [], meta: raw.meta,
});
test('SM-2 intervals grow across days, never repeated same-day answers; lapse resets', () => {
  let schedule = emptySchedule(now);
  schedule = scheduleAnswer(schedule, true, 'a', now);
  assert.equal(schedule.interval, 1);
  const repeated = scheduleAnswer(schedule, true, 'b', new Date(+now + 1000));
  assert.equal(repeated.interval, 1);
  assert.equal(repeated.due, schedule.due);
  assert.equal(repeated.correctDays.length, 1);
  schedule = scheduleAnswer(repeated, true, 'c', new Date(+now + 86400000));
  assert.equal(schedule.interval, 6);
  schedule = scheduleAnswer(schedule, true, 'd', new Date(+now + 7 * 86400000));
  assert.equal(schedule.interval, 15);
  const miss = scheduleAnswer(schedule, false, 'e', new Date(+now + 22 * 86400000));
  assert.equal(miss.interval, 0);
  assert.equal(miss.repetitions, 0);
  assert.ok(miss.ease < schedule.ease);
});
test('mastery requires distinct days and both directions', () => {
  let study = recordStudy(emptyData().study, 'custom:x', 'recognition', true, 'a', now);
  for (let i = 0; i < 30; i++) study = recordStudy(study, 'custom:x', 'recognition', true, `same-${i}`, now);
  assert.equal(stageOf(study.cards['custom:x']), 'Learning');
  for (let i = 1; i <= 7; i++) study = recordStudy(study, 'custom:x', 'recognition', true, `r-${i}`, new Date(+now + i * 86400000));
  assert.equal(stageOf(study.cards['custom:x']), 'Familiar');
  for (let i = 8; i <= 10; i++) study = recordStudy(study, 'custom:x', 'production', true, `p-${i}`, new Date(+now + i * 86400000));
  assert.equal(stageOf(study.cards['custom:x']), 'Mastered');
  assert.equal(study.activity[dayKey(now)].newItems.length, 1);
});
test('queue due first, daily cap across reloads, quick at most two new items', () => {
  const data = emptyData();
  const items = Array.from({ length: 10 }, (_, i) => item(`custom:${i}`));
  const c = catalog(items);
  assert.equal(new Set(makeQueue(c, data, { quick: true }).map((t) => t.item.id)).size, 2);
  assert.equal(new Set(makeQueue(c, data).map((t) => t.item.id)).size, 5);
  const past = new Date(Date.now() - 10 * 86400000);
  data.study = recordStudy(data.study, items[9].id, 'recognition', false, 'due', past);
  assert.equal(makeQueue(c, data)[0].item.id, items[9].id);
  for (let i = 0; i < 5; i++) data.study = recordStudy(data.study, items[i].id, 'recognition', true, 'today');
  const restored = validateData(JSON.parse(JSON.stringify(data)));
  assert.equal(studyCounts(c, restored).newRemaining, 0);
  assert.ok(makeQueue(c, restored).every((t) => restored.study.cards[t.item.id]));
});
test('source corpus counts, safe distinct examples, grade order, source sentence readings', () => {
  assert.equal(raw.kanji.length, 2136);
  assert.equal(raw.vocabulary.length, 5000);
  assert.equal(raw.sentences.length, 1000);
  assert.equal(raw.groups.slice(0, 8).reduce((n, g) => n + g.characters.length, 0), 75);
  assert.ok(raw.kanji.every((k) => k.examples.length <= 3));
  for (const k of raw.kanji) {
    assert.equal(new Set(k.examples.map((e) => e.japanese)).size, k.examples.length);
    assert.ok(k.examples.every((e) => e.reading.trim() && e.writingPriority.length > 0));
    if (!k.examples.length) assert.ok(k.exampleStatus);
  }
  const later = raw.kanji.slice(75);
  for (let i = 1; i < later.length; i++) {
    assert.ok(later[i].grade >= later[i - 1].grade);
    if (later[i].grade === later[i - 1].grade) assert.ok((later[i].frequency ?? 99999) >= (later[i - 1].frequency ?? 99999));
  }
  const one = raw.kanji.find((k) => k.char === '一')!;
  assert.equal(one.examples.filter((e) => e.japanese === '一つ').length, 1);
  assert.equal(one.examples[0].reading, 'ひとつ');
  assert.ok(!one.examples.some((e) => e.japanese === '一向' && e.reading === 'ひたすら'));
  const vocab = new Set(raw.vocabulary.map((w) => w.id));
  for (const s of raw.sentences) {
    assert.ok(!/[\u3400-\u9fff]/u.test(s.reading), `${s.japanese}: ${s.reading}`);
    assert.ok(s.requiresWords.length > 0 && s.requiresWords.every((id) => vocab.has(id)));
    assert.ok(s.attribution.includes('tatoeba.org'));
  }
  const go = raw.sentences.find((s) => s.japanese === '行け。');
  if (go) assert.equal(go.reading, 'いけ。');
});
test('locks require every kana/kanji/word and prior group multi-day both-direction mastery', () => {
  const data = emptyData();
  const word = item('vocab:a', { kind: 'vocab', japanese: '山', reading: 'やま', requiresKana: ['や', 'ま'], requiresKanji: ['山'] });
  const sentence = item('sentence:a', { kind: 'sentence', requiresWords: ['vocab:a'] });
  const c = { ...catalog([word, sentence]), groups: [{ id: 'g1', name: 'First', characters: ['山'] }, { id: 'g2', name: 'Next', characters: ['川'] }] };
  assert.ok(unlockReason(word, c, data));
  data.settings.rows = ['ya', 'ma'];
  // Use a new AppData identity, matching immutable store updates.
  let next = { ...data };
  assert.ok(unlockReason(word, c, next)?.includes('Strong'));
  assert.equal(groupUnlocked('g1', c, next), true);
  assert.equal(groupUnlocked('g2', c, next), false);
  for (let i = 0; i < 4; i++) for (const direction of ['recognition', 'production'] as Direction[]) {
    next = { ...next, study: recordStudy(next.study, 'kanji:山', direction, true, `session-${i}`, new Date(+now + i * 86400000)) };
  }
  assert.equal(groupUnlocked('g2', c, next), true);
  assert.equal(unlockReason(word, c, next), null);
  assert.ok(unlockReason(sentence, c, next)?.includes('vocabulary'));
});
test('answers: both directions, variants, long vowels, English alternatives, source particle', () => {
  assert.ok(checkStudyAnswer(item('custom:x'), 'recognition', 'cat'));
  assert.ok(checkStudyAnswer(item('custom:x'), 'production', 'neko'));
  assert.ok(checkStudyAnswer(item('custom:x'), 'production', 'ねこ'));
  assert.equal(checkStudyAnswer(item('custom:x'), 'recognition', 'dog'), false);
  const coffee = item('word:x', { kind: 'word', japanese: 'コーヒー', reading: 'こーひー', meanings: ['coffee'] });
  assert.ok(checkStudyAnswer(coffee, 'production', 'koohii'));
  assert.ok(checkStudyAnswer(coffee, 'recognition', 'coffee'));
  assert.ok(checkStudyAnswer(item('kana:シ', { kind: 'kana', japanese: 'シ', reading: 'し' }), 'recognition', 'si'));
  const s = item('sentence:x', { kind: 'sentence', japanese: 'これは猫。', particleIndices: [2] });
  assert.ok(checkStudyAnswer(s, 'recognition', 'ha', 'particle', 2));
  assert.equal(checkStudyAnswer(s, 'recognition', 'ga', 'particle', 2), false);
  assert.ok(COMBINATION_EXISTS('ファ'));
  assert.ok(PHRASES.length >= 16 && PHRASES.every((p) => unlockReason(p, catalog([]), emptyData()) === null));
});
function COMBINATION_EXISTS(glyph: string) { return COMBINATIONS.some((x) => x.japanese === glyph); }
test('backup migration is additive, keeps old progress/themes, rejects corrupt SRS without overwriting', () => {
  const old: Record<string, unknown> = { ...emptyData(), kana: { あ: { seen: 5, correct: 4, streak: 2 } } };
  delete old.study;
  const migrated = validateData(old);
  assert.deepEqual(migrated.kana, old.kana);
  assert.equal(migrated.settings.theme, 'paper');
  assert.ok(migrated.study.cards['kana:あ']);
  assert.equal(stageOf(migrated.study.cards['kana:あ']), 'Learning');
  assert.equal(migrated.study.cards['kana:あ'].recognition.correctDays.length, 0);
  const invalid = JSON.parse(JSON.stringify(migrated));
  invalid.study.cards['kana:あ'].recognition.correct = 500;
  assert.throws(() => validateData(invalid));
  assert.throws(() => validateStudy({ ...emptyData().study, combinations: ['fake'] }));
});
test('tutor report includes required counts, misses, rows, streak and seven activity days', () => {
  const data = emptyData(), c = catalog([item('custom:x')]);
  data.study = recordStudy(data.study, 'custom:x', 'recognition', false, 'a');
  const report = tutorSummary(c, data);
  for (const s of ['New:', 'Learning:', 'Familiar:', 'Strong:', 'Mastered:', 'Most missed', 'Kana row accuracy', 'Current streak', 'Last seven days']) assert.ok(report.includes(s));
  assert.equal(report.match(/^\d{4}-\d{2}-\d{2}:/gm)?.length, 7);
});
test('pronunciation-only free drills never claim untested English mastery', () => {
  const study = recordReadingExposure(emptyData().study, 'word:ねこ', true, now);
  const card = study.cards['word:ねこ'];
  assert.equal(card.recognition.seen, 0);
  assert.equal(card.recognition.correctDays.length, 0);
  assert.equal(card.recognition.due, now.toISOString());
  assert.equal(study.activity[dayKey(now)].answers, 1);
});
