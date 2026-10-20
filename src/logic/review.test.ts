import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import type { SrsCard } from '../types';
import { DAY_MS } from './progress';
import { reviewWorkload } from './learningStats';
import { buildDeck, countDue, countMissed, countUnresolved, eligibleReviewCards, nextDueAfter } from './review';
import type { ReviewCard } from './reviewGrading';
import { newCard } from './srs';

const now = 1000000000000;
const bundle = makeBundle();
const card = (id: number, over: Partial<SrsCard> = {}): SrsCard => ({ ...newCard(id, bundle.questions[id].conceptId, now), ...over });
describe('review decks and unique counts', () => {
  test('due deck and badges share Home workload eligibility', () => {
    const cards = [card(1, { due: now - 1 }), card(2, { due: now + DAY_MS }), { ...card(1), conceptId: 'removed', due: 0 }];
    expect(buildDeck('due', bundle, cards, now, 20, 1)).toEqual([1]);
    expect(countDue(cards, now, bundle)).toBe(reviewWorkload(bundle, cards, now).due);
    expect(countDue(cards, now, bundle)).toBe(1);
  });
  test('history counts concepts, not the sum of failures', () => {
    const cards = [card(1, { lapses: 4 }), card(2, { lapses: 2 })];
    expect(countMissed(cards, bundle)).toBe(2);
    cards[0].lapses += 1;
    expect(countMissed(cards, bundle)).toBe(2);
    const resolved: ReviewCard[] = [{ ...cards[0], needsWork: false }, cards[1]];
    expect(countUnresolved(bundle, resolved)).toBe(1);
  });
  test('eligible cards deduplicate concepts and resolve stale question IDs', () => {
    const cards = [card(1), { ...card(1), questionId: 999 }];
    expect(eligibleReviewCards(bundle, cards).map((c) => c.questionId)).toEqual([1]);
    expect(buildDeck('due', bundle, cards, now, 20, 1)).toEqual([1]);
  });
  test('random pool uses one question per native concept', () => {
    const ids = buildDeck('random', bundle, [], now, 20, 5);
    expect([...ids].sort((a, b) => a - b)).toEqual([1, 2, 3, 5, 6]);
    expect(buildDeck('random', bundle, [], now, 20, 5)).toEqual(ids);
    expect(buildDeck('random', bundle, [], now, 2, 5)).toHaveLength(2);
  });
  test('missed deck rotates away from recently practiced high-failure cards', () => {
    const cards = [
      { ...card(1, { lapses: 100 }), lastPracticedAt: now },
      { ...card(2, { lapses: 1 }), lastPracticedAt: now - DAY_MS },
      { ...card(3, { lapses: 1 }), lastPracticedAt: now - 2 * DAY_MS },
    ];
    expect(buildDeck('missed', bundle, cards, now, 2, 1)).toEqual([3, 2]);
  });
  test('resolved cards remain in history, not the unresolved deck', () => {
    const cards = [{ ...card(1, { lapses: 2 }), needsWork: false }];
    expect(buildDeck('history', bundle, cards, now, 20, 1)).toEqual([1]);
    expect(buildDeck('missed', bundle, cards, now, 20, 1)).toEqual([]);
  });
  test('next due ignores removed concepts and finds the earliest future date', () => {
    const cards = [card(1, { due: now - 5 }), card(2, { due: now + 3 * DAY_MS }), card(3, { due: now + DAY_MS })];
    expect(nextDueAfter(cards, now, bundle)).toBe(now + DAY_MS);
    expect(nextDueAfter([card(1, { due: now - 5 })], now, bundle)).toBeNull();
  });
});
