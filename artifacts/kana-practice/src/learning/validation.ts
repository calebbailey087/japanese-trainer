import { z } from 'zod';
import { emptyStudy, newCard } from './srs';
import { COMBINATION_GROUPS } from './combos';
import type { StudyData, StudyItem } from './types';
const count = z.number().int().min(0).max(100000000);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(`${s}T12:00:00Z`);
  return Number.isFinite(+d) && d.toISOString().slice(0, 10) === s;
}, 'Invalid calendar day');
const id = z.string().max(180).regex(/^(kana|word|combo|kanji|vocab|sentence|phrase|custom):.+$/u);
const schedule = z.object({
  due: z.string().datetime({ offset: true }), interval: z.number().finite().min(0).max(365000),
  ease: z.number().finite().min(1.3).max(5), repetitions: count, seen: count, correct: count,
  correctDays: z.array(day).max(50000), sessions: z.array(z.string().max(180)).max(40),
  lastDay: day.nullable(),
}).refine((s) => s.correct <= s.seen && s.repetitions <= s.seen, 'Impossible review counts');
const custom = z.object({
  id: z.string().startsWith('custom:').max(180), kind: z.literal('custom'),
  japanese: z.string().trim().min(1).max(160), reading: z.string().trim().min(1).max(240),
  meanings: z.array(z.string().min(1).max(300)).min(1).max(10), note: z.string().max(1000).optional(),
  requiresKana: z.array(z.string()), requiresKanji: z.array(z.string()), requiresWords: z.array(z.string()),
  source: z.string().optional(),
});
const schema = z.object({
  cards: z.record(id, z.object({ introduced: day, recognition: schedule, production: schedule }))
    .refine((x) => Object.keys(x).length <= 30000, 'Too many review cards'),
  custom: z.array(custom).max(1000).refine((items) => new Set(items.map((x) => x.id)).size === items.length, 'Duplicate custom word IDs'),
  activity: z.record(day, z.object({
    answers: count, correct: count, newItems: z.array(id).max(30000),
  }).refine((a) => a.correct <= a.answers, 'Impossible activity counts')),
  combinations: z.array(z.string()).refine((ids) => ids.every((x) => COMBINATION_GROUPS.some((g) => g.id === x)), 'Unknown combination set'),
});
export function validateStudy(value: unknown): StudyData {
  return schema.parse(value) as StudyData;
}
export function migrateStudy(kana: Record<string, { seen: number }>, words: Record<string, { seen: number }>): StudyData {
  const study = emptyStudy();
  for (const [prefix, stats] of [['kana', kana], ['word', words]] as const) {
    for (const [key, stat] of Object.entries(stats)) if (stat.seen > 0) study.cards[`${prefix}:${key}`] = newCard();
  }
  return study;
}
export function validateCustom(input: { japanese: string; reading: string; meaning: string; note?: string }, customId: string): StudyItem {
  return custom.parse({
    id: customId, kind: 'custom', japanese: input.japanese, reading: input.reading,
    meanings: [input.meaning.trim()], note: input.note?.trim() ?? '',
    requiresKana: [], requiresKanji: [], requiresWords: [], source: 'My words',
  }) as StudyItem;
}
