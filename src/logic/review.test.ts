import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import type { SrsCard } from '../types';
import { DAY_MS } from './progress';
import { buildDeck, countDue, countMissed, nextDueAfter } from './review';
import { newCard } from './srs';

const now = 1000000000000;
const bundle = makeBundle();
const card = (id: number, over: Partial<SrsCard> = {}): SrsCard => ({
  ...newCard(id, bundle.questions[id].conceptId, now),
  ...over,
});

describe('decks', () => {
  test('due deck holds only cards that are due', () => {
    const cards = [card(1, { due: now - 1 }), card(2, { due: now + DAY_MS })];
    expect(buildDeck('due', bundle, cards, now, 20, 1)).toEqual([1]);
    expect(countDue(cards, now)).toBe(1);
  });

  test('missed deck is ordered by lapses', () => {
    const cards = [card(1, { lapses: 0 }), card(2, { lapses: 2 }), card(3, { lapses: 1 })];
    expect(buildDeck('missed', bundle, cards, now, 20, 1)).toEqual([2, 3]);
    expect(countMissed(cards)).toBe(2);
  });

  test('random deck uses lesson questions once per concept', () => {
    const ids = buildDeck('random', bundle, [], now, 20, 5);
    expect([...ids].sort((a, b) => a - b)).toEqual([1, 2, 3, 5, 6]);
    expect(buildDeck('random', bundle, [], now, 20, 5)).toEqual(ids);
    expect(buildDeck('random', bundle, [], now, 2, 5)).toHaveLength(2);
  });

  test('nextDueAfter finds the earliest future date', () => {
    const cards = [card(1, { due: now - 5 }), card(2, { due: now + 3 * DAY_MS }), card(3, { due: now + DAY_MS })];
    expect(nextDueAfter(cards, now)).toBe(now + DAY_MS);
    expect(nextDueAfter([card(1, { due: now - 5 })], now)).toBeNull();
  });
});
