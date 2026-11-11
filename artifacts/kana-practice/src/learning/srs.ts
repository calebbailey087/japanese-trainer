import type { CardState, Direction, Schedule, Stage, StudyData } from './types';
export const DAY = 86400000;
export function dayKey(date = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
export function emptySchedule(now = new Date()): Schedule {
  return { due: now.toISOString(), interval: 0, ease: 2.5, repetitions: 0, seen: 0, correct: 0, correctDays: [], sessions: [], lastDay: null };
}
export function emptyStudy(): StudyData {
  return { cards: {}, custom: [], activity: {}, combinations: [] };
}
export function newCard(now = new Date()): CardState {
  return { introduced: dayKey(now), recognition: emptySchedule(now), production: emptySchedule(now) };
}
/** SM-2 with quality 4 for a correct typed answer, 1 for a miss.
 * Only one successful interval expansion per direction per local day.
 * A lapse always resets the interval to a ten-minute relearning step.
 */
export function scheduleAnswer(previous: Schedule, correct: boolean, session: string, now = new Date()): Schedule {
  const day = dayKey(now);
  const out = { ...previous, seen: previous.seen + 1, correct: previous.correct + Number(correct) };
  if (!correct) {
    return { ...out, ease: Math.max(1.3, previous.ease - 0.54), interval: 0, repetitions: 0, due: new Date(+now + 600000).toISOString(), lastDay: day };
  }
  const newDay = !previous.correctDays.includes(day);
  const days = newDay ? [...previous.correctDays, day].sort() : previous.correctDays;
  const sessions = previous.sessions.includes(session) ? previous.sessions : [...previous.sessions, session].slice(-40);
  // Same-day drills do not manufacture multi-day mastery or push due dates away.
  if (!newDay && previous.repetitions > 0) return { ...out, correctDays: days, sessions };
  const interval = previous.repetitions === 0 ? 1 : previous.repetitions === 1 ? 6 : Math.max(1, Math.round(previous.interval * previous.ease));
  return { ...out, repetitions: previous.repetitions + 1, interval, due: new Date(+now + interval * DAY).toISOString(), correctDays: days, sessions, lastDay: day };
}
export function stageOf(card?: CardState): Stage {
  if (!card) return 'New';
  const days = new Set([...card.recognition.correctDays, ...card.production.correctDays]).size;
  const both = card.recognition.correctDays.length > 0 && card.production.correctDays.length > 0;
  if (both && days >= 8 && card.recognition.correctDays.length >= 3 && card.production.correctDays.length >= 3) return 'Mastered';
  if (both && days >= 4) return 'Strong';
  if (days >= 2) return 'Familiar';
  return 'Learning';
}
export function recordStudy(study: StudyData, id: string, direction: Direction, correct: boolean, session: string, now = new Date()): StudyData {
  const card = study.cards[id] ?? newCard(now);
  const day = dayKey(now);
  const activity = study.activity[day] ?? { answers: 0, correct: 0, newItems: [] };
  return {
    ...study,
    cards: { ...study.cards, [id]: { ...card, [direction]: scheduleAnswer(card[direction], correct, session, now) } },
    activity: { ...study.activity, [day]: {
      answers: activity.answers + 1, correct: activity.correct + Number(correct),
      newItems: study.cards[id] ? activity.newItems : [...new Set([...activity.newItems, id])],
    } },
  };
}
/** Legacy word drills test pronunciation, not English recognition.
 * Preserve their activity and add the semantic card as due, without crediting
 * an English answer the learner has never given.
 */
export function recordReadingExposure(study: StudyData, id: string, correct: boolean, now = new Date()): StudyData {
  const day = dayKey(now), activity = study.activity[day] ?? { answers: 0, correct: 0, newItems: [] };
  return {
    ...study,
    cards: study.cards[id] ? study.cards : { ...study.cards, [id]: newCard(now) },
    activity: { ...study.activity, [day]: { answers: activity.answers + 1, correct: activity.correct + Number(correct),
      newItems: study.cards[id] ? activity.newItems : [...new Set([...activity.newItems, id])] } },
  };
}
