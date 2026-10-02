import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import { completionPreviewPercent, homeFocusTarget } from './homeFocus';
const bundle = makeBundle();
describe('focus-first Home presentation', () => {
  test('the active exam route remains the actual exam, not exam selection', () => {
    const exam = bundle.exams[0];
    expect(homeFocusTarget({ kind: 'resumeExam', examId: exam.id }, bundle).route).toBe(`/exams/${exam.id}`);
  });
  test('a first chapter lesson is labelled as starting the chapter', () => {
    const chapter = bundle.chapters[0];
    const lesson = bundle.lessons.find((entry) => entry.id === chapter.lessonIds[0]);
    const target = homeFocusTarget({ kind: 'startLearning', lessonId: lesson?.id }, bundle);
    expect(target.startsChapter).toBe(true);
    expect(target.subject).toBe(`${chapter.title} · ${lesson?.title}`);
  });
  test('a pending chapter keeps chapter-detail routing and validation availability', () => {
    const chapter = bundle.chapters[0];
    const target = homeFocusTarget({ kind: 'finishChapter', chapterId: chapter.id }, bundle);
    expect(target.route).toBe(`/learn/${chapter.id}`); expect(target.canValidate).toBe(true);
  });
  test('deleted targets fall back without claiming chapter validation is available', () => {
    const target = homeFocusTarget({ kind: 'finishChapter', chapterId: -1 }, bundle);
    expect(target.route).toBe('/learn'); expect(target.canValidate).toBe(false);
    expect(homeFocusTarget({ kind: 'startLearning', lessonId: -1 }, bundle).startsChapter).toBe(false);
  });
  test('zero totals and nonfinite counts have no fabricated progress percentage', () => {
    expect(completionPreviewPercent(0, 0)).toBe(0);
    expect(completionPreviewPercent(NaN, 10)).toBe(0);
  });
  test('completion preview uses the lesson ratio and bounds invalid overflow', () => {
    expect(completionPreviewPercent(3, 12)).toBe(25);
    expect(completionPreviewPercent(20, 10)).toBe(100);
    expect(completionPreviewPercent(-1, 10)).toBe(0);
  });
});
