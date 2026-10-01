import { describe, expect, test } from '@jest/globals';
import type { ExamAttempt } from '../types';
import { addQuestionTime } from './examTime';

const attempt = (): ExamAttempt => ({
  id: 'timing-test', examId: 1, lang: 'en', seed: 1,
  questionIds: [1, 2], startedAt: 1000, finishedAt: null, limitMs: 10000, answers: [],
});

describe('question timing', () => {
  test('records the focused interval without changing answers or cursor', () => {
    const a = { ...attempt(), cursor: 1 };
    const out = addQuestionTime(a, 2, 2000, 3500);
    expect(out.spent).toEqual({ 2: 1500 });
    expect(out.answers).toBe(a.answers);
    expect(out.cursor).toBe(1);
    expect(a.spent).toBeUndefined();
  });
  test('accumulates revisits and preserves time on other questions', () => {
    const first = addQuestionTime(attempt(), 1, 1000, 2000);
    const second = addQuestionTime(first, 2, 2000, 4000);
    expect(addQuestionTime(second, 1, 6000, 6500).spent).toEqual({ 1: 1500, 2: 2000 });
  });
  test('preserves restored timing data', () => {
    expect(addQuestionTime({ ...attempt(), spent: { 1: 3000 } }, 1, 7000, 8000).spent).toEqual({ 1: 4000 });
  });
  test('does not charge time before the exam or after its deadline', () => {
    expect(addQuestionTime(attempt(), 1, 500, 1500).spent).toEqual({ 1: 500 });
    expect(addQuestionTime(attempt(), 1, 10000, 14000).spent).toEqual({ 1: 1000 });
  });
  test('stops at the recorded submission time', () => {
    expect(addQuestionTime({ ...attempt(), finishedAt: 4000 }, 1, 3000, 8000).spent).toEqual({ 1: 1000 });
  });
  test('ignores empty, reversed and unknown-question intervals', () => {
    const a = attempt();
    expect(addQuestionTime(a, 1, 3000, 3000)).toBe(a);
    expect(addQuestionTime(a, 1, 3000, 2000)).toBe(a);
    expect(addQuestionTime(a, 99, 1000, 2000)).toBe(a);
  });
});
