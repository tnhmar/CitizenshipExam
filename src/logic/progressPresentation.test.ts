import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import type { ContentBundle, ExamAttempt } from '../types';
import { initialLearning, type LearningProgress } from './completion';
import { progressChapter, progressEvidence, progressHistory, progressQuizScore, progressScoreColour } from './progressPresentation';
const bundle = makeBundle(); const now = new Date(2026, 9, 2, 12).getTime();
const p = (): LearningProgress => initialLearning();
const attempt = (id: string, right: number, total: number, at: number): ExamAttempt => ({ id, examId: 100, lang: 'en', seed: 1, questionIds: Array.from({ length: total }, (_, i) => i + 1), startedAt: at - 1000, finishedAt: at, limitMs: 60000, answers: Array.from({ length: total }, (_, i) => ({ questionId: i + 1, conceptId: `c${i + 1}`, chosen: 0, correct: i < right, timeMs: 1, flagged: false })) });
describe('Progress presentation', () => {
  test('empty chapter and lesson statuses remain not started', () => {
    const row = progressChapter(bundle, p(), 1);
    expect(row).toMatchObject({ status: 'notStarted', completed: 0, total: 2, quizPassed: false });
    expect(row?.lessons.map((l) => l.status)).toEqual(['notStarted', 'notStarted']);
  });
  test('opening a lesson shows in progress without completion', () => {
    const row = progressChapter(bundle, { ...p(), lessonsStarted: { 10: 1 } }, 1);
    expect(row?.status).toBe('inProgress');
    expect(row?.lessons[0].status).toBe('inProgress');
    expect(row?.completed).toBe(0);
  });
  test('all completed lessons alone do not complete the chapter', () => {
    expect(progressChapter(bundle, { ...p(), lessonsRead: { 10: 1, 11: 1 } }, 1)?.status).toBe('inProgress');
  });
  test('chapter requires its passing quiz and every lesson', () => {
    const quizPassed = { 'chapter:1': { correct: 4, total: 4, at: 1 } };
    expect(progressChapter(bundle, { ...p(), quizPassed }, 1)?.status).toBe('inProgress');
    expect(progressChapter(bundle, { ...p(), quizPassed, lessonsRead: { 10: 1, 11: 1 } }, 1)?.status).toBe('completed');
  });
  test('later failed practice remains separate from earned completion', () => {
    const row = progressChapter(bundle, { ...p(), lessonsRead: { 10: 1, 11: 1 }, quizPassed: { 'chapter:1': { correct: 4, total: 4, at: 1 } }, quizResults: { 'chapter:1': { correct: 1, total: 4, at: 2 } } }, 1);
    expect(row?.status).toBe('completed'); expect(row?.quizPassed).toBe(true); expect(row?.latest?.passed).toBe(false);
  });
  test('studied exceptions are explicitly identified', () => {
    const content: ContentBundle = { ...bundle, lessons: bundle.lessons.map((l) => l.id === 10 ? { ...l, questionIds: [] } : l) };
    expect(progressChapter(content, { ...p(), lessonsRead: { 10: 1 }, lessonsStudied: { 10: 1 } }, 1)?.lessons[0].studiedWithoutQuiz).toBe(true);
  });
  test('a missing chapter safely returns no presentation row', () => { expect(progressChapter(bundle, p(), 999)).toBeNull(); });
  test('missing lesson content is not silently dropped or linked as available', () => {
    const content: ContentBundle = { ...bundle, lessons: bundle.lessons.filter((l) => l.id !== 11) };
    const row = progressChapter(content, p(), 1);
    expect(row?.total).toBe(2); expect(row?.lessons[1].available).toBe(false); expect(row?.quizAvailable).toBe(false);
  });
  test('chapter without quiz coverage stays pending', () => {
    const content: ContentBundle = { ...bundle, lessons: bundle.lessons.map((l) => ({ ...l, questionIds: [] })) };
    const row = progressChapter(content, { ...p(), lessonsRead: { 10: 1, 11: 1 }, lessonsStudied: { 10: 1, 11: 1 } }, 1);
    expect(row?.status).toBe('inProgress'); expect(row?.quizAvailable).toBe(false);
  });
  test('quiz results use exact 90% validation rather than display rounding', () => {
    expect(progressQuizScore({ correct: 9, total: 10, at: 1 })?.passed).toBe(true);
    expect(progressQuizScore({ correct: 17, total: 19, at: 1 })?.passed).toBe(false);
  });
  test('empty and malformed quiz results are not displayed as successful scores', () => {
    expect(progressQuizScore(undefined)).toBeNull(); expect(progressQuizScore({ correct: 0, total: 0, at: 1 })).toBeNull(); expect(progressQuizScore({ correct: 11, total: 10, at: 1 })).toBeNull();
  });
  test('history preserves per-attempt denominator and exam pass mark', () => {
    const rows = progressHistory(bundle, [attempt('short', 8, 10, now), attempt('long', 14, 20, now - 1)], now);
    expect(rows[0]).toMatchObject({ correct: 8, total: 10, required: 8, passed: true });
    expect(rows[1]).toMatchObject({ correct: 14, total: 20, required: 15, passed: false });
  });
  test('history excludes unfinished and future results and keeps eight newest', () => {
    const rows = Array.from({ length: 10 }, (_, i) => attempt(String(i), 8, 10, now - i));
    rows.push({ ...attempt('active', 8, 10, now), finishedAt: null }); rows.push(attempt('future', 8, 10, now + 1));
    const history = progressHistory(bundle, rows, now);
    expect(history).toHaveLength(8); expect(history[0].attempt.id).toBe('0'); expect(history[7].attempt.id).toBe('7');
  });
  test('pass and fail colours remain distinct in both themes', () => {
    expect(progressScoreColour(true, false)).toBe('#2E7D32'); expect(progressScoreColour(false, false)).toBe('#C62828');
    expect(progressScoreColour(true, true)).toBe('#8DCB91'); expect(progressScoreColour(false, true)).toBe('#FFB4AB');
  });
  test('absent evidence is different from an assessed zero score', () => {
    expect(progressEvidence({ correct: 0, total: 0, accuracy: null, distinctConcepts: 0 })).toBeNull();
    expect(progressEvidence({ correct: 0, total: 3, accuracy: 0, distinctConcepts: 3 })).toBe('0/3 · 0%');
  });
  test('invalid accuracy is not displayed as an assessment result', () => {
    for (const accuracy of [NaN, Infinity, -0.1, 1.1]) expect(progressEvidence({ correct: 1, total: 2, accuracy, distinctConcepts: 2 })).toBeNull();
  });
});
