import { useSyncExternalStore } from 'react';
import { ALL_KANA, ALL_WORDS, CONFUSABLE_GROUPS, ROW_IDS, type KanaScript } from '@/data/kana';
import { THEME_IDS, type ThemeId, type Appearance } from '@/themes/ids';
import { toHiragana } from 'wanakana';
import { COMBINATION_GROUPS } from '@/learning/combos';
import { emptyStudy, recordReadingExposure, recordStudy } from '@/learning/srs';
import { migrateStudy, validateCustom, validateStudy } from '@/learning/validation';
import type { Direction, StudyData, StudyItem } from '@/learning/types';
export { THEME_IDS, type ThemeId, type Appearance } from '@/themes/ids';

export const STORAGE_KEY = 'kana-practice:v1';
export const DATA_VERSION = 2;

export interface ItemStat {
  seen: number;
  correct: number;
  streak: number;
}

export interface Settings {
  script: KanaScript;
  theme: ThemeId;
  appearance: Appearance;
  reduceMotion: boolean;
  newPerDay: number;
  rows: string[];
  minutes: 3 | 5 | 10;
  mode: 'kana' | 'confusable' | 'words';
  groupId: string;
  countdown: { name: string; date: string } | null;
}

export interface AppData {
  version: number;
  settings: Settings;
  kana: Record<string, ItemStat>;
  words: Record<string, ItemStat>;
  practiceDays: string[];
  study: StudyData;
  backup: { trackingSince: string; lastExportAt: string | null };
}

export function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    settings: { rows: [], minutes: 3, mode: 'kana', groupId: 'all', script: 'hiragana', theme: 'paper', appearance: 'theme', reduceMotion: false, newPerDay: 5, countdown: null },
    kana: {},
    words: {},
    practiceDays: [],
    study: emptyStudy(),
    backup: { trackingSince: new Date().toISOString(), lastExportAt: null },
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v >= 0;

function validateStats(v: unknown, keys: Set<string>, label: string): Record<string, ItemStat> {
  if (!isObj(v)) throw new Error(`"${label}" must be an object.`);
  const out: Record<string, ItemStat> = {};
  for (const [k, s] of Object.entries(v)) {
    if (!keys.has(k)) throw new Error(`Unknown ${label} entry "${k}".`);
    if (!isObj(s) || !isCount(s.seen) || !isCount(s.correct) || !isCount(s.streak))
      throw new Error(`${label} "${k}" has invalid counts (must be finite, non-negative integers).`);
    if (s.correct > s.seen || s.streak > s.seen) throw new Error(`${label} "${k}" has more correct answers than attempts.`);
    out[k] = { seen: s.seen, correct: s.correct, streak: s.streak };
  }
  return out;
}

