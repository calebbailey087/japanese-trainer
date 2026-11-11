import type { StudyItem } from './types';
const raw: [string, string, string][] = [
  ['すみません', 'すみません', 'excuse me / sorry'],
  ['ありがとうございます', 'ありがとうございます', 'thank you'],
  ['おねがいします', 'おねがいします', 'please'],
  ['これ、おねがいします', 'これ、おねがいします', 'this, please'],
  ['これ、ください', 'これ、ください', 'this, please'],
  ['トイレはどこですか', 'といれはどこですか', 'where is the toilet?'],
  ['えきはどこですか', 'えきはどこですか', 'where is the station?'],
  ['だいじょうぶです', 'だいじょうぶです', "I'm okay / no thanks"],
  ['わかりません', 'わかりません', "I don't understand"],
  ['もういちど おねがいします', 'もういちど おねがいします', 'once more, please'],
  ['ゆっくり おねがいします', 'ゆっくり おねがいします', 'slowly, please'],
  ['いくらですか', 'いくらですか', 'how much is it?'],
  ['おかいけい おねがいします', 'おかいけい おねがいします', 'check, please'],
  ['びょういんはどこですか', 'びょういんはどこですか', 'where is the hospital?'],
  ['くすりはありますか', 'くすりはありますか', 'do you have medicine?'],
  ['アレルギーがあります', 'あれるぎーがあります', 'I have an allergy'],
  ['いたいです', 'いたいです', 'it hurts'],
];
export const PHRASES: StudyItem[] = raw.map(([japanese, reading, meaning], i) => ({
  id: `phrase:${i + 1}`, kind: 'phrase', japanese, reading, meanings: meaning.split(' / '),
  requiresKana: [], requiresKanji: [], requiresWords: [], source: 'User-supplied survival deck',
}));
