import type { ContentBundle } from '../types';
import { assessmentIds } from './completion';
import type { DashboardAction } from './dashboardStats';
import { homeStep, type HomeStep } from './homePresentation';

export interface FocusTarget extends HomeStep { startsChapter: boolean; canValidate: boolean; }
export function homeFocusTarget(action: DashboardAction, bundle: ContentBundle): FocusTarget {
  const step = homeStep(action, bundle);
  const lesson = bundle.lessons.find((entry) => entry.id === action.lessonId);
  const chapter = bundle.chapters.find((entry) => entry.id === lesson?.chapterId);
  return {
    ...step,
    subject: lesson && chapter && step.subject ? `${chapter.title} · ${step.subject}` : step.subject,
    startsChapter: Boolean(lesson && chapter && chapter.lessonIds[0] === lesson.id),
    canValidate: action.kind !== 'finishChapter' || assessmentIds(bundle, `chapter:${action.chapterId}`).length > 0,
  };
}
export function completionPreviewPercent(completed: number, total: number): number {
  if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, completed * 100 / total));
}
