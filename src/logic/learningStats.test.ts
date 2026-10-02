import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import type { Answer, ExamAttempt } from '../types';
import { dayKey } from './progress';
import { appendAssessmentEvent, assessmentCoverage, bestExamEvidence, delayedRecallEvidence, examEvidence, examImprovement, initialAssessmentHistory, migrateAssessmentHistory, objectiveFirstResponses, recentMockEvidence, recentPracticeEvidence, reviewWorkload, topicEvidence, type AssessmentEvent } from './learningStats';
const b = makeBundle();
const now = new Date(2026, 9, 2, 12).getTime();
const day = 86400000;
const event = (conceptId: string, at: number, over: Partial<AssessmentEvent> = {}): AssessmentEvent => ({ id: `${conceptId}:${at}`, sessionId: `s:${at}`, questionId: 1, conceptId, at, mode: 'lesson', response: 'objective', correct: true, firstResponse: true, retry: 'none', confidence: null, ...over });
const attempt = (id: string, right: number, total: number, at: number, examId = 100): ExamAttempt => ({ id, examId, lang: 'en', seed: 1, questionIds: Array.from({ length: total }, (_, i) => i + 1), startedAt: at - 1000, finishedAt: at, limitMs: 60000, answers: Array.from({ length: total }, (_, i): Answer => ({ questionId: i + 1, conceptId: `c${i+1}`, chosen: 0, correct: i < right, timeMs: 10, flagged: false })) });
describe('honest learning evidence', () => {
  test('history starts empty without fabricated migration evidence', () => {
    expect(migrateAssessmentHistory()).toEqual(initialAssessmentHistory());
    expect(assessmentCoverage(b, [], now).coverage).toBe(0);
    expect(recentPracticeEvidence(b, [], now).accuracy).toBeNull();
    expect(delayedRecallEvidence(b, [], now).accuracy).toBeNull();
  });
  test('event writes are immutable, valid and idempotent', () => {
    const h = initialAssessmentHistory(); const e = event('c1', now);
    const next = appendAssessmentEvent(h, e);
    expect(h.assessmentEvents).toHaveLength(0);
    expect(next.assessmentHistoryStartedAt).toBe(now);
    expect(appendAssessmentEvent(next, e)).toBe(next);
    expect(appendAssessmentEvent(h, { ...e, at: NaN })).toBe(h);
    expect(appendAssessmentEvent(h, { ...e, questionId: -1 })).toBe(h);
  });
  test('history bounds preserve newest events and expose the truncation', () => {
    const rows = Array.from({ length: 5000 }, (_, i) => event('c1', i));
    const p = appendAssessmentEvent({ assessmentEvents: rows, assessmentHistoryStartedAt: 0, assessmentHistoryTruncatedBefore: null }, event('c2', 5000));
    expect(p.assessmentEvents).toHaveLength(5000);
    expect(p.assessmentEvents[0].at).toBe(1);
    expect(p.assessmentHistoryTruncatedBefore).toBe(0);
  });
  test('first responses exclude future events, missed retries and self reports', () => {
    const rows = [event('c1', now), event('c2', now, { retry: 'missed' }), event('c3', now, { response: 'selfReport' }), event('c5', now + 1)];
    expect(objectiveFirstResponses(rows, now)).toHaveLength(1);
  });
  test('repeated concepts in the same session count once', () => {
    const rows = [event('c1', now - 1, { sessionId: 'same', correct: false }), event('c1', now, { sessionId: 'same' })];
    expect(objectiveFirstResponses(rows, now)[0].correct).toBe(false);
    expect(objectiveFirstResponses(rows, now)).toHaveLength(1);
  });
  test('coverage uses unique native lesson concepts, not question counts', () => {
    const rows = [event('c3', now - 1), event('c3', now), event('missing', now)];
    const s = assessmentCoverage(b, rows, now);
    expect(s.assessableConcepts).toBe(5);
    expect(s.distinctConcepts).toBe(1);
    expect(s.coverage).toBeCloseTo(1 / 5);
  });
  test('practice uses newest first-response per concept and excludes exams', () => {
    const rows = [event('c1', now - day, { correct: false }), event('c1', now), event('c2', now, { mode: 'mock' }), event('c3', now - 31 * day)];
    expect(recentPracticeEvidence(b, rows, now)).toMatchObject({ correct: 1, total: 1, accuracy: 1 });
  });
  test('delayed recall needs a prior encounter and a 24-hour gap', () => {
    expect(delayedRecallEvidence(b, [event('c1', now, { mode: 'review' })], now).accuracy).toBeNull();
    const rows = [event('c1', now - day), event('c1', now, { mode: 'review' })];
    expect(delayedRecallEvidence(b, rows, now).accuracy).toBe(1);
    rows[0].at += 1;
    expect(delayedRecallEvidence(b, rows, now).accuracy).toBeNull();
  });
  test('an intervening exposure resets delayed-recall eligibility', () => {
    const rows = [event('c1', now - 3 * day), event('c1', now - 100, { response: 'selfReport' }), event('c1', now, { mode: 'review' })];
    expect(delayedRecallEvidence(b, rows, now).accuracy).toBeNull();
  });
  test('topic evidence distinguishes unknown from a small sample', () => {
    expect(topicEvidence(b, [], now)[0].status).toBe('notAssessed');
    expect(topicEvidence(b, [event('c1', now, { correct: false })], now)[0].status).toBe('limitedEvidence');
  });
  test('strong evidence needs breadth, multiple days and no reported guessing', () => {
    const chapter = { ...b.chapters[0], lessonIds: [10] };
    const q = b.questions[1];
    const bundle = { ...b, chapters: [chapter], lessons: [{ ...b.lessons[0], questionIds: [1,2,3,4,5] }], questions: Object.fromEntries([1,2,3,4,5].map((id) => [id, { ...q, id, conceptId: `k${id}` }])) };
    const rows = [1,2,3,4,5].map((id) => event(`k${id}`, now, { id: `e${id}` }));
    expect(topicEvidence(bundle, rows, now)[0].status).toBe('learning');
    rows.push(event('k1', now - 2 * day));
    expect(topicEvidence(bundle, rows, now)[0].status).toBe('strongEvidence');
    rows[0].confidence = 'guess';
    expect(topicEvidence(bundle, rows, now)[0].status).toBe('learning');
    expect(dayKey(now)).not.toBe(dayKey(now - 2 * day));
  });
  test('exam thresholds and score denominators belong to each attempt', () => {
    expect(examEvidence(attempt('short', 8, 10, now), 15, 20)).toMatchObject({ correct: 8, total: 10, required: 8, passed: true });
    expect(examEvidence(attempt('long', 14, 20, now), 15, 20)?.passed).toBe(false);
    expect(examEvidence({ ...attempt('unfinished', 20, 20, now), finishedAt: null }, 15, 20)).toBeNull();
  });
  test('exam scores reject alien answers, duplicate inflation and unanswered correctness', () => {
    const a = attempt('a', 1, 2, now);
    a.answers.push({ ...a.answers[0] });
    a.answers.push({ ...a.answers[0], questionId: 999 });
    a.answers[1] = { ...a.answers[1], chosen: null, correct: true };
    expect(examEvidence(a, 15, 20)).toMatchObject({ correct: 1, total: 2, answered: 1 });
  });
  test('best exam compares ratios, not the largest raw correct count', () => {
    const best = bestExamEvidence(b, [attempt('a', 8, 10, now), attempt('b', 15, 20, now - 1)], now);
    expect(best?.attempt.id).toBe('a');
    expect(best?.total).toBe(10);
  });
  test('recent mocks exclude practice exams, old data and future results', () => {
    const rows = [attempt('mock', 8, 10, now), attempt('practice', 10, 10, now, 999), attempt('old', 10, 10, now - 31 * day), attempt('future', 10, 10, now + 1)];
    expect(recentMockEvidence(b, rows, now).map((e) => e.attempt.id)).toEqual(['mock']);
  });
  test('improvement needs two groups of three comparable mock attempts', () => {
    const rows = [9,9,9,6,6,6].map((score, i) => attempt(String(i), score, 10, now - i));
    expect(examImprovement(b, rows, now)).toBeCloseTo(30);
    expect(examImprovement(b, rows.slice(0, 5), now)).toBeNull();
    rows[5].questionIds.push(11);
    expect(examImprovement(b, rows, now)).toBeNull();
  });
  test('review workload ignores removed concepts and distinguishes overdue from due today', () => {
    const card = { questionId: 1, conceptId: 'c1', interval: 1, ease: 2.5, reps: 0, lapses: 0, due: now, lastReviewed: 0 };
    const rows = [card, { ...card, conceptId: 'c2', due: now - 2 * day }, { ...card, conceptId: 'deleted', due: 0 }];
    expect(reviewWorkload(b, rows, now)).toEqual({ due: 2, overdue: 1 });
  });
});
