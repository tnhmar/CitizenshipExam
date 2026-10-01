import type { ContentBundle, Question } from '../types';

export type Bookmarks = Record<string, { questionId: number; at: number }>;
export const hasBookmark = (bookmarks: Bookmarks, conceptId: string): boolean => Object.prototype.hasOwnProperty.call(bookmarks, conceptId);

export function toggleBookmark(bookmarks: Bookmarks, question: Question, now: number): Bookmarks {
  if (!question.conceptId) return bookmarks;
  const next = { ...bookmarks };
  if (hasBookmark(next, question.conceptId)) delete next[question.conceptId];
  else next[question.conceptId] = { questionId: question.id, at: now };
  return next;
}

export function bookmarkQuestions(bundle: ContentBundle, bookmarks: Bookmarks): { conceptId: string; question: Question; at: number }[] {
  const byConcept = new Map<string, Question>();
  for (const q of Object.values(bundle.questions)) {
    if (!byConcept.has(q.conceptId) || (byConcept.get(q.conceptId)?.origin === 'exam' && q.origin === 'lesson')) byConcept.set(q.conceptId, q);
  }
  return Object.entries(bookmarks).flatMap(([conceptId, saved]) => {
    const exact = bundle.questions[saved.questionId];
    const question = exact?.conceptId === conceptId ? exact : byConcept.get(conceptId);
    return question ? [{ conceptId, question, at: saved.at }] : [];
  }).sort((a, b) => b.at - a.at || a.conceptId.localeCompare(b.conceptId));
}

export function claimReviewStep(seen: Set<string>, step: string): boolean {
  if (seen.has(step)) return false;
  seen.add(step);
  return true;
}
