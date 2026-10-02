import type { ContentBundle, ExamAttempt } from '../types';
import { chapterStatus, lessonStatus, type LearningProgress } from './completion';
import type { DashboardAction } from './dashboardStats';

export interface NextStepAlternative { action: DashboardAction; label: 'continueCourse' | 'reviewChapter'; }
export interface NextStepSelection { primary: DashboardAction; alternative: NextStepAlternative | null; }
export function selectNextStep(bundle: ContentBundle, progress: LearningProgress & { active?: ExamAttempt | null }, now: number, due: number, weakChapterId?: number): NextStepSelection {
  const chapters = [...bundle.chapters].sort((a, b) => a.order - b.order || a.id - b.id);
  const pending = chapters.find((chapter) => chapter.lessonIds.length > 0 && chapter.lessonIds.every((id) => lessonStatus(progress, id) === 'completed') && chapterStatus(progress, chapter) !== 'completed');
  const current = chapters.find((chapter) => chapterStatus(progress, chapter) !== 'completed');
  const chapterLessons = current ? current.lessonIds.map((id) => bundle.lessons.find((lesson) => lesson.id === id && lesson.chapterId === current.id)).filter((lesson): lesson is ContentBundle['lessons'][number] => lesson !== undefined) : [];
  const lesson = chapterLessons.find((entry) => lessonStatus(progress, entry.id) === 'inProgress') ?? chapterLessons.find((entry) => lessonStatus(progress, entry.id) !== 'completed');
  const course: DashboardAction = pending ? { kind: 'finishChapter', chapterId: pending.id } : lesson ? { kind: lessonStatus(progress, lesson.id) === 'inProgress' ? 'continueLesson' : 'startLearning', lessonId: lesson.id } : current ? { kind: 'studyTopic', chapterId: current.id } : { kind: 'takeMock' };
  const active = progress.active;
  const liveExam = active && active.finishedAt === null && Number.isFinite(active.startedAt) && Number.isFinite(active.limitMs) && active.limitMs > 0 && active.startedAt <= now && active.startedAt + active.limitMs > now && bundle.exams.some((exam) => exam.id === active.examId);
  if (liveExam && active) return { primary: { kind: 'resumeExam', examId: active.examId }, alternative: { action: course, label: 'continueCourse' } };
  if (due > 0) return { primary: { kind: 'reviewDue' }, alternative: { action: course, label: 'continueCourse' } };
  if (pending) return { primary: course, alternative: { action: { kind: 'studyTopic', chapterId: pending.id }, label: 'reviewChapter' } };
  if (weakChapterId !== undefined && chapters.some((chapter) => chapter.id === weakChapterId)) {
    const primary: DashboardAction = { kind: 'studyTopic', chapterId: weakChapterId };
    const identical = course.kind === primary.kind && course.chapterId === primary.chapterId;
    return { primary, alternative: identical ? null : { action: course, label: 'continueCourse' } };
  }
  return { primary: course, alternative: lesson ? { action: { kind: 'studyTopic', chapterId: lesson.chapterId }, label: 'reviewChapter' } : null };
}
