import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import type { ExamAttempt } from '../types';
import { initialLearning } from './completion';
import { selectNextStep } from './nextSteps';
const base = makeBundle();
const first = { ...base.chapters[0], id: 1, order: 1, lessonIds: [10] };
const second = { ...base.chapters[0], id: 2, order: 2, lessonIds: [20] };
const bundle = { ...base, chapters: [second, first], lessons: [{ ...base.lessons[0], id: 20, chapterId: 2 }, { ...base.lessons[0], id: 10, chapterId: 1 }] };
const now = 100000;
const active: ExamAttempt = { id: 'active', examId: base.exams[0].id, lang: base.lang, seed: 1, questionIds: [], startedAt: now - 1000, finishedAt: null, limitMs: 60000, answers: [] };
describe('primary and secondary recommendation', () => {
  test('a pending chapter quiz precedes the next chapter lesson', () => {
    const result = selectNextStep(bundle, { ...initialLearning(), lessonsRead: { 10: 1 } }, now, 0);
    expect(result.primary).toEqual({ kind: 'finishChapter', chapterId: 1 });
    expect(result.alternative).toEqual({ action: { kind: 'studyTopic', chapterId: 1 }, label: 'reviewChapter' });
  });
  test('a passed chapter allows starting the first lesson of the next chapter', () => {
    const progress = { ...initialLearning(), lessonsRead: { 10: 1 }, quizPassed: { 'chapter:1': { correct: 1, total: 1, at: 1 } } };
    expect(selectNextStep(bundle, progress, now, 0).primary).toEqual({ kind: 'startLearning', lessonId: 20 });
  });
  test('course order follows chapter order, not the array order', () => {
    expect(selectNextStep(bundle, initialLearning(), now, 0).primary).toEqual({ kind: 'startLearning', lessonId: 10 });
  });
  test('a live exam is primary and the pending chapter remains secondary', () => {
    const progress = { ...initialLearning(), lessonsRead: { 10: 1 }, active };
    const result = selectNextStep(bundle, progress, now, 3);
    expect(result.primary).toEqual({ kind: 'resumeExam', examId: active.examId });
    expect(result.alternative?.action).toEqual({ kind: 'finishChapter', chapterId: 1 });
  });
  test('expired, finished and removed exams are not recommended as live', () => {
    const progress = { ...initialLearning(), lessonsRead: { 10: 1 } };
    for (const attempt of [{ ...active, limitMs: 1 }, { ...active, finishedAt: now }, { ...active, examId: -1 }]) {
      expect(selectNextStep(bundle, { ...progress, active: attempt }, now, 0).primary.kind).toBe('finishChapter');
    }
  });
  test('due review is primary, with course validation as the alternative', () => {
    const result = selectNextStep(bundle, { ...initialLearning(), lessonsRead: { 10: 1 } }, now, 2);
    expect(result.primary.kind).toBe('reviewDue'); expect(result.alternative?.action.kind).toBe('finishChapter');
  });
  test('pending validation outranks a weak topic', () => {
    expect(selectNextStep(bundle, { ...initialLearning(), lessonsRead: { 10: 1 } }, now, 0, 2).primary.kind).toBe('finishChapter');
  });
  test('a finished course recommends mock practice without a fabricated alternative', () => {
    const progress = { ...initialLearning(), lessonsRead: { 10: 1, 20: 1 }, quizPassed: { 'chapter:1': { correct: 1, total: 1, at: 1 }, 'chapter:2': { correct: 1, total: 1, at: 1 } } };
    expect(selectNextStep(bundle, progress, now, 0)).toEqual({ primary: { kind: 'takeMock' }, alternative: null });
  });
});
