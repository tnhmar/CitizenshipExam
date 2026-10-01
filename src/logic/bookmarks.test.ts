import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import { bookmarkQuestions, claimReviewStep, hasBookmark, toggleBookmark, type Bookmarks } from './bookmarks';

const bundle = makeBundle();
const q = { ...bundle.questions[1], conceptId: 'shared' };

describe('bookmarks', () => {
  test('toggles by concept without mutating the saved collection', () => {
    const initial: Bookmarks = {};
    const saved = toggleBookmark(initial, q, 10);
    expect(initial).toEqual({});
    expect(saved.shared).toEqual({ questionId: q.id, at: 10 });
    expect(toggleBookmark(saved, { ...q, id: 2 }, 20)).toEqual({});
    expect(saved.shared.at).toBe(10);
  });
  test('does not treat inherited object properties as bookmarks', () => {
    expect(hasBookmark({}, 'constructor')).toBe(false);
    expect(hasBookmark(toggleBookmark({}, { ...q, conceptId: 'constructor' }, 1), 'constructor')).toBe(true);
  });
  test('resolves a saved concept when its question ID changes', () => {
    const translated = { ...bundle, questions: { 2: { ...q, id: 2 } } };
    expect(bookmarkQuestions(translated, { shared: { questionId: 999, at: 10 } })[0].question.id).toBe(2);
    expect(bookmarkQuestions(translated, { missing: { questionId: 999, at: 10 } })).toEqual([]);
  });
  test('orders bookmarks by most recently saved first', () => {
    const content = { ...bundle, questions: { 1: q, 2: { ...q, id: 2, conceptId: 'other' } } };
    expect(bookmarkQuestions(content, { shared: { questionId: 1, at: 10 }, other: { questionId: 2, at: 20 } }).map((x) => x.conceptId)).toEqual(['other', 'shared']);
  });
});

describe('review grading guard', () => {
  test('allows only one grade per step, even after switching modes', () => {
    const seen = new Set<string>();
    expect(claimReviewStep(seen, '0:0')).toBe(true);
    expect(claimReviewStep(seen, '0:0')).toBe(false);
    expect(claimReviewStep(seen, '0:1')).toBe(true);
  });
  test('allows a deliberate retry round', () => {
    const seen = new Set(['0:0']);
    expect(claimReviewStep(seen, '1:0')).toBe(true);
  });
});
