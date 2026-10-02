import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import type { Answer, ExamAttempt } from '../types';
import { captureExamSelections, captureQuestionResponse, historyData, migrateCapturedProgress, type AssessmentContext } from './assessmentCapture';
import { initialAssessmentHistory, objectiveFirstResponses } from './learningStats';
const bundle = makeBundle();
const q = bundle.questions[1];
const at = 10000;
const attempt = (): ExamAttempt => ({ id: 'attempt', examId: 100, lang: 'en', seed: 1, questionIds: [1, 2], startedAt: 1, finishedAt: null, limitMs: 60000, answers: [] });
const answer = (correct = true, chosen = 0): Answer => ({ questionId: 1, conceptId: q.conceptId, chosen, correct, timeMs: 0, flagged: false });
const context = (over: Partial<AssessmentContext> = {}): AssessmentContext => ({ sessionId: 'lesson:1:run:1', stepId: '0', at, mode: 'lesson', response: 'objective', firstResponse: true, retry: 'none', confidence: null, ...over });
describe('assessment capture', () => {
  test('captures before-feedback correctness with stable idempotent step IDs', () => {
    const h = captureQuestionResponse(initialAssessmentHistory(), bundle, q, false, context());
    expect(h.assessmentEvents[0]).toMatchObject({ correct: false, mode: 'lesson', firstResponse: true });
    expect(captureQuestionResponse(h, bundle, q, true, context()).assessmentEvents).toEqual(h.assessmentEvents);
  });
  test('rejects missing questions and mismatched concepts', () => {
    expect(captureQuestionResponse(initialAssessmentHistory(), bundle, { ...q, id: 999 }, true, context()).assessmentEvents).toEqual([]);
    expect(captureQuestionResponse(initialAssessmentHistory(), bundle, { ...q, conceptId: 'wrong' }, true, context()).assessmentEvents).toEqual([]);
  });
  test('self-report and missed-only retry context cannot become objective evidence', () => {
    let h = captureQuestionResponse(initialAssessmentHistory(), bundle, q, true, context({ response: 'selfReport', mode: 'review' }));
    h = captureQuestionResponse(h, bundle, q, true, context({ sessionId: 'missed', retry: 'missed' }));
    expect(h.assessmentEvents).toHaveLength(2);
    expect(objectiveFirstResponses(h.assessmentEvents, at)).toEqual([]);
  });
  test('explicit full restart creates a separate session', () => {
    let h = captureQuestionResponse(initialAssessmentHistory(), bundle, q, false, context());
    h = captureQuestionResponse(h, bundle, q, true, context({ sessionId: 'lesson:1:run:2', retry: 'full' }));
    expect(objectiveFirstResponses(h.assessmentEvents, at)).toHaveLength(2);
  });
  test('exam creation, hydration and final submission never invent first selections', () => {
    const a = { ...attempt(), answers: [answer()] };
    expect(captureExamSelections(null, a, bundle, initialAssessmentHistory(), at).assessmentEvents).toEqual([]);
    expect(captureExamSelections(a, { ...a, finishedAt: at }, bundle, initialAssessmentHistory(), at).assessmentEvents).toEqual([]);
  });
  test('the first new selection is recorded as mock evidence', () => {
    const before = attempt(); const after = { ...before, answers: [answer(false, 1)] };
    const h = captureExamSelections(before, after, bundle, initialAssessmentHistory(), at);
    expect(h.assessmentEvents[0]).toMatchObject({ mode: 'mock', correct: false, firstResponse: true, response: 'objective' });
  });
  test('a later changed selection cannot replace the first answer', () => {
    const before = attempt(); const selected = { ...before, answers: [answer(false, 1)] };
    let h = captureExamSelections(before, selected, bundle, initialAssessmentHistory(), at);
    const changed = { ...selected, answers: [answer(true, 0)] };
    h = captureExamSelections(selected, changed, bundle, h, at + 1);
    expect(h.assessmentEvents).toHaveLength(2);
    expect(h.assessmentEvents[1].firstResponse).toBe(false);
    expect(objectiveFirstResponses(h.assessmentEvents, at + 1)[0].correct).toBe(false);
  });
  test('updating timers or flags without changing answers adds no evidence', () => {
    const a = { ...attempt(), answers: [answer()] };
    const changed = { ...a, answers: [{ ...a.answers[0], timeMs: 500, flagged: true }] };
    expect(captureExamSelections(a, changed, bundle, initialAssessmentHistory(), at).assessmentEvents).toEqual([]);
  });
  test('a changed answer from a legacy resumed exam is not labelled first', () => {
    const a = { ...attempt(), answers: [answer(false, 1)] };
    const h = captureExamSelections(a, { ...a, answers: [answer()] }, bundle, initialAssessmentHistory(), at);
    expect(h.assessmentEvents[0].firstResponse).toBe(false);
  });
  test('different attempt IDs and unsupported questions are ignored', () => {
    const a = attempt();
    expect(captureExamSelections(a, { ...a, id: 'other', answers: [answer()] }, bundle, initialAssessmentHistory(), at).assessmentEvents).toEqual([]);
    expect(captureExamSelections(a, { ...a, answers: [{ ...answer(), questionId: 999 }] }, bundle, initialAssessmentHistory(), at).assessmentEvents).toEqual([]);
  });
  test('history projection cannot overwrite active state', () => {
    const h = { ...initialAssessmentHistory(), active: attempt(), lessonsRead: { 10: 5 } };
    expect(Object.keys(historyData(h)).sort()).toEqual(['assessmentEvents', 'assessmentHistoryStartedAt', 'assessmentHistoryTruncatedBefore']);
  });
  test('migration preserves unrelated data and does not invent historical events', () => {
    const initial = { lessonsRead: {}, attempts: [], bookmarks: {}, studyMs: 0 };
    const a = { ...attempt(), finishedAt: at, answers: [answer()] };
    const legacy = { lessonsRead: { 10: 2 }, attempts: [a], bookmarks: { c1: { questionId: 1, at: 2 } }, studyMs: 123 };
    const p = migrateCapturedProgress({ ...initial, attempts: [a] }, legacy);
    expect(p.lessonsRead).toEqual(legacy.lessonsRead);
    expect(p.attempts).toEqual(legacy.attempts);
    expect(p.bookmarks).toEqual(legacy.bookmarks);
    expect(p.studyMs).toBe(123);
    expect(p.assessmentEvents).toEqual([]);
    expect(p.assessmentHistoryStartedAt).toBeNull();
  });
});
