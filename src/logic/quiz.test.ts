import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import { chapterQuizIds, isCorrect, lessonQuizIds, present } from './quiz';

const bundle = makeBundle();

describe('present', () => {
  test('keeps the same options and tracks the correct one', () => {
    const p = present(bundle.questions[1], 42);
    expect([...p.options].sort()).toEqual(['A', 'B', 'C', 'D']);
    expect(p.options[p.correctIndex]).toBe('A');
  });

  test('is deterministic for a given seed', () => {
    expect(present(bundle.questions[1], 7)).toEqual(present(bundle.questions[1], 7));
  });

  test('works for true/false questions', () => {
    const tf = { ...bundle.questions[1], type: 'tf' as const, options: ['True', 'False'] };
    const p = present(tf, 3);
    expect(p.options[p.correctIndex]).toBe('True');
  });
});

describe('isCorrect', () => {
  test('only the correct index and never null', () => {
    const p = present(bundle.questions[1], 1);
    expect(isCorrect(p, p.correctIndex)).toBe(true);
    expect(isCorrect(p, (p.correctIndex + 1) % 4)).toBe(false);
    expect(isCorrect(p, null)).toBe(false);
  });
});

describe('quiz builders', () => {
  test('lesson quiz needs the minimum number of questions', () => {
    expect(lessonQuizIds(bundle.lessons[0], 3)).toEqual([1, 2, 3]);
    expect(lessonQuizIds(bundle.lessons[1], 3)).toEqual([]);
  });

  test('chapter quiz merges lessons and drops repeated concepts', () => {
    expect(chapterQuizIds(bundle, bundle.chapters[0])).toEqual([1, 2, 3, 5]);
    expect(chapterQuizIds(bundle, bundle.chapters[1])).toEqual([6]);
  });
});
