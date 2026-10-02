import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import type { ContentBundle, ExamAttempt } from '../types';
import { initialLearning } from './completion';
import { initialAssessmentHistory, type AssessmentEvent } from './learningStats';
import { snapshot, type DashboardProgress } from './dashboardStats';
const b = makeBundle(); const now = new Date(2026, 9, 2, 12).getTime();
const p = (): DashboardProgress => ({ ...initialLearning(), ...initialAssessmentHistory(), attempts: [], cards: {}, active: null });
const attempt = (id: string, correct: number, total: number, at: number): ExamAttempt => ({ id, examId: 100, lang: 'en', seed: 1, questionIds: Array.from({ length: total }, (_, i) => i + 1), startedAt: at - 1000, finishedAt: at, limitMs: 60000, answers: Array.from({ length: total }, (_, i) => ({ questionId: i + 1, conceptId: `c${i + 1}`, chosen: 0, correct: i < correct, timeMs: 1, flagged: false })) });
describe('dashboard snapshot', () => {
  test('empty evidence is explicit and next action starts learning', () => {
    const s = snapshot(b, p(), now);
    expect(s.completion).toMatchObject({ lessonsCompleted: 0, chaptersCompleted: 0, lessonsInProgress: 0 });
    expect(s.evidence.coverage.coverage).toBe(0);
    expect(s.evidence.practice.accuracy).toBeNull();
    expect(s.evidence.delayedRecall.accuracy).toBeNull();
    expect(s.exams.recentMockAverage).toBeNull();
    expect(s.nextAction).toEqual({ kind: 'startLearning', lessonId: 10 });
  });
  test('due review is prioritized over study actions', () => {
    const cards = { c1: { questionId: 1, conceptId: 'c1', interval: 1, ease: 2.5, reps: 0, lapses: 0, due: now - 1, lastReviewed: now - 2 } };
    expect(snapshot(b, { ...p(), cards }, now).nextAction).toEqual({ kind: 'reviewDue' });
  });
  test('chapter weakness needs five actual native concepts', () => {
    const bundle: ContentBundle = { ...b, questions: { ...b.questions, 9: { ...b.questions[1], id: 9, conceptId: 'c9' } }, lessons: b.lessons.map((l) => l.id === 10 ? { ...l, questionIds: [...l.questionIds, 9] } : l) };
    const assessmentEvents: AssessmentEvent[] = [1, 2, 3, 5, 9].map((id) => ({ id: `e${id}`, sessionId: `s${id}`, questionId: id, conceptId: bundle.questions[id].conceptId, at: now, mode: 'lesson', response: 'objective', correct: false, firstResponse: true, retry: 'none', confidence: null }));
    expect(snapshot(bundle, { ...p(), assessmentEvents }, now).nextAction).toEqual({ kind: 'studyTopic', chapterId: 1 });
  });
  test('limited evidence is not falsely presented as an established weak topic', () => {
    const assessmentEvents: AssessmentEvent[] = [{ id: 'e', sessionId: 's', questionId: 1, conceptId: 'c1', at: now, mode: 'lesson', response: 'objective', correct: false, firstResponse: true, retry: 'none', confidence: null }];
    const s = snapshot(b, { ...p(), assessmentEvents }, now);
    expect(s.evidence.topics[0].status).toBe('limitedEvidence');
    expect(s.nextAction.kind).toBe('startLearning');
  });
  test('lesson continuation does not assume contiguous lesson order numbers', () => {
    const bundle = { ...b, lessons: b.lessons.map((l) => ({ ...l, order: l.order + 100 })) };
    expect(snapshot(bundle, { ...p(), lessonsStarted: { 10: 1 } }, now).nextAction).toEqual({ kind: 'continueLesson', lessonId: 10 });
  });
  test('completed lessons do not skip a pending chapter quiz', () => {
    const lessonsRead = Object.fromEntries(b.lessons.map((l) => [l.id, 1]));
    const s = snapshot(b, { ...p(), lessonsRead }, now);
    expect(s.completion.chaptersCompleted).toBe(0);
    expect(s.nextAction).toEqual({ kind: 'finishChapter', chapterId: 1 });
  });
  test('a completed course can proceed to mock practice without losing completion', () => {
    const lessonsRead = Object.fromEntries(b.lessons.map((l) => [l.id, 1]));
    const quizPassed = Object.fromEntries(b.chapters.map((c) => [`chapter:${c.id}`, { correct: 1, total: 1, at: 1 }]));
    const s = snapshot(b, { ...p(), lessonsRead, quizPassed }, now);
    expect(s.completion.chaptersCompleted).toBe(b.chapters.length);
    expect(s.nextAction).toEqual({ kind: 'takeMock' });
  });
  test('studied exceptions remain separate from assessment-validated lessons', () => {
    const bundle = { ...b, lessons: b.lessons.map((l) => l.id === 10 ? { ...l, questionIds: [] } : l) };
    const s = snapshot(bundle, { ...p(), lessonsRead: { 10: 1 }, lessonsStudied: { 10: 1 } }, now);
    expect(s.completion).toMatchObject({ lessonsCompleted: 1, lessonsStudiedWithoutQuiz: 1, lessonsValidated: 0 });
  });
  test('an active exam is resumed ahead of due reviews', () => {
    const active = { ...attempt('active', 0, 20, now), finishedAt: null };
    const cards = { c1: { questionId: 1, conceptId: 'c1', interval: 1, ease: 2.5, reps: 0, lapses: 0, due: now - 1, lastReviewed: now - 2 } };
    expect(snapshot(b, { ...p(), active, cards }, now).nextAction).toEqual({ kind: 'resumeExam', examId: 100 });
  });
  test('exam averages and improvement use the actual scoring helpers', () => {
    const attempts = [9, 9, 9, 6, 6, 6].map((score, i) => attempt(String(i), score, 10, now - i));
    const s = snapshot(b, { ...p(), attempts }, now);
    expect(s.exams.recentMocks).toHaveLength(5);
    expect(s.exams.recentMockAverage).toBeCloseTo(0.78);
    expect(s.exams.improvement).toBeCloseTo(30);
  });
  test('best exam preserves its own score and denominator', () => {
    const s = snapshot(b, { ...p(), attempts: [attempt('short', 8, 10, now), attempt('long', 15, 20, now - 1)] }, now);
    expect(s.exams.best).toMatchObject({ correct: 8, total: 10, passed: true });
  });
  test('recording metadata preserves zero timestamps and ignores obsolete lesson IDs', () => {
    const s = snapshot(b, { ...p(), assessmentHistoryStartedAt: 0, assessmentHistoryTruncatedBefore: 0, lessonsRead: { 999: 1 } }, now);
    expect(s.evidence.historyStartedAt).toBe(0);
    expect(s.evidence.truncatedBefore).toBe(0);
    expect(s.completion.lessonsCompleted).toBe(0);
  });
});
