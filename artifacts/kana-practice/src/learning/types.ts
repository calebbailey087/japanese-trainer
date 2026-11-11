export type ItemKind = 'kana' | 'combo' | 'kanji' | 'vocab' | 'sentence' | 'phrase' | 'custom' | 'word';
export type Direction = 'recognition' | 'production';
export type Stage = 'New' | 'Learning' | 'Familiar' | 'Strong' | 'Mastered';
export const STAGES: Stage[] = ['New', 'Learning', 'Familiar', 'Strong', 'Mastered'];
export interface StudyItem {
  id: string;
  kind: ItemKind;
  japanese: string;
  reading: string;
  meanings: string[];
  requiresKana: string[];
  requiresKanji: string[];
  requiresWords: string[];
  note?: string;
  source?: string;
  attribution?: string;
  topic?: string;
  groupId?: string;
  character?: string;
  comboGroup?: string;
  particleIndices?: number[];
}
export interface KanjiEntry {
  char: string; meanings: string[]; on: string[]; kun: string[];
  grade: number; jlpt: number | null; frequency: number | null; strokes: number; groupId: string;
  examples: { japanese: string; reading: string; meaning: string; common?: boolean }[];
  exampleStatus?: string;
}
export interface KanjiGroup { id: string; name: string; characters: string[] }
export interface ImportMeta {
  importedAt: string; kanjiCount: number; vocabularyCount: number; sentenceCount: number; starterCount: number;
  sources: { file: string; url: string; sha256: string }[];
  dictionaryLicense: string; sentenceLicense: string; sentencePolicy: string;
}
export interface Catalog {
  items: StudyItem[]; kanji: KanjiEntry[]; groups: KanjiGroup[]; meta: ImportMeta;
}
export interface Schedule {
  due: string; interval: number; ease: number; repetitions: number; seen: number; correct: number;
  correctDays: string[]; sessions: string[]; lastDay: string | null;
}
export interface CardState { introduced: string; recognition: Schedule; production: Schedule }
export interface Activity { answers: number; correct: number; newItems: string[] }
export interface StudyData {
  cards: Record<string, CardState>; custom: StudyItem[];
  activity: Record<string, Activity>; combinations: string[];
}
export interface ReviewTask { item: StudyItem; direction: Direction; mode: 'text' | 'listening' | 'particle' }