export function validateData(v: unknown): AppData {
  if (!isObj(v)) throw new Error('File is not a Kana backup object.');
  if (v.version !== 1 && v.version !== DATA_VERSION) throw new Error(`Unsupported backup version (expected ${DATA_VERSION} or legacy 1, got ${String(v.version)}).`);
  const s = v.settings;
  if (!isObj(s)) throw new Error('Missing settings.');
  // Additive migration: original backups remain valid without rewriting IDs
  // or discarding first-attempt history, selected rows, or streaks.
  const script = s.script === undefined ? 'hiragana' : s.script;
  // Removed visual options must never make existing progress/backups unreadable.
  const theme = s.theme === undefined || ['hashira', 'grand-line', 'boxing'].includes(String(s.theme)) ? 'paper' : s.theme;
  const appearance = s.appearance === undefined ? 'theme' : s.appearance;
  const reduceMotion = s.reduceMotion === undefined ? false : s.reduceMotion;
  const newPerDay = s.newPerDay === undefined ? 5 : s.newPerDay;
  const countdown = s.countdown ?? null;
  if (countdown !== null && (!isObj(countdown) || typeof countdown.name !== 'string' || !countdown.name.trim() || countdown.name.length > 80 || !validDate(countdown.date))) throw new Error('Countdown needs an event name and a valid YYYY-MM-DD date.');
  if (!isCount(newPerDay) || newPerDay > 50) throw new Error('New-item limit must be an integer from 0 to 50.');
  if (appearance !== 'theme' && appearance !== 'light' && appearance !== 'dark') throw new Error('Unknown theme appearance.');
  if (typeof reduceMotion !== 'boolean') throw new Error('Reduce motion must be true or false.');
  if (script !== 'hiragana' && script !== 'katakana') throw new Error('Unknown writing system.');
  if (typeof theme !== 'string' || !THEME_IDS.includes(theme as ThemeId)) throw new Error('Unknown theme.');
  if (!Array.isArray(s.rows) || !s.rows.every((r) => typeof r === 'string' && ROW_IDS.includes(r)))
    throw new Error('Settings contain unknown kana rows.');
  if (s.minutes !== 3 && s.minutes !== 5 && s.minutes !== 10) throw new Error('Session length must be 3, 5 or 10.');
  if (s.mode !== 'kana' && s.mode !== 'confusable' && s.mode !== 'words') throw new Error('Unknown practice mode.');
  if (typeof s.groupId !== 'string' || (s.groupId !== 'all' && !CONFUSABLE_GROUPS.some((g) => g.id === s.groupId)))
    throw new Error('Unknown look-alike group.');
  const kana = validateStats(v.kana, new Set(ALL_KANA.map((k) => k.char)), 'kana');
  const words = validateStats(v.words, new Set(ALL_WORDS.map((w) => w.id)), 'word');
  if (!Array.isArray(v.practiceDays) || !v.practiceDays.every((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)))
    throw new Error('Practice days must be YYYY-MM-DD dates.');
  return {
    version: DATA_VERSION,
    settings: { rows: [...new Set(s.rows as string[])], minutes: s.minutes, mode: s.mode, groupId: s.groupId, script, theme: theme as ThemeId, appearance, reduceMotion, newPerDay, countdown: countdown === null ? null : { name: (countdown as { name: string }).name.trim(), date: (countdown as { date: string }).date } },
    kana,
    words,
    practiceDays: [...new Set(v.practiceDays as string[])].sort(),
    study: v.study === undefined ? migrateStudy(kana, words) : validateStudy(v.study),
    backup: validateBackup(v.backup, v.practiceDays as string[]),
  };
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validateBackup(value: unknown, days: string[]): AppData['backup'] {
  if (value === undefined) {
    const first = [...days].sort()[0];
    return { trackingSince: first && validDate(first) ? `${first}T12:00:00.000Z` : new Date().toISOString(), lastExportAt: null };
  }
  const iso = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
  if (!isObj(value) || !iso(value.trackingSince) || (value.lastExportAt !== null && !iso(value.lastExportAt))) throw new Error('Invalid backup reminder dates.');
  return { trackingSince: value.trackingSince, lastExportAt: value.lastExportAt as string | null };
}

export function backupOverdue(data: AppData, now = Date.now()) {
  return now - Date.parse(data.backup.lastExportAt ?? data.backup.trackingSince) >= 14 * 86400000;
}

export function markBackupExported(at: string) {
  persist({ ...state.data, backup: { ...state.data.backup, lastExportAt: at } });
}

interface State {
  data: AppData;
  loadError: string | null;
  saveError: string | null;
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: emptyData(), loadError: null, saveError: null };
    return { data: validateData(JSON.parse(raw)), loadError: null, saveError: null };
  } catch (e) {
    return {
      data: emptyData(),
      loadError: `Saved progress could not be read (${e instanceof Error ? e.message : 'unknown error'}). Nothing will be saved until you import a backup or reset in Settings.`,
      saveError: null,
    };
  }
}

let state: State = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function persist(data: AppData, force = false) {
  if (state.loadError && !force) {
    state = { ...state, data };
    emit();
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    state = { data, loadError: null, saveError: null };
  } catch (e) {
    state = { ...state, data, saveError: `Could not save to this device (${e instanceof Error ? e.message : 'storage unavailable'}). Progress from now on may be lost when you close the app.` };
  }
  emit();
}

export function useStore(): State {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
  );
}

export function getData() { return state.data; }

export function updateSettings(patch: Partial<Settings>) {
  persist({ ...state.data, settings: { ...state.data.settings, ...patch } });
}

