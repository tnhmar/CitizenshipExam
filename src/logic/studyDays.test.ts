import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import type { AssessmentContext } from './assessmentCapture';
import { dayKey } from './progress';
import { emptyStudyStreak, migrateStudyDayFields, objectiveStudyResponse, studyDayStatus, studyExamCompletion, touchStudyDay } from './studyDays';
const now = new Date(2026, 9, 2, 12).getTime();
const nextDay = new Date(2026, 9, 3, 12).getTime();
const later = new Date(2026, 9, 5, 12).getTime();
const context: AssessmentContext = { sessionId: 's', stepId: '1', at: now, mode: 'review', response: 'objective', firstResponse: true, retry: 'none', confidence: 'guess', correct: false };
describe('qualifying study-day streak', () => {
  test('one qualifying day starts the streak and repeated actions do not double it', () => {
    const streak = touchStudyDay(emptyStudyStreak(), now);
    expect(streak).toEqual({ count: 1, best: 1, lastDay: dayKey(now) });
    expect(touchStudyDay(streak, now + 100)).toBe(streak);
  });
  test('consecutive local dates extend the streak', () => {
    expect(touchStudyDay(touchStudyDay(emptyStudyStreak(), now), nextDay).count).toBe(2);
  });
  test('a missed calendar date restarts the current count and keeps best', () => {
    const streak = { count: 4, best: 9, lastDay: dayKey(now) };
    expect(touchStudyDay(streak, later)).toEqual({ count: 1, best: 9, lastDay: dayKey(later) });
  });
  test('the display explicitly distinguishes today, yesterday, broken and empty', () => {
    const streak = touchStudyDay(emptyStudyStreak(), now);
    expect(studyDayStatus(streak, now).state).toBe('doneToday');
    expect(studyDayStatus(streak, nextDay)).toEqual({ state: 'continueToday', days: 1 });
    expect(studyDayStatus(streak, later)).toEqual({ state: 'restart', days: 0 });
    expect(studyDayStatus(emptyStudyStreak(), now).state).toBe('notStarted');
  });
  test('wrong or guessed objective answers qualify, but self-report and future context do not', () => {
    expect(objectiveStudyResponse(context, now)).toBe(true);
    expect(objectiveStudyResponse({ ...context, response: 'selfReport' }, now)).toBe(false);
    expect(objectiveStudyResponse({ ...context, at: now + 1 }, now)).toBe(false);
    expect(objectiveStudyResponse(undefined, now)).toBe(false);
  });
  test('migration preserves the old activity record without inventing study-day dates', () => {
    const streak = { count: 12, best: 20, lastDay: dayKey(now) };
    expect(migrateStudyDayFields({ streak }, 3)).toEqual({ streak: emptyStudyStreak(), legacyActivityStreak: streak });
    expect(migrateStudyDayFields({ streak }, 4).streak).toEqual(streak);
  });
  test('invalid clocks do not mutate the streak', () => {
    const streak = emptyStudyStreak(); expect(touchStudyDay(streak, NaN)).toBe(streak);
  });
  test('finished exams need a valid objective answered question', () => {
    const bundle = makeBundle(); const q = bundle.questions[1];
    const attempt = { id: 'a', examId: bundle.exams[0].id, lang: bundle.lang, seed: 1, questionIds: [q.id], startedAt: now - 1000, finishedAt: now, limitMs: 60000, answers: [{ questionId: q.id, conceptId: q.conceptId, chosen: 0, correct: false, timeMs: 100, flagged: false }] };
    expect(studyExamCompletion(attempt, bundle, now)).toBe(true);
    expect(studyExamCompletion({ ...attempt, answers: [] }, bundle, now)).toBe(false);
    expect(studyExamCompletion({ ...attempt, finishedAt: null }, bundle, now)).toBe(false);
  });
});
