import type { ContentBundle, SrsCard } from '../types';
import { chapterStatus, lessonStatus, type LearningProgress } from './completion';

export type ReminderTaskKind = 'exam' | 'review' | 'chapter' | 'lesson' | 'study';
export interface ReminderTask { kind: ReminderTaskKind; route: '/' | '/learn' | '/review' | '/exams' | `/learn/${number}` | `/learn/lesson/${number}` | `/exams/${number}`; lessonTitle?: string; chapterTitle?: string; dueCount?: number; daysBefore?: number; }
export interface ReminderContext { bundle: ContentBundle; progress: LearningProgress & { active: { examId: number; finishedAt: number | null } | null; cards: Record<string, SrsCard> }; now: number; examDate: string | null; }
export function contextualReminderTask(context: ReminderContext): ReminderTask {
  const { bundle, progress, now, examDate } = context;
  if (progress.active && progress.active.finishedAt === null && bundle.exams.some((exam) => exam.id === progress.active?.examId)) return { kind: 'exam', route: `/exams/${progress.active.examId}` };
  const due = [...new Map(Object.values(progress.cards).filter((card) => card.due <= now).map((card) => [card.conceptId, card])).values()].length;
  if (due > 0) return { kind: 'review', route: '/review', dueCount: due };
  const chapter = bundle.chapters.find((item) => item.lessonIds.length > 0 && item.lessonIds.every((id) => lessonStatus(progress, id) === 'completed') && chapterStatus(progress, item) !== 'completed');
  if (chapter) return { kind: 'chapter', route: `/learn/${chapter.id}`, chapterTitle: chapter.title };
  const lesson = bundle.lessons.find((item) => lessonStatus(progress, item.id) === 'inProgress') ?? bundle.lessons.find((item) => lessonStatus(progress, item.id) !== 'completed');
  if (lesson) return { kind: 'lesson', route: `/learn/lesson/${lesson.id}`, lessonTitle: lesson.title };
  const exam = bundle.exams.find((item) => item.kind === 'mock') ?? bundle.exams[0];
  if (examDate) return { kind: 'study', route: exam ? `/exams/${exam.id}` : '/exams' };
  return { kind: 'study', route: '/learn' };
}
export function reminderVariant(day: number, kind: ReminderTaskKind): number { return Math.abs(day + kind.length) % 3; }
