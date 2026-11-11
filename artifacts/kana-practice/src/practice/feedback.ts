import { toHiragana, toKatakana } from 'wanakana';
import { KANA_BY_CHAR } from '@/data/kana';

/** A small clue, never the complete answer. */
export function rowHint(japanese: string, reading = japanese): string {
  const initial = KANA_BY_CHAR[japanese[0]] ? japanese[0] : toHiragana(reading).normalize('NFD')[0];
  const first = KANA_BY_CHAR[initial] ? initial : undefined;
  const row = first ? KANA_BY_CHAR[first].row.replace(/^kata-/, '') : null;
  return row ? `Hint: ${row}-row${[...japanese].length > 1 ? ' at the start of the reading' : ''}.` : 'Hint: recall the example from its lesson. You can reveal it with “I don’t know”.';
}

export function typedFeedback(value: string, romaji: boolean, katakana = false): string {
  const mapped = romaji ? (katakana ? toKatakana(value) : toHiragana(value)) : value;
  return mapped !== value ? `You typed ${value} → that’s ${mapped}` : `You typed “${value}”`;
}

/** Retry after two intervening cards, or at the end of a shorter queue. */
export function insertRetry<T>(queue: T[], index: number, item: T): T[] {
  const next = [...queue];
  next.splice(Math.min(index + 3, next.length), 0, item);
  return next;
}
