import { describe, expect, test } from '@jest/globals';
import { isFocusedExamPath } from './examLayout';

describe('focused exam routes', () => {
  test('hides tabs only during an attempt or pre-submit review', () => {
    expect(isFocusedExamPath('/exams/42')).toBe(true);
    expect(isFocusedExamPath('/exams/summary')).toBe(true);
    expect(isFocusedExamPath('/exams/42/')).toBe(true);
  });
  test('restores tabs for the list, results and post-submit review', () => {
    for (const path of ['/', '/exams', '/exams/result/42-123', '/exams/missed/42-123', '/exams/flagged/42-123', '/review/bookmarks']) expect(isFocusedExamPath(path)).toBe(false);
  });
});
