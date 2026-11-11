import { toHiragana, toRomaji } from 'wanakana';
import { ALL_KANA } from '@/data/kana';
import { isCorrect } from '@/practice/engine';
import type { AppData } from '@/storage/store';
import { COMBINATIONS } from './combos';
import { dayKey, stageOf } from './srs';
import { STAGES, type Catalog, type Direction, type ItemKind, type ReviewTask, type Stage, type StudyItem } from './types';

export function getStudyItems(catalog: Catalog, data: AppData): StudyItem[] {
  return [...catalog.items, ...data.study.custom];
}

const lockCache = new WeakMap<AppData, WeakMap<Catalog, { groups: Map<string, boolean>; kana: Set<string> }>>();
function knowledge(catalog: Catalog, data: AppData) {
  let byCatalog = lockCache.get(data);
  if (!byCatalog) { byCatalog = new WeakMap(); lockCache.set(data, byCatalog); }
  const found = byCatalog.get(catalog);
  if (found) return found;
  const kana = new Set(ALL_KANA.filter((k) => data.settings.rows.includes(k.row)).map((k) => k.char));
  for (const combo of COMBINATIONS) if (data.study.combinations.includes(combo.comboGroup!)) {
    for (const char of combo.japanese + combo.reading) kana.add(char);
  }
  const groups = new Map<string, boolean>();
  let priorMastered = true;
  for (const group of catalog.groups) {
    groups.set(group.id, priorMastered);
    if (!priorMastered) continue;
    let seen = 0, correct = 0;
    const sessions = new Set<string>();
    let strong = true;
    for (const char of group.characters) {
      if (catalog.kanji.some((k) => k.char === char && k.examples.length === 0)) continue;
      const card = data.study.cards[`kanji:${char}`];
      const stage = stageOf(card);
      if (stage !== 'Strong' && stage !== 'Mastered') strong = false;
      if (card) for (const direction of ['recognition', 'production'] as const) {
        seen += card[direction].seen; correct += card[direction].correct;
        card[direction].sessions.forEach((s) => sessions.add(s));
      }
    }
    const referenceOnly = group.characters.every((char) => catalog.kanji.some((k) => k.char === char && k.examples.length === 0));
    priorMastered = referenceOnly || (strong && seen > 0 && correct / seen >= 0.9 && sessions.size >= 2);
  }
  const result = { groups, kana };
  byCatalog.set(catalog, result);
  return result;
}
export function groupUnlocked(groupId: string, catalog: Catalog, data: AppData) {
  return knowledge(catalog, data).groups.get(groupId) === true;
}
export function unlockReason(item: StudyItem, catalog: Catalog, data: AppData): string | null {
  if (item.kind === 'phrase' || item.kind === 'custom') return null;
  if (item.kind === 'kanji') {
    return groupUnlocked(item.groupId!, catalog, data) ? null : 'Master the earlier kanji groups: every character Strong, 90%+ first-attempt accuracy, and at least two sessions.';
  }
  if (item.kind === 'combo') {
    return data.study.combinations.includes(item.comboGroup!) ? null : 'Enable this combination set manually in the Library.';
  }
  const known = knowledge(catalog, data).kana;
  const missingKana = item.requiresKana.filter((c) => c !== 'ー' && !known.has(c));
  if (missingKana.length) return `Enable the kana rows or combination sets for: ${missingKana.slice(0, 12).join(' ')}`;
  const missingKanji = item.requiresKanji.filter((c) => !['Strong', 'Mastered'].includes(stageOf(data.study.cards[`kanji:${c}`])));
  if (missingKanji.length) return `Reach Strong in: ${missingKanji.slice(0, 10).join(' ')}`;
  const missingWords = item.requiresWords.filter((id) => !['Strong', 'Mastered'].includes(stageOf(data.study.cards[id])));
  if (missingWords.length) return `Reach Strong in all ${missingWords.length} remaining vocabulary prerequisites.`;
  return null;
}
export function studyCounts(catalog: Catalog, data: AppData, now = new Date()) {
  const items = getStudyItems(catalog, data);
  const stages = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  let due = 0, newAvailable = 0, unlocked = 0;
  for (const item of items) {
    const card = data.study.cards[item.id];
    stages[stageOf(card)]++;
    if (unlockReason(item, catalog, data)) continue;
    unlocked++;
    if (!card) newAvailable++;
    else for (const d of ['recognition', 'production'] as const) if (+new Date(card[d].due) <= +now) due++;
  }
  const introducedToday = data.study.activity[dayKey(now)]?.newItems.length ?? 0;
  return { due, newAvailable, newRemaining: Math.max(0, Math.min(newAvailable, data.settings.newPerDay - introducedToday)), introducedToday, unlocked, total: items.length, stages };
}
interface QueueOptions { quick?: boolean; kind?: ItemKind | 'all'; direction?: Direction | 'mixed'; mode?: 'text' | 'listening' | 'particle' }
export function makeQueue(catalog: Catalog, data: AppData, options: QueueOptions = {}): ReviewTask[] {
  const now = Date.now();
  const mode = options.mode ?? 'text';
  const directions: Direction[] = options.direction && options.direction !== 'mixed' ? [options.direction] : ['recognition', 'production'];
  const items = getStudyItems(catalog, data).filter((item) =>
    (!options.kind || options.kind === 'all' || item.kind === options.kind)
    && !unlockReason(item, catalog, data)
    && (mode !== 'particle' || (item.kind === 'sentence' && !!item.particleIndices?.length)));
  const tasks: ReviewTask[] = [], newItems: StudyItem[] = [];
  for (const item of items) {
    const card = data.study.cards[item.id];
    if (!card) { newItems.push(item); continue; }
    for (const direction of mode === 'text' ? directions : ['recognition'] as const) {
      if (+new Date(card[direction].due) <= now) tasks.push({ item, direction, mode });
    }
  }
  const priority = (task: ReviewTask) => {
    const schedule = data.study.cards[task.item.id][task.direction];
    const missed = schedule.seen - schedule.correct;
    return (now - +new Date(schedule.due)) / 86400000 + missed / Math.max(1, schedule.seen) * 2;
  };
  tasks.sort((a, b) => priority(b) - priority(a));
  const counts = studyCounts(catalog, data);
  const maxNew = Math.min(counts.newRemaining, options.quick ? 2 : data.settings.newPerDay);
  // Kanji comes first for this milestone; other kinds remain selectable.
  newItems.sort((a, b) => Number(b.kind === 'kanji') - Number(a.kind === 'kanji'));
  for (const item of newItems.slice(0, maxNew)) {
    for (const direction of mode === 'text' ? directions : ['recognition'] as const) tasks.push({ item, direction, mode });
  }
  return tasks;
}
function normalizeEnglish(text: string) {
  return text.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/^to /, '').replace(/[^\p{L}\p{N}']/gu, ' ').trim().replace(/\s+/g, ' ');
}
function normalizeKana(text: string) {
  // Long vowels may be typed as こーひー or koohii -> こおひい.
  const kana = toHiragana(text.trim().normalize('NFKC'), { passRomaji: false }).replace(/[\s、。！？!?.,「」『』（）()・]/g, '');
  let result = '';
  for (const c of kana) {
    if (c === 'ー' && result) {
      const vowel = toRomaji(result.slice(-1)).match(/[aeiou]$/)?.[0];
      result += vowel ? toHiragana(vowel) : c;
    } else result += c;
  }
  return result;
}
export function checkStudyAnswer(item: StudyItem, direction: Direction, input: string, mode: 'text' | 'listening' | 'particle' = 'text', particleIndex?: number) {
  if (!input.trim()) return false;
  if (mode === 'particle') {
    const index = particleIndex ?? item.particleIndices?.[0];
    return index !== undefined && item.particleIndices?.includes(index) === true && toHiragana(input.trim()) === item.japanese[index];
  }
  if (direction === 'production' || mode === 'listening') {
    const n = normalizeKana(input);
    return n === normalizeKana(item.reading) || n === normalizeKana(item.japanese);
  }
  if (item.kind === 'kana') return isCorrect(item.japanese, input) || normalizeKana(input) === normalizeKana(item.reading);
  if (item.kind === 'combo') return normalizeKana(input) === normalizeKana(item.reading) || toRomaji(item.reading) === input.trim().toLowerCase();
  const n = normalizeEnglish(input);
  return item.meanings.some((m) => {
    const alternatives = [m, ...m.split(/;|\/|,\s+|\s+\bor\b\s+/)];
    return alternatives.some((a) => normalizeEnglish(a.replace(/\([^)]*\)/g, '')) === n || normalizeEnglish(a) === n);
  });
}
export function tutorSummary(catalog: Catalog, data: AppData) {
  const counts = studyCounts(catalog, data), items = getStudyItems(catalog, data);
  const lines = ['Japanese practice progress', `As of ${dayKey()}`, '', 'Stages (all loaded items, including locked):'];
  for (const s of STAGES) lines.push(`${s}: ${counts.stages[s]}`);
  const active = new Set(data.practiceDays);
  let streak = 0; const d = new Date();
  if (!active.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (active.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
  lines.push('', `Current streak: ${streak} days`, '', 'Most missed (first attempts):');
  const missed = items.map((item) => {
    const card = data.study.cards[item.id];
    const legacyId = item.id.slice(item.id.indexOf(':') + 1);
    const legacy = item.kind === 'kana' ? data.kana[legacyId] : item.kind === 'word' ? data.words[legacyId] : undefined;
    // Legacy stats include recognition answers also recorded in SRS. Take the
    // larger total, not the sum, so old misses survive without double-counting.
    const recognitionMisses = Math.max(legacy ? legacy.seen - legacy.correct : 0, card ? card.recognition.seen - card.recognition.correct : 0);
    const misses = recognitionMisses + (card ? card.production.seen - card.production.correct : 0);
    return { item, misses };
  }).filter((x) => x.misses > 0).sort((a, b) => b.misses - a.misses).slice(0, 10);
  missed.forEach(({ item, misses }) => lines.push(`${item.character ?? item.japanese}: ${misses} missed`));
  if (!missed.length) lines.push('No misses recorded.');
  lines.push('', 'Kana row accuracy (all recorded first attempts):');
  const rows = [...new Set(ALL_KANA.map((k) => k.row))];
  for (const row of rows) {
    let seen = 0, correct = 0;
    for (const k of ALL_KANA.filter((x) => x.row === row)) {
      const stat = data.kana[k.char]; seen += stat?.seen ?? 0; correct += stat?.correct ?? 0;
    }
    lines.push(`${row}: ${seen ? `${Math.round(correct / seen * 100)}% (${correct}/${seen})` : 'not practiced'}`);
  }
  lines.push('', 'Last seven days (SRS + new recorded free-drill answers):');
  for (let i = 6; i >= 0; i--) {
    const date = new Date(); date.setDate(date.getDate() - i);
    const day = dayKey(date), a = data.study.activity[day];
    lines.push(`${day}: ${a?.answers ?? 0} answers, ${a?.correct ?? 0} correct, ${a?.newItems.length ?? 0} new items${!a && active.has(day) ? ' (legacy practice day; answer count unavailable)' : ''}`);
  }
  return lines.join('\n');
}
