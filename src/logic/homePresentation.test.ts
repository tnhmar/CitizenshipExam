import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import { needsTabAnchor } from '../navigation/tabRoots';
import { homeExamDate, homePercent, homeStep } from './homePresentation';
const bundle = makeBundle(); const now = new Date(2026, 9, 2, 12).getTime();
describe('Home next-action routes', () => {
  test('resumes the actual active exam', () => { expect(homeStep({ kind: 'resumeExam', examId: 100 }, bundle)).toEqual({ route: '/exams/100', subject: 'Mock Test A' }); });
  test('opens the review entry without changing the deck', () => { expect(homeStep({ kind: 'reviewDue' }, bundle)).toEqual({ route: '/review', subject: null }); });
  test('weak topics and pending chapter quizzes open chapter details', () => {
    for (const kind of ['studyTopic', 'finishChapter'] as const) expect(homeStep({ kind, chapterId: 1 }, bundle)).toEqual({ route: '/learn/1', subject: 'Ch1' });
  });
  test('starts or continues the selected lesson', () => {
    for (const kind of ['startLearning', 'continueLesson'] as const) expect(homeStep({ kind, lessonId: 10 }, bundle)).toEqual({ route: '/learn/lesson/10', subject: 'L10' });
  });
  test('mock practice opens exam selection rather than inventing an attempt', () => { expect(homeStep({ kind: 'takeMock' }, bundle)).toEqual({ route: '/exams', subject: null }); });
  test('next-action links keep the existing cross-tab anchor policy', () => {
    expect(needsTabAnchor(homeStep({ kind: 'continueLesson', lessonId: 10 }, bundle).route)).toBe(true);
    expect(needsTabAnchor(homeStep({ kind: 'finishChapter', chapterId: 1 }, bundle).route)).toBe(true);
    expect(needsTabAnchor(homeStep({ kind: 'resumeExam', examId: 100 }, bundle).route)).toBe(false);
    expect(needsTabAnchor(homeStep({ kind: 'reviewDue' }, bundle).route)).toBe(false);
  });
  test('missing or deleted action targets fall back safely', () => {
    expect(homeStep({ kind: 'resumeExam', examId: 999 }, bundle).route).toBe('/exams');
    expect(homeStep({ kind: 'continueLesson' }, bundle).route).toBe('/learn');
    expect(homeStep({ kind: 'studyTopic', chapterId: 999 }, bundle).route).toBe('/learn');
  });
});
describe('Home exam-date information', () => {
  test('no date preserves the settings entry', () => { expect(homeExamDate(null, now)).toEqual({ kind: 'unset', value: '+', days: null }); });
  test('invalid saved dates do not display a fabricated countdown', () => { expect(homeExamDate('2026-02-30', now).kind).toBe('unset'); });
  test('past dates remain distinguishable', () => { expect(homeExamDate('2026-10-01', now)).toEqual({ kind: 'past', value: '—', days: -1 }); });
  test('today remains distinguishable', () => { expect(homeExamDate('2026-10-02', now)).toEqual({ kind: 'today', value: '🎯', days: 0 }); });
  test('upcoming dates count local calendar days', () => { expect(homeExamDate('2026-10-07', now)).toEqual({ kind: 'upcoming', value: '5', days: 5 }); });
});
describe('Home evidence formatting', () => {
  test('no evidence is not a zero score', () => { expect(homePercent(null)).toBe('—'); expect(homePercent(0)).toBe('0%'); });
  test('valid score ratios are displayed as percentages', () => { expect(homePercent(0.78)).toBe('78%'); expect(homePercent(1)).toBe('100%'); });
  test('invalid evidence is not presented as a score', () => { for (const ratio of [NaN, Infinity, -0.1, 1.1]) expect(homePercent(ratio)).toBe('—'); });
});
