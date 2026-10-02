import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import { assessmentIds, chapterStatus, initialLearning, learningLessonQuizIds, lessonStatus, migrateLearning, passesLearningQuiz, recordLearningQuiz, startLesson, studyLesson } from './completion';
const bundle = makeBundle();
const zero = () => initialLearning();
describe('90% learning validation', () => {
  test('uses exact scores, rejects invalid and empty scores', () => {
    expect(passesLearningQuiz(9, 10)).toBe(true);
    expect(passesLearningQuiz(18, 20)).toBe(true);
    expect(passesLearningQuiz(17, 19)).toBe(false);
    for (const [c, n] of [[0, 0], [10, 9], [-1, 10], [1.5, 2], [NaN, 10]]) expect(passesLearningQuiz(c, n)).toBe(false);
  });
  test('opening and revisiting start without completing', () => {
    const p = startLesson(zero(), 10, 1);
    expect(lessonStatus(p, 10)).toBe('inProgress');
    expect(p.lessonsRead).toEqual({});
    expect(startLesson(p, 10, 2).lessonsStarted[10]).toBe(1);
    expect(lessonStatus(p, 11)).toBe('notStarted');
  });
  test('one- and two-question lessons still require their quiz', () => {
    expect(learningLessonQuizIds(bundle, bundle.lessons[1])).toEqual([4, 5]);
    expect(learningLessonQuizIds(bundle, bundle.lessons[2])).toEqual([6]);
    expect(studyLesson(zero(), bundle, 11, 1)).toEqual(zero());
    expect(lessonStatus(recordLearningQuiz(zero(), bundle, 'lesson:11', 2, 2, 1), 11)).toBe('completed');
  });
  test('failed full quiz stays in progress; pass survives later failure', () => {
    let p = recordLearningQuiz(zero(), bundle, 'lesson:10', 2, 3, 1);
    expect(lessonStatus(p, 10)).toBe('inProgress');
    p = recordLearningQuiz(p, bundle, 'lesson:10', 3, 3, 2);
    p = recordLearningQuiz(p, bundle, 'lesson:10', 1, 3, 3);
    expect(lessonStatus(p, 10)).toBe('completed');
    expect(p.lessonsRead[10]).toBe(2);
    expect(p.quizPassed['lesson:10'].at).toBe(2);
    expect(p.quizBest['lesson:10'].correct).toBe(3);
    expect(p.quizResults['lesson:10'].correct).toBe(1);
  });
  test('partial quizzes and unrelated modes never validate', () => {
    for (const key of ['lesson:10', 'review:10', 'exam:10', 'chapter:999', 'lesson:bogus']) expect(recordLearningQuiz(zero(), bundle, key, 1, 1, 1)).toEqual(zero());
  });
  test('chapter needs every lesson and its own passing quiz, in either order', () => {
    let p = recordLearningQuiz(zero(), bundle, 'chapter:1', 4, 4, 1);
    expect(chapterStatus(p, bundle.chapters[0])).toBe('inProgress');
    p = recordLearningQuiz(p, bundle, 'lesson:10', 3, 3, 2);
    p = recordLearningQuiz(p, bundle, 'lesson:11', 2, 2, 3);
    expect(chapterStatus(p, bundle.chapters[0])).toBe('completed');
    const lessonsOnly = { ...p, quizPassed: {} };
    expect(chapterStatus(lessonsOnly, bundle.chapters[0])).toBe('inProgress');
    expect(chapterStatus(zero(), { ...bundle.chapters[0], lessonIds: [] })).toBe('notStarted');
  });
  test('only genuinely question-free lessons permit explicit studied completion', () => {
    const b = { ...bundle, lessons: bundle.lessons.map((l) => l.id === 10 ? { ...l, questionIds: [] } : l) };
    expect(lessonStatus(startLesson(zero(), 10, 1), 10)).toBe('inProgress');
    const p = studyLesson(zero(), b, 10, 2);
    expect(lessonStatus(p, 10)).toBe('completed');
    expect(p.lessonsStudied[10]).toBe(2);
    expect(studyLesson(zero(), b, 999, 1)).toEqual(zero());
  });
  test('missing question content cannot become the no-quiz exception', () => {
    const b = { ...bundle, questions: { ...bundle.questions } }; delete b.questions[1];
    expect(assessmentIds(b, 'lesson:10')).toEqual([]);
    expect(assessmentIds(b, 'chapter:1')).toEqual([]);
    expect(studyLesson(zero(), b, 10, 1)).toEqual(zero());
  });
  test('migration downgrades old read markers and restores only valid passes', () => {
    const p = migrateLearning({ lessonsRead: { 10: 1, 11: 2 }, quizResults: { 'lesson:10': { correct: 3, total: 3, at: 3 }, 'lesson:11': { correct: 1, total: 2, at: 4 }, 'chapter:1': { correct: 3, total: 4, at: 5 } } }, [bundle]);
    expect(p.lessonsStarted).toEqual({ 10: 1, 11: 2 });
    expect(p.lessonsRead).toEqual({ 10: 3 });
    expect(p.quizPassed['chapter:1']).toBeUndefined();
    expect(chapterStatus(p, bundle.chapters[0])).toBe('inProgress');
  });
  test('migration does not accept a saved partial result as a full pass', () => {
    const p = migrateLearning({ quizResults: { 'lesson:10': { correct: 1, total: 1, at: 1 } } }, [bundle]);
    expect(p.lessonsRead).toEqual({});
    expect(p.quizPassed).toEqual({});
  });
});
