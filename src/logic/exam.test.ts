import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import type { Answer } from '../types';
import { averageTimeMs, byChapter, completeAnswers, remainingMs, requiredToPass, summarize } from './exam';

const ans = (id: number, correct: boolean, chosen: number | null = correct ? 0 : 1): Answer => ({
  questionId: id,
  conceptId: `c${id}`,
  chosen,
  correct,
  timeMs: 1000,
  flagged: false,
});

const many = (right: number, wrong: number): Answer[] => [
  ...Array.from({ length: right }, (_, i) => ans(i + 1, true)),
  ...Array.from({ length: wrong }, (_, i) => ans(100 + i, false)),
];

describe('scoring', () => {
  test('15 of 20 passes, 14 fails', () => {
    const pass = summarize(many(15, 5), 20, 15, 20);
    expect(pass).toMatchObject({ score: 15, wrong: 5, unanswered: 0, percent: 75, required: 15, passed: true });
    expect(summarize(many(14, 6), 20, 15, 20).passed).toBe(false);
  });

  test('counts unanswered questions', () => {
    const s = summarize(many(2, 1), 5, 15, 20);
    expect(s.unanswered).toBe(2);
    expect(s.required).toBe(4);
  });

  test('scales the pass mark for shorter exams', () => {
    expect(requiredToPass(20, 15, 20)).toBe(15);
    expect(requiredToPass(10, 15, 20)).toBe(8);
  });
});

describe('timer', () => {
  test('remaining time never goes below zero', () => {
    expect(remainingMs(1000, 60000, 31000)).toBe(30000);
    expect(remainingMs(1000, 60000, 999999)).toBe(0);
  });
});

describe('helpers', () => {
  const bundle = makeBundle();

  test('completeAnswers fills unanswered questions', () => {
    const out = completeAnswers(bundle, [1, 2, 3], [ans(2, true)]);
    expect(out).toHaveLength(3);
    expect(out[0].chosen).toBeNull();
    expect(out[1].correct).toBe(true);
  });

  test('byChapter groups answers, unknown chapter goes to 0', () => {
    const out = byChapter(bundle, [ans(1, true), ans(2, false), ans(6, true), ans(8, false)]);
    expect(out[1]).toEqual({ correct: 1, total: 2 });
    expect(out[2]).toEqual({ correct: 1, total: 1 });
    expect(out[0]).toEqual({ correct: 0, total: 1 });
  });

  test('averageTimeMs ignores unanswered questions', () => {
    expect(averageTimeMs([ans(1, true), ans(2, false), ans(3, false, null)])).toBe(1000);
    expect(averageTimeMs([])).toBe(0);
  });
});
