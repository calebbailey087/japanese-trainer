import {
  CONFUSABLE_GROUPS, KANA_BY_CHAR, getRows, getWords, spellings, type ConfusableGroup, type KanaScript,
} from '@/data/kana';
import type { ItemStat } from '@/storage/store';

export type Mode = 'kana' | 'confusable' | 'words';

export interface QuizItem {
  kind: 'kana' | 'word';
  id: string;
  prompt: string;
  answer: string;
  meaning?: string;
}

export function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '');
}

/** Match per-kana variants while tracking the preceding vowel for ー. */
export function isCorrect(text: string, input: string): boolean {
  const n = normalize(input);
  if (!n) return false;
  let states: { offset: number; vowel: string | null }[] = [{ offset: 0, vowel: null }];
  for (const char of text) {
    const next = new Map<string, { offset: number; vowel: string | null }>();
    for (const state of states) {
      const choices = char === 'ー' ? (state.vowel ? [state.vowel] : []) : spellings(char);
      for (const choice of choices) {
        if (!n.startsWith(choice, state.offset)) continue;
        const vowel = /[aeiou]$/.test(choice) ? choice.slice(-1) : null;
        const offset = state.offset + choice.length;
        next.set(`${offset}:${vowel}`, { offset, vowel });
      }
    }
    states = [...next.values()];
    if (!states.length) return false;
  }
  return states.some((state) => state.offset === n.length);
}

export function eligibleGroups(rows: string[], script: KanaScript = 'hiragana'): { group: ConfusableGroup; chars: string[] }[] {
  return CONFUSABLE_GROUPS.filter((group) => group.script === script).map((group) => ({
    group,
    chars: group.chars.filter((c) => rows.includes(KANA_BY_CHAR[c].row)),
  })).filter((g) => g.chars.length >= 2);
}

export function eligibleWords(rows: string[], script: KanaScript = 'hiragana') {
  return getWords(script).filter((w) => w.rows.every((r) => rows.includes(r)));
}

export function buildPool(mode: Mode, rows: string[], groupId: string, script: KanaScript = 'hiragana'): QuizItem[] {
  if (mode === 'kana') {
    return getRows(script).filter((r) => rows.includes(r.id)).flatMap((r) =>
      r.kana.map((k) => ({ kind: 'kana' as const, id: k.char, prompt: k.char, answer: k.romaji })),
    );
  }
  if (mode === 'confusable') {
    const groups = eligibleGroups(rows, script).filter((g) => groupId === 'all' || g.group.id === groupId);
    const chars = [...new Set(groups.flatMap((g) => g.chars))];
    return chars.map((c) => ({ kind: 'kana' as const, id: c, prompt: c, answer: KANA_BY_CHAR[c].romaji }));
  }
  return eligibleWords(rows, script).map((w) => ({
    kind: 'word' as const, id: w.id, prompt: w.kana, answer: w.romaji, meaning: w.meaning,
  }));
}

export function weight(stat: ItemStat | undefined): number {
  if (!stat || stat.seen === 0) return 2;
  const misses = stat.seen - stat.correct;
  const missRate = misses / stat.seen;
  return Math.max(0.15, (1 + 4 * missRate + Math.min(misses, 5) * 0.3) / (1 + stat.streak * 0.8));
}

export function pickNext(
  pool: QuizItem[],
  stats: (item: QuizItem) => ItemStat | undefined,
  lastId: string | null,
): QuizItem {
  const candidates = pool.length > 1 ? pool.filter((p) => p.id !== lastId) : pool;
  const weights = candidates.map((c) => weight(stats(c)));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
