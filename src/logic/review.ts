import type { ContentBundle, SrsCard } from '../types';
import { conceptPool, reviewWorkload } from './learningStats';
import { unresolved, type ReviewCard } from './reviewGrading';
import { shuffleSeeded } from './shuffle';
import { dueCards } from './srs';

export type DeckKind = 'due' | 'missed' | 'history' | 'random';
export function eligibleReviewCards(bundle: ContentBundle, cards: SrsCard[]): ReviewCard[] {
  const pool = conceptPool(bundle);
  const representatives = new Map<string, number>();
  for (const lesson of bundle.lessons) for (const id of lesson.questionIds) {
    const q = bundle.questions[id];
    if (q && !representatives.has(q.conceptId)) representatives.set(q.conceptId, id);
  }
  const unique = new Map<string, ReviewCard>();
  for (const card of cards) {
    if (!pool.has(card.conceptId) || !Number.isFinite(card.due)) continue;
    const exact = bundle.questions[card.questionId];
    const id = exact?.conceptId === card.conceptId ? card.questionId : representatives.get(card.conceptId);
    if (id !== undefined) unique.set(card.conceptId, { ...card, questionId: id });
  }
  return [...unique.values()];
}
export function countDue(cards: SrsCard[], now: number, bundle?: ContentBundle): number {
  return bundle ? reviewWorkload(bundle, cards, now).due : dueCards(cards, now).length;
}
export function countMissed(cards: SrsCard[], bundle?: ContentBundle): number {
  return (bundle ? eligibleReviewCards(bundle, cards) : cards).filter((c) => c.lapses > 0).length;
}
export function countUnresolved(bundle: ContentBundle, cards: SrsCard[]): number {
  return eligibleReviewCards(bundle, cards).filter(unresolved).length;
}
export function nextDueAfter(cards: SrsCard[], now: number, bundle?: ContentBundle): number | null {
  const rows = bundle ? eligibleReviewCards(bundle, cards) : cards;
  const later = rows.map((c) => c.due).filter((d) => Number.isFinite(d) && d > now);
  return later.length ? Math.min(...later) : null;
}
const practicedAt = (card: ReviewCard): number => card.lastPracticedAt ?? card.lastReviewed;
export function buildDeck(kind: DeckKind, bundle: ContentBundle, cards: SrsCard[], now: number, size: number, seed: number): number[] {
  if (!Number.isSafeInteger(size) || size <= 0) return [];
  const eligible = eligibleReviewCards(bundle, cards);
  const byConcept = new Map(eligible.map((card) => [card.conceptId, card]));
  const oldest = (rows: ReviewCard[]) => shuffleSeeded(rows, seed).sort((a, b) => practicedAt(a) - practicedAt(b));
  let ids: number[];
  if (kind === 'due') {
    ids = oldest(eligible.filter((c) => c.due <= now)).sort((a, b) => a.due - b.due).map((c) => c.questionId);
  } else if (kind === 'history') {
    ids = oldest(eligible.filter((c) => c.lapses > 0)).map((c) => c.questionId);
  } else if (kind === 'missed') {
    const pending = eligible.filter(unresolved);
    const due = oldest(pending.filter((c) => c.due <= now)).slice(0, Math.ceil(size * 0.6));
    const picked = new Set(due.map((c) => c.conceptId));
    ids = [...due, ...oldest(pending.filter((c) => !picked.has(c.conceptId)))].map((c) => c.questionId);
  } else {
    const pool = new Map<string, number>();
    for (const lesson of bundle.lessons) for (const id of lesson.questionIds) {
      const q = bundle.questions[id]; if (q && !pool.has(q.conceptId)) pool.set(q.conceptId, id);
    }
    ids = shuffleSeeded([...pool.values()], seed).sort((a, b) => {
      const left = byConcept.get(bundle.questions[a].conceptId);
      const right = byConcept.get(bundle.questions[b].conceptId);
      return (left ? practicedAt(left) : -1) - (right ? practicedAt(right) : -1);
    });
  }
  return [...new Set(ids)].slice(0, size);
}
