import { describe, expect, test } from '@jest/globals';
import { assessmentRunId, quizResponseContext, reviewResponseContext, reviewExposureContext } from './assessmentRuns';
describe('assessment response provenance', () => {
  test('run identity is stable and separates runs started in the same millisecond', () => {
    expect(assessmentRunId('quiz', 10, 'a')).toBe(assessmentRunId('quiz', 10, 'a'));
    expect(assessmentRunId('quiz', 10, 'a')).not.toBe(assessmentRunId('quiz', 10, 'b'));
    expect(assessmentRunId('quiz', 10, 'a')).not.toBe(assessmentRunId('review', 10, 'a'));
  });
  test('lesson and chapter capture keep their actual assessment mode', () => {
    expect(quizResponseContext('s', 'lesson:10', 1, 10, 'none')?.mode).toBe('lesson');
    expect(quizResponseContext('s', 'chapter:1', 1, 10, 'none')?.mode).toBe('chapter');
  });
  test('unscoped saved-question practice is captured as bookmark practice', () => {
    expect(quizResponseContext('s', undefined, 1, 10, 'none')).toMatchObject({ mode: 'bookmark', response: 'objective', firstResponse: true });
  });
  test('invalid scope keys cannot be silently relabelled as bookmark practice', () => {
    for (const key of ['exam:1', 'review:1', 'lesson:bad', 'lesson:0', 'chapter:-1', '']) expect(quizResponseContext('s', key, 1, 10, 'none')).toBeNull();
  });
  test('missed-only retries remain identifiable and full restarts are separate', () => {
    expect(quizResponseContext('missed', 'lesson:10', 1, 10, 'missed')?.retry).toBe('missed');
    expect(quizResponseContext('full', 'lesson:10', 1, 10, 'full')?.retry).toBe('full');
    expect(quizResponseContext('missed', 'lesson:10', 1, 10, 'missed')?.sessionId).not.toBe(quizResponseContext('full', 'lesson:10', 1, 10, 'full')?.sessionId);
  });
  test('step identity is stable across timestamps and differs across questions', () => {
    expect(quizResponseContext('s', 'lesson:10', 1, 10, 'none')?.stepId).toBe(quizResponseContext('s', 'lesson:10', 1, 11, 'none')?.stepId);
    expect(quizResponseContext('s', 'lesson:10', 1, 10, 'none')?.stepId).not.toBe(quizResponseContext('s', 'lesson:10', 2, 10, 'none')?.stepId);
  });
  test('objective review keeps actual correctness separately from confidence', () => {
    expect(reviewResponseContext('r', 0, 1, 10, 'objective', true, 'guess')).toMatchObject({ correct: true, confidence: 'guess', response: 'objective', retry: 'none' });
    expect(reviewResponseContext('r', 0, 1, 10, 'objective', false, 'unknown')?.correct).toBe(false);
  });
  test('flashcard self-report is not mislabelled as an objective answer', () => {
    expect(reviewResponseContext('r', 0, 1, 10, 'selfReport', true, 'know')?.response).toBe('selfReport');
  });
  test('viewing a flashcard answer is non-objective exposure with its own step ID', () => {
    const e = reviewExposureContext('r', 0, 1, 10);
    expect(e).toMatchObject({ response: 'selfReport', firstResponse: false, confidence: null });
    expect(e.stepId).not.toBe(reviewResponseContext('r', 0, 1, 10, 'selfReport', true, 'know').stepId);
  });
  test('answer exposure prevents a later quiz response being labelled first', () => {
    expect(reviewResponseContext('r', 0, 1, 10, 'objective', true, 'know', false).firstResponse).toBe(false);
  });
  test('redo-missed review rounds use distinct sessions and remain missed retries', () => {
    const first = reviewResponseContext('r', 0, 1, 10, 'objective', false, 'unknown');
    const redo = reviewResponseContext('r', 1, 1, 20, 'objective', true, 'know');
    expect(redo.sessionId).not.toBe(first.sessionId);
    expect(redo.retry).toBe('missed');
  });
});
