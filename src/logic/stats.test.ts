import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import type { Answer, ExamAttempt } from '../types';
import { newCard } from './srs';
import { examChapterStats, formatClock, formatDuration, mostMissed, overallAccuracy } from './stats';

const bundle = makeBundle();
const ans = (id: number, correct: boolean): Answer => ({
  questionId: id,
  conceptId: `c${id}`,
  chosen: correct ? 0 : 1,
  correct,
  timeMs: 1,
  flagged: false,
});
const attempt = (answers: Answer[], finishedAt: number | null = 1): ExamAttempt => ({
  id: 'a',
  examId: 100,
  lang: 'en',
  seed: 1,
  questionIds: answers.map((a) => a.questionId),
  startedAt: 0,
  finishedAt,
  limitMs: 1,
  answers,
});

describe('stats', () => {
  test('exam accuracy per chapter ignores unfinished attempts', () => {
    const out = examChapterStats(bundle, [attempt([ans(1, true), ans(6, false)]), attempt([ans(2, true)], null)]);
    expect(out).toEqual({ 1: { correct: 1, total: 1 }, 2: { correct: 0, total: 1 } });
  });

  test('most missed questions are per chapter and sorted by lapses', () => {
    const cards = [
      { ...newCard(1, 'c1', 0), lapses: 2 },
      { ...newCard(2, 'c2', 0), lapses: 5 },
      { ...newCard(6, 'c6', 0), lapses: 9 },
    ];
    expect(mostMissed(bundle, cards, 1, 1).map((q) => q.id)).toEqual([2]);
    expect(mostMissed(bundle, cards, 1, 5).map((q) => q.id)).toEqual([2, 1]);
  });

  test('overall accuracy pools quizzes and finished exams', () => {
    const quiz = { 'lesson:1': { correct: 3, total: 4 } };
    expect(overallAccuracy(quiz, [attempt([ans(1, true), ans(2, false)])])).toBeCloseTo(4 / 6);
    expect(overallAccuracy({}, [])).toBe(0);
  });

  test('time formatting', () => {
    expect(formatDuration(90 * 60000)).toBe('1 h 30 min');
    expect(formatDuration(5 * 60000)).toBe('5 min');
    expect(formatClock(65000)).toBe('1:05');
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(1500)).toBe('0:02');
  });
});
