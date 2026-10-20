import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import { reviewResponseContext } from './assessmentRuns';
import { applyReviewGrade, RELEARN_MS, type ReviewCard } from './reviewGrading';
import { DAY_MS } from './progress';

const bundle = makeBundle(); const q = bundle.questions[1]; const now = 1000000000000;
const context = (session: string, at: number, round = 0) => reviewResponseContext(session, round, 0, at, 'objective', true, 'know');
describe('review scheduling transactions', () => {
  test('a repeated transaction cannot add another lapse or alter scheduling', () => {
    const ctx = context('first', now);
    const first = applyReviewGrade({}, {}, q, 'unknown', now, { ...ctx, correct: false })!;
    expect(first.cards[q.conceptId].lapses).toBe(1);
    expect(applyReviewGrade(first.cards, first.reviewActionIds, q, 'unknown', now + 1, ctx)).toBeNull();
    const persisted = JSON.parse(JSON.stringify(first));
    expect(applyReviewGrade(persisted.cards, persisted.reviewActionIds, q, 'unknown', now + 2, ctx)).toBeNull();
  });
  test('missed-only success never promotes or clears unresolved state', () => {
    const failed = applyReviewGrade({}, {}, q, 'unknown', now, context('first', now))!;
    const corrected = applyReviewGrade(failed.cards, failed.reviewActionIds, q, 'know', now + 100, context('first', now + 100, 1))!;
    expect(corrected.cards[q.conceptId]).toMatchObject({ reps: 0, lapses: 1, due: now + RELEARN_MS, needsWork: true });
  });
  test('fresh sessions minutes apart also cannot promote the interval', () => {
    const first = applyReviewGrade({}, {}, q, 'know', now, context('one', now))!;
    const second = applyReviewGrade(first.cards, first.reviewActionIds, q, 'know', now + 100, context('two', now + 100))!;
    expect(second.cards[q.conceptId].reps).toBe(first.cards[q.conceptId].reps);
    expect(second.cards[q.conceptId].due).toBe(first.cards[q.conceptId].due);
  });
  test('relearning success schedules tomorrow; later objective recall resolves', () => {
    const failed = applyReviewGrade({}, {}, q, 'unknown', now, context('one', now))!;
    const shortAt = now + RELEARN_MS;
    const short = applyReviewGrade(failed.cards, failed.reviewActionIds, q, 'know', shortAt, context('two', shortAt))!;
    expect(short.cards[q.conceptId]).toMatchObject({ reps: 0, needsWork: true, due: shortAt + DAY_MS });
    const later = shortAt + DAY_MS;
    const resolved = applyReviewGrade(short.cards, short.reviewActionIds, q, 'know', later, context('three', later))!;
    expect(resolved.cards[q.conceptId]).toMatchObject({ reps: 1, needsWork: false, lapses: 1 });
  });
  test('a deliberate new failure counts once without creating another card', () => {
    const first = applyReviewGrade({}, {}, q, 'unknown', now, context('one', now))!;
    const second = applyReviewGrade(first.cards, first.reviewActionIds, q, 'unknown', now + 1, context('two', now + 1))!;
    expect(Object.keys(second.cards)).toHaveLength(1);
    expect(second.cards[q.conceptId].lapses).toBe(2);
  });
  test('exposed objective responses cannot earn recall credit', () => {
    const failed = applyReviewGrade({}, {}, q, 'unknown', now, context('one', now))!;
    const later = now + 2 * DAY_MS;
    const result = applyReviewGrade(failed.cards, failed.reviewActionIds, q, 'know', later, { ...context('two', later), firstResponse: false })!;
    expect(result.cards[q.conceptId].needsWork).toBe(true);
    expect(result.cards[q.conceptId].reps).toBe(0);
  });
  test('legacy metadata is preserved without invented successes', () => {
    const legacy: ReviewCard = { questionId: q.id, conceptId: q.conceptId, due: now, lastReviewed: now - 2 * DAY_MS, interval: 1, reps: 0, lapses: 7, ease: 1.7 };
    const next = applyReviewGrade({ [q.conceptId]: legacy }, {}, q, 'guess', now, context('one', now))!;
    expect(next.cards[q.conceptId].lapses).toBe(7);
    expect(next.cards[q.conceptId].needsWork).toBe(true);
    expect(legacy.lapses).toBe(7);
  });
});
