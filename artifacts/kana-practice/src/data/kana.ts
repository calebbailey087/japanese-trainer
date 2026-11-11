export type KanaScript = 'hiragana' | 'katakana';

export interface Kana {
  char: string;
  romaji: string;
  row: string;
}

export interface KanaRow {
  id: string;
  label: string;
  kana: Kana[];
  script: KanaScript;
}

const raw: [string, string][] = [
  ['a', 'あa いi うu えe おo'],
  ['ka', 'かka きki くku けke こko'],
  ['sa', 'さsa しshi すsu せse そso'],
  ['ta', 'たta ちchi つtsu てte とto'],
  ['na', 'なna にni ぬnu ねne のno'],
  ['ha', 'はha ひhi ふfu へhe ほho'],
  ['ma', 'まma みmi むmu めme もmo'],
  ['ya', 'やya ゆyu よyo'],
  ['ra', 'らra りri るru れre ろro'],
  ['wa', 'わwa をwo んn'],
];

export const KANA_ROWS: KanaRow[] = raw.map(([id, s]) => ({
  id,
  script: 'hiragana',
  label: s.split(' ')[0][0],
  kana: s.split(' ').map((t) => ({ char: t[0], romaji: t.slice(1), row: id })),
}));

// User-supplied base set only. Dakuten and small kana are deferred.
const katakanaRaw: [string, string][] = [
  ['a', 'アa イi ウu エe オo'],
  ['ka', 'カka キki クku ケke コko'],
  ['sa', 'サsa シshi スsu セse ソso'],
  ['ta', 'タta チchi ツtsu テte トto'],
  ['na', 'ナna ニni ヌnu ネne ノno'],
  ['ha', 'ハha ヒhi フfu ヘhe ホho'],
  ['ma', 'マma ミmi ムmu メme モmo'],
  ['ya', 'ヤya ユyu ヨyo'],
  ['ra', 'ラra リri ルru レre ロro'],
  ['wa', 'ワwa ヲwo ンn'],
];

export const KATAKANA_ROWS: KanaRow[] = katakanaRaw.map(([id, s]) => ({
  id: `kata-${id}`,
  label: s.split(' ')[0][0],
  script: 'katakana',
  kana: s.split(' ').map((t) => ({ char: t[0], romaji: t.slice(1), row: `kata-${id}` })),
}));

export function getRows(script: KanaScript): KanaRow[] {
  return script === 'katakana' ? KATAKANA_ROWS : KANA_ROWS;
}

export const ALL_KANA: Kana[] = [...KANA_ROWS, ...KATAKANA_ROWS].flatMap((r) => r.kana);
export const KANA_BY_CHAR: Record<string, Kana> = Object.fromEntries(ALL_KANA.map((k) => [k.char, k]));
export const ROW_IDS = [...KANA_ROWS, ...KATAKANA_ROWS].map((r) => r.id);

/** Accepted romaji spellings for each kana (first is canonical). */
export const VARIANTS: Record<string, string[]> = {
  し: ['shi', 'si'],
  ち: ['chi', 'ti'],
  つ: ['tsu', 'tu'],
  ふ: ['fu', 'hu'],
  を: ['wo', 'o'],
  ん: ['n', 'nn'],
  シ: ['shi', 'si'],
  チ: ['chi', 'ti'],
  ツ: ['tsu', 'tu'],
  フ: ['fu', 'hu'],
  ヲ: ['wo', 'o'],
  ン: ['n', 'nn'],
};

export function spellings(char: string): string[] {
  return VARIANTS[char] ?? (KANA_BY_CHAR[char] ? [KANA_BY_CHAR[char].romaji] : []);
}

export interface ConfusableGroup {
  id: string;
  chars: string[];
  script: KanaScript;
}

export const CONFUSABLE_GROUPS: ConfusableGroup[] = [
  ...['あお', 'きさち', 'たな', 'こそ', 'はほけに', 'ひへ', 'ぬめ', 'るろ', 'まよ', 'れわね']
    .map((s) => ({ id: s, chars: [...s], script: 'hiragana' as const })),
  ...['シツ', 'ソン', 'クケタ', 'ウワフ', 'アマ', 'コユロ', 'ナメ', 'チテ', 'ヌス']
    .map((s) => ({ id: s, chars: [...s], script: 'katakana' as const })),
];

export interface Word {
  id: string;
  kana: string;
  romaji: string;
  meaning: string;
  rows: string[];
  script: KanaScript;
}

const wordRaw: [string, string, string][] = [
  ['あか', 'aka', 'red'], ['あお', 'ao', 'blue'], ['いぬ', 'inu', 'dog'], ['ねこ', 'neko', 'cat'],
  ['すし', 'sushi', 'sushi'], ['おいしい', 'oishii', 'delicious'], ['えき', 'eki', 'station'],
  ['あした', 'ashita', 'tomorrow'], ['くち', 'kuchi', 'mouth'], ['さけ', 'sake', 'salmon / rice wine'],
  ['あき', 'aki', 'autumn'], ['なつ', 'natsu', 'summer'], ['ほね', 'hone', 'bone'],
  ['はな', 'hana', 'flower / nose'], ['ふね', 'fune', 'ship'], ['おかね', 'okane', 'money'],
  ['なに', 'nani', 'what'], ['ひと', 'hito', 'person'], ['ほし', 'hoshi', 'star'], ['くま', 'kuma', 'bear'],
  ['もも', 'momo', 'peach'], ['むし', 'mushi', 'bug'], ['みみ', 'mimi', 'ear'], ['あめ', 'ame', 'rain'],
  ['やま', 'yama', 'mountain'], ['ゆき', 'yuki', 'snow'], ['ゆめ', 'yume', 'dream'], ['よる', 'yoru', 'night'],
  ['ここ', 'koko', 'here'], ['そこ', 'soko', 'there'],
];

function makeWord([kana, romaji, meaning]: [string, string, string], script: KanaScript): Word {
  return {
  id: kana,
  kana,
  romaji,
  meaning,
  script,
  // ー extends the preceding vowel and has no independent row.
  rows: [...new Set([...kana].filter((c) => c !== 'ー').map((c) => KANA_BY_CHAR[c].row))],
  };
}

export const WORDS: Word[] = wordRaw.map((word) => makeWord(word, 'hiragana'));

const katakanaWordRaw: [string, string, string][] = [
  ['トイレ', 'toire', 'toilet'],
  ['コーヒー', 'koohii', 'coffee'],
  ['ホテル', 'hoteru', 'hotel'],
  ['タクシー', 'takushii', 'taxi'],
  ['ケーキ', 'keeki', 'cake'],
  ['アイス', 'aisu', 'ice cream'],
  ['カメラ', 'kamera', 'camera'],
  ['ノート', 'nooto', 'notebook'],
  ['ミルク', 'miruku', 'milk'],
  ['アメリカ', 'amerika', 'America'],
  ['ラーメン', 'raamen', 'ramen'],
  ['スマホ', 'sumaho', 'smartphone'],
  ['レストラン', 'resutoran', 'restaurant'],
  ['タオル', 'taoru', 'towel'],
  ['マスク', 'masuku', 'face mask'],
  ['ホーム', 'hoomu', 'train platform'],
];

export const KATAKANA_WORDS = katakanaWordRaw.map((word) => makeWord(word, 'katakana'));
export const ALL_WORDS = [...WORDS, ...KATAKANA_WORDS];

export function getWords(script: KanaScript): Word[] {
  return script === 'katakana' ? KATAKANA_WORDS : WORDS;
}
