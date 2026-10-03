import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import { homeRecommendationModel } from './homeRecommendation';
const bundle = makeBundle(); const chapter = bundle.chapters[0];
const pending = { kind: 'finishChapter' as const, chapterId: chapter.id };
describe('compact recommendation actions', () => {
  test('validation opens the available full chapter quiz directly', () => {
    const model = homeRecommendationModel(pending, null, bundle);
    expect(model.primary.route).toBe(`/learn/quiz?kind=chapter&id=${chapter.id}`); expect(model.primary.label).toBe('finishChapter');
  });
  test('review is distinct from validation and opens chapter content', () => {
    const model = homeRecommendationModel(pending, { action: { kind: 'studyTopic', chapterId: chapter.id }, label: 'reviewChapter' }, bundle);
    expect(model.secondary?.route).toBe(`/learn/${chapter.id}`); expect(model.secondary?.route).not.toBe(model.primary.route);
  });
  test('unavailable quizzes fall back and hide the duplicate review route', () => {
    const model = homeRecommendationModel(pending, { action: { kind: 'studyTopic', chapterId: chapter.id }, label: 'reviewChapter' }, { ...bundle, questions: {} });
    expect(model.primary).toMatchObject({ route: `/learn/${chapter.id}`, label: 'openChapter', reason: 'quizUnavailable' }); expect(model.secondary).toBeNull();
  });
  test('a deleted chapter falls back safely without offering a nonexistent quiz', () => {
    expect(homeRecommendationModel({ kind: 'finishChapter', chapterId: -1 }, null, bundle).primary).toMatchObject({ route: '/learn', label: 'openCourse', reason: 'contentUnavailable' });
  });
  test('a live exam action remains primary and warns before the secondary quiz', () => {
    const exam = bundle.exams[0];
    const model = homeRecommendationModel({ kind: 'resumeExam', examId: exam.id }, { action: pending, label: 'continueCourse' }, bundle);
    expect(model.primary.route).toBe(`/exams/${exam.id}`); expect(model.primary.label).toBe('resumeExam'); expect(model.showExamWarning).toBe(true);
    expect(model.secondary?.route).toBe(`/learn/quiz?kind=chapter&id=${chapter.id}`); expect(model.secondary?.label).toBe('finishChapter');
  });
  test('lesson and chapter context are separated instead of one long title', () => {
    const lesson = bundle.lessons.find((entry) => entry.id === chapter.lessonIds[0]);
    const primary = homeRecommendationModel({ kind: 'startLearning', lessonId: lesson?.id }, null, bundle).primary;
    expect(primary.subject).toBe(lesson?.title); expect(primary.context).toBe(chapter.title); expect(primary.label).toBe('startChapter');
  });
  test('two chapter-detail actions do not create duplicate buttons', () => {
    const model = homeRecommendationModel({ kind: 'studyTopic', chapterId: chapter.id }, { action: { kind: 'studyTopic', chapterId: chapter.id }, label: 'reviewChapter' }, bundle);
    expect(model.secondary).toBeNull();
  });
  test('a missing lesson keeps an explicit safe fallback', () => {
    expect(homeRecommendationModel({ kind: 'continueLesson', lessonId: -1 }, null, bundle).primary).toMatchObject({ route: '/learn', label: 'openCourse', reason: 'contentUnavailable' });
  });
});
