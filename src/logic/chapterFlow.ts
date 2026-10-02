import type { ContentBundle } from '../types';
import { chapterStatus, lessonStatus, type LearningProgress } from './completion';

export interface NextChapterTarget { chapterId: number; title: string; route: string; }
export function assessmentChapterId(bundle: ContentBundle, key: string): number | null {
  const match = /^(lesson|chapter):([1-9]\d*)$/.exec(key);
  if (!match) return null;
  const id = Number(match[2]);
  if (!Number.isSafeInteger(id)) return null;
  return match[1] === 'chapter' ? bundle.chapters.find((c) => c.id === id)?.id ?? null : bundle.lessons.find((l) => l.id === id)?.chapterId ?? null;
}
export function nextChapterTarget(bundle: ContentBundle, progress: LearningProgress, chapterId: number): NextChapterTarget | null {
  const chapters = [...bundle.chapters].sort((a, b) => a.order - b.order || a.id - b.id);
  const index = chapters.findIndex((c) => c.id === chapterId);
  if (index < 0 || chapterStatus(progress, chapters[index]) !== 'completed') return null;
  const next = chapters[index + 1];
  if (!next) return null;
  const lessonId = next.lessonIds.find((id) => bundle.lessons.some((l) => l.id === id && l.chapterId === next.id) && lessonStatus(progress, id) !== 'completed');
  return { chapterId: next.id, title: next.title, route: lessonId === undefined ? `/learn/${next.id}` : `/learn/lesson/${lessonId}` };
}
export function courseCompleted(bundle: ContentBundle, progress: LearningProgress): boolean {
  return bundle.chapters.length > 0 && bundle.chapters.every((c) => chapterStatus(progress, c) === 'completed');
}
