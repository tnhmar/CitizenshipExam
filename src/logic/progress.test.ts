import { describe, expect, test } from '@jest/globals';
import type { ExamAttempt } from '../types';
import { currentStreak, dayKey, readiness, recentExamAverage, touchStreak, type Streak } from './progress';

const d1 = new Date(2026, 9, 1, 9).getTime();
const d2 = new Date(2026, 9, 2, 23).getTime();
const d4 = new Date(2026, 9, 4, 8).getTime();
const zero: Streak = { count: 0, best: 0, lastDay: null };

describe('streak', () => {
  test('first activity starts a streak', () => {
    expect(touchStreak(zero, d1)).toEqual({ count: 1, best: 1, lastDay: '2026-10-01' });
  });

  test('same day does not change anything', () => {
    const s = touchStreak(zero, d1);
    expect(touchStreak(s, d1)).toBe(s);
  });

  test('consecutive days extend, a gap resets but keeps the best', () => {
    const s = touchStreak(zero, d1);
    const next = touchStreak(s, d2);
    expect(next.count).toBe(2);
    const reset = touchStreak(next, d4);
    expect(reset).toMatchObject({ count: 1, best: 2 });
  });

  test('currentStreak shows 0 once a day has been missed', () => {
    const s = touchStreak(touchStreak(zero, d1), d2);
    expect(currentStreak(s, d2)).toBe(2);
    expect(currentStreak(s, d4)).toBe(0);
    expect(currentStreak(zero, d1)).toBe(0);
  });

  test('dayKey is zero-padded local date', () => {
    expect(dayKey(new Date(2026, 0, 5, 12).getTime())).toBe('2026-01-05');
  });
});

describe('readiness', () => {
  test('weights are 40/30/30', () => {
    expect(readiness({ lessonsRead: 85, totalLessons: 85, quizAccuracy: 1, examAvg: 1 })).toBe(100);
    expect(readiness({ lessonsRead: 1, totalLessons: 2, quizAccuracy: 0, examAvg: 0 })).toBe(20);
    expect(readiness({ lessonsRead: 0, totalLessons: 0, quizAccuracy: 0, examAvg: 0 })).toBe(0);
  });
});

const attempt = (finishedAt: number | null, correct: number, total: number): ExamAttempt => ({
  id: `a${finishedAt}`,
  examId: 1,
  lang: 'en',
  seed: 1,
  questionIds: Array.from({ length: total }, (_, i) => i + 1),
  startedAt: 0,
  finishedAt,
  limitMs: 1,
  answers: Array.from({ length: correct }, (_, i) => ({
    questionId: i + 1,
    conceptId: 'c',
    chosen: 0,
    correct: true,
    timeMs: 1,
    flagged: false,
  })),
});

describe('recentExamAverage', () => {
  test('averages finished attempts only', () => {
    expect(recentExamAverage([attempt(1, 10, 20), attempt(2, 20, 20), attempt(null, 0, 20)], 3)).toBeCloseTo(0.75);
  });

  test('uses the latest n attempts', () => {
    expect(recentExamAverage([attempt(1, 10, 20), attempt(2, 20, 20)], 1)).toBeCloseTo(1);
    expect(recentExamAverage([], 3)).toBe(0);
  });
});
