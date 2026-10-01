import type { Grade, SrsCard } from '../types';
import { DAY_MS, startOfDay } from './progress';

export function gradeFrom(correct: boolean, confidence: Grade): Grade {
  if (!correct || confidence === 'unknown') return 'unknown';
  return confidence;
}

export function newCard(questionId: number, conceptId: string, now: number): SrsCard {
  return { questionId, conceptId, interval: 0, ease: 2.5, reps: 0, lapses: 0, due: now, lastReviewed: now };
}

export function schedule(card: SrsCard, grade: Grade, now: number): SrsCard {
  let { interval, ease, reps, lapses } = card;
  if (grade === 'know') {
    interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease);
    ease = Math.min(3, ease + 0.05);
    reps += 1;
  } else if (grade === 'guess') {
    interval = Math.max(1, Math.round(Math.max(interval, 1) * 1.2));
    ease = Math.max(1.3, ease - 0.05);
    reps += 1;
  } else {
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
    reps = 0;
    lapses += 1;
  }
  return { ...card, interval, ease, reps, lapses, due: startOfDay(now) + interval * DAY_MS, lastReviewed: now };
}

export function isDue(card: SrsCard, now: number): boolean {
  return card.due <= now;
}

export function dueCards(cards: SrsCard[], now: number): SrsCard[] {
  return cards.filter((c) => isDue(c, now)).sort((a, b) => a.due - b.due);
}
