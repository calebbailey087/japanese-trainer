import { toHiragana, toKatakana, toRomaji } from 'wanakana';
import type { StudyItem } from './types';
export const COMBINATION_GROUPS = [
  { id: 'hira-dakuten', label: 'Hiragana: dakuten / handakuten' },
  { id: 'kata-dakuten', label: 'Katakana: dakuten / handakuten' },
  { id: 'hira-yoon', label: 'Hiragana: small-kana combinations' },
  { id: 'kata-yoon', label: 'Katakana: small-kana combinations' },
  { id: 'hira-small-tsu', label: 'Hiragana: small っ in context' },
  { id: 'kata-small-tsu', label: 'Katakana: small ッ in context' },
  { id: 'kata-extended', label: 'Katakana: extended sounds' },
];
const voiced = 'ga gi gu ge go za ji zu ze zo da di du de do ba bi bu be bo pa pi pu pe po'.split(' ').map((r) => toHiragana(r));
// WanaKana intentionally normalizes di/du; retain the distinct taught glyphs.
voiced[11] = 'ぢ'; voiced[12] = 'づ';
const yoon = ['き', 'し', 'ち', 'に', 'ひ', 'み', 'り', 'ぎ', 'じ', 'び', 'ぴ'].flatMap((k) => ['ゃ', 'ゅ', 'ょ'].map((y) => k + y));
const groups: [string, string[]][] = [
  ['hira-dakuten', voiced], ['kata-dakuten', voiced.map((s) => toKatakana(s))],
  ['hira-yoon', yoon], ['kata-yoon', yoon.map((s) => toKatakana(s))],
  ['hira-small-tsu', ['きって', 'がっこう']], ['kata-small-tsu', ['カット', 'キット']],
  ['kata-extended', ['ファ', 'フィ', 'フェ', 'フォ', 'ティ', 'ディ', 'トゥ', 'ドゥ', 'ウィ', 'ウェ', 'ウォ', 'ヴァ', 'ヴィ', 'ヴ', 'ヴェ', 'ヴォ', 'シェ', 'ジェ', 'チェ']],
];
export const COMBINATIONS: StudyItem[] = groups.flatMap(([comboGroup, glyphs]) => glyphs.map((japanese) => ({
  id: `combo:${japanese}`, kind: 'combo' as const, japanese, reading: toHiragana(japanese),
  meanings: [toRomaji(japanese)], comboGroup,
  requiresKana: [], requiresKanji: [], requiresWords: [],
  source: 'WanaKana transliteration; standard kana combinations',
  note: comboGroup.includes('small-tsu') ? 'Small っ/ッ doubles the following consonant. Practice it in a complete reading, not alone.' : undefined,
})));
