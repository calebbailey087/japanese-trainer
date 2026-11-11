import { useCallback, useEffect, useState } from 'react';
import { ALL_KANA, ALL_WORDS } from '@/data/kana';
import { toHiragana } from 'wanakana';
import { COMBINATIONS } from './combos';
import { PHRASES } from './phrases';
import type { Catalog, ImportMeta, KanjiEntry, KanjiGroup, StudyItem } from './types';
export { COMBINATION_GROUPS } from './combos';
let pending: Promise<Catalog> | null = null;
export function loadCatalog(): Promise<Catalog> {
  if (!pending) pending = import('../data/generated/content.json').then((module) => {
    const raw = module.default as unknown as { kanji: KanjiEntry[]; vocabulary: StudyItem[]; sentences: StudyItem[]; groups: KanjiGroup[]; meta: ImportMeta };
    if (raw.kanji.length !== 2136 || raw.vocabulary.length < 3000 || !raw.sentences.length) throw new Error('Study dataset is incomplete.');
    const base: StudyItem[] = ALL_KANA.map((k) => ({
      id: `kana:${k.char}`, kind: 'kana', japanese: k.char, reading: toHiragana(k.char), meanings: [k.romaji],
      requiresKana: [k.char], requiresKanji: [], requiresWords: [], source: 'User-supplied kana',
    }));
    const words: StudyItem[] = ALL_WORDS.map((w) => ({
      id: `word:${w.id}`, kind: 'word', japanese: w.kana, reading: toHiragana(w.kana), meanings: [w.meaning],
      requiresKana: [...new Set([...w.kana].filter((c) => c !== 'ー'))], requiresKanji: [], requiresWords: [],
      source: 'User-supplied starter words',
    }));
    // Keep all characters in the library, but never quiz a fabricated example.
    const kanji: StudyItem[] = raw.kanji.filter((k) => k.examples.length > 0).map((k) => {
      const example = k.examples[0];
      return {
        id: `kanji:${k.char}`, kind: 'kanji', character: k.char, japanese: example?.japanese ?? k.char,
        reading: example?.reading ?? '', meanings: example ? [example.meaning] : k.meanings, groupId: k.groupId,
        requiresKana: [], requiresKanji: [], requiresWords: [], source: 'KANJIDIC2 / JMdict',
      };
    });
    return { ...raw, items: [...base, ...COMBINATIONS, ...words, ...PHRASES, ...kanji, ...raw.vocabulary, ...raw.sentences] };
  }).catch((error) => { pending = null; throw error; });
  return pending;
}
export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => { setError(null); setVersion((v) => v + 1); }, []);
  useEffect(() => {
    let live = true;
    loadCatalog().then((result) => { if (live) setCatalog(result); }).catch((e: unknown) => {
      if (live) setError(e instanceof Error ? e.message : 'Content could not load.');
    });
    return () => { live = false; };
  }, [version]);
  return { catalog, error, loading: !catalog && !error, retry };
}