export function localDay(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function recordAnswer(kind: 'kana' | 'word', id: string, correct: boolean) {
  const d = state.data;
  const key = kind === 'kana' ? 'kana' : 'words';
  const prev = d[key][id] ?? { seen: 0, correct: 0, streak: 0 };
  const next: ItemStat = {
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    streak: correct ? prev.streak + 1 : 0,
  };
  const today = localDay();
  persist({
    ...d,
    [key]: { ...d[key], [id]: next },
    practiceDays: d.practiceDays.includes(today) ? d.practiceDays : [...d.practiceDays, today].sort(),
    study: kind === 'kana'
      ? recordStudy(d.study, `${kind}:${id}`, 'recognition', correct, `free-drill:${today}`)
      : recordReadingExposure(d.study, `word:${id}`, correct),
  });
}

export function recordReview(item: StudyItem, direction: Direction, correct: boolean, sessionId: string) {
  if (state.loadError || state.saveError) throw new Error('Resolve the storage error or export a backup before scheduling more reviews.');
  const d = state.data;
  const today = localDay();
  const introduced = d.study.activity[today]?.newItems.length ?? 0;
  if (!d.study.cards[item.id] && !d.study.activity[today]?.newItems.includes(item.id) && introduced >= d.settings.newPerDay) throw new Error('Your daily new-item limit has been reached. Continue with due reviews.');
  let next = { ...d, study: recordStudy(d.study, item.id, direction, correct, sessionId),
    practiceDays: d.practiceDays.includes(today) ? d.practiceDays : [...d.practiceDays, today].sort() };
  if (direction === 'recognition' && (item.kind === 'kana' || item.kind === 'word')) {
    const key = item.kind === 'kana' ? 'kana' : 'words';
    const id = item.id.slice(item.id.indexOf(':') + 1);
    const previous = d[key][id] ?? { seen: 0, correct: 0, streak: 0 };
    next = { ...next, [key]: { ...d[key], [id]: { seen: previous.seen + 1, correct: previous.correct + Number(correct), streak: correct ? previous.streak + 1 : 0 } } };
  }
  persist(next);
}

export function saveCustom(input: { japanese: string; reading: string; meaning: string; note?: string }, id?: string): string {
  if (state.loadError) throw new Error('Resolve the storage error before changing your deck.');
  if (id && !state.data.study.custom.some((item) => item.id === id)) throw new Error('This custom word no longer exists.');
  if (!id && state.data.study.custom.length >= 1000) throw new Error('The custom deck is limited to 1,000 entries.');
  const customId = id ?? `custom:${crypto.randomUUID()}`;
  const reading = toHiragana(input.reading.trim());
  if (!/^[\u3041-\u3096ー\s、。！？!?・]+$/u.test(reading)) throw new Error('Enter a kana reading (or romaji that converts to kana).');
  const item = validateCustom({ ...input, reading }, customId);
  const study = state.data.study;
  // Only changed answer content must be relearned; note-only edits keep history.
  const cards = { ...study.cards };
  const previous = study.custom.find((entry) => entry.id === id);
  if (id && previous && (previous.japanese !== item.japanese || previous.reading !== item.reading || previous.meanings.join('; ') !== item.meanings.join('; '))) delete cards[id];
  persist({ ...state.data, study: { ...study, cards, custom: id ? study.custom.map((x) => x.id === id ? item : x) : [...study.custom, item] } });
  return customId;
}

export function deleteCustom(id: string) {
  if (state.loadError) throw new Error('Resolve the storage error before changing your deck.');
  const study = state.data.study, cards = { ...study.cards };
  delete cards[id];
  persist({ ...state.data, study: { ...study, cards, custom: study.custom.filter((item) => item.id !== id) } });
}

export function setCombination(id: string, on: boolean) {
  if (!COMBINATION_GROUPS.some((g) => g.id === id)) throw new Error('Unknown combination set.');
  const study = state.data.study;
  persist({ ...state.data, study: { ...study, combinations: on ? [...new Set([...study.combinations, id])] : study.combinations.filter((x) => x !== id) } });
}

export function replaceData(data: AppData) { persist(data, true); }
export function resetData() { persist(emptyData(), true); }

export function streakInfo(days: string[]) {
  const set = new Set(days);
  const d = new Date();
  let current = 0;
  if (!set.has(localDay(d))) d.setDate(d.getDate() - 1);
  while (set.has(localDay(d))) { current++; d.setDate(d.getDate() - 1); }
  let best = 0, run = 0, prev: Date | null = null;
  for (const s of [...set].sort()) {
    const [y, m, dd] = s.split('-').map(Number);
    const cur = new Date(y, m - 1, dd);
    if (prev) {
      const nx = new Date(prev); nx.setDate(nx.getDate() + 1);
      run = localDay(nx) === s ? run + 1 : 1;
    } else run = 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return { current, best, practicedToday: set.has(localDay()) };
}
