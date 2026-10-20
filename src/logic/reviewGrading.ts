import type { AssessmentContext } from './assessmentCapture';
import { DAY_MS } from './progress';
import { newCard, schedule } from './srs';
import type { Grade, Question, SrsCard } from '../types';

export const RELEARN_MS = 10 * 60000;
export const RECALL_CREDIT_MS = DAY_MS;
export type ReviewCard = SrsCard & {
  needsWork?: boolean;
  lastOutcome?: Grade;
  lastPracticedAt?: number;
  lastScheduledAt?: number;
  relearning?: boolean;
};
export function unresolved(card: ReviewCard): boolean {
  return card.needsWork ?? card.lapses > 0;
}
export function reviewActionId(q: Question, context?: AssessmentContext): string | null {
  return context ? JSON.stringify([context.sessionId, context.stepId, q.id]) : null;
}
export function applyReviewGrade(
  cards: Record<string, ReviewCard>, actions: Record<string, true>, q: Question,
  grade: Grade, now: number, context?: AssessmentContext,
): { cards: Record<string, ReviewCard>; reviewActionIds: Record<string, true> } | null {
  if (!q.conceptId || !Number.isFinite(now) || now < 0 || !['know', 'guess', 'unknown'].includes(grade)) return null;
  const id = reviewActionId(q, context);
  if (id && Object.prototype.hasOwnProperty.call(actions, id)) return null;
  const previous = cards[q.conceptId];
  const card = previous ?? newCard(q.id, q.conceptId, now);
  const elapsed = now - (card.lastScheduledAt ?? card.lastReviewed);
  const independent = !context || (context.retry !== 'missed' && (context.response === 'selfReport' || context.firstResponse));
  const due = card.due <= now;
  let next: ReviewCard = { ...card };
  if (grade === 'unknown') {
    next = { ...schedule(card, grade, now), due: now + RELEARN_MS, lastScheduledAt: now, needsWork: true, relearning: true };
  } else if (independent && (!previous || (due && elapsed >= RECALL_CREDIT_MS))) {
    const objective = context?.response === 'objective' && context.firstResponse;
    next = { ...schedule(card, grade, now), lastScheduledAt: now, relearning: false,
      needsWork: grade === 'guess' ? true : objective ? false : unresolved(card) };
    next.due = now + next.interval * DAY_MS;
  } else if (independent && due && card.relearning) {
    // A short relearning success schedules tomorrow without granting a recall promotion.
    next = { ...card, due: now + DAY_MS, interval: 1, lastScheduledAt: now, relearning: false, needsWork: true };
  }
  if (grade === 'guess') next.needsWork = true;
  next = { ...next, questionId: q.id, lastOutcome: grade, lastPracticedAt: now };
  return {
    cards: { ...cards, [q.conceptId]: next },
    reviewActionIds: id ? { ...actions, [id]: true } : actions,
  };
}
