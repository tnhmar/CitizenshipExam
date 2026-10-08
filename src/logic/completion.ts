import { useSettings } from '../store/settings';
import type { Chapter, ContentBundle, Lesson } from '../types';
import { learningPassPercent } from './learningLevels';
import { chapterQuizIds } from './quiz';

// Retained for legacy migration and existing explicit 90% callers.
export const LEARNING_PASS_PERCENT = 90;
export interface LearningQuizResult { correct: number; total: number; at: number; passPercent?: number; }
export interface LearningProgress {
  // Compatibility field: now contains validated completions, never mere visits.
  lessonsRead: Record<number, number>;
  lessonsStarted: Record<number, number>;
  lessonsStudied: Record<number, number>;
  quizResults: Record<string, LearningQuizResult>;
  quizBest: Record<string, LearningQuizResult>;
  quizPassed: Record<string, LearningQuizResult>;
}
export type LearningStatus = 'notStarted' | 'inProgress' | 'completed';
export const initialLearning = (): LearningProgress => ({ lessonsRead: {}, lessonsStarted: {}, lessonsStudied: {}, quizResults: {}, quizBest: {}, quizPassed: {} });
export function validScore(correct: number, total: number): boolean {
  return Number.isSafeInteger(total) && total > 0 && Number.isSafeInteger(correct) && correct >= 0 && correct <= total;
}
export function passesLearningQuiz(correct: number, total: number, passPercent = LEARNING_PASS_PERCENT): boolean {
  return (passPercent === 75 || passPercent === 90 || passPercent === 100)
    && validScore(correct, total) && correct * 100 >= total * passPercent;
}
export function learningLessonQuizIds(bundle: ContentBundle, lesson: Lesson): number[] {
  const ids = [...new Set(lesson.questionIds)];
  return ids.every((id) => Boolean(bundle.questions[id])) ? ids : [];
}
export function assessmentIds(bundle: ContentBundle, key: string): number[] {
  const match = /^(lesson|chapter):([1-9]\d*)$/.exec(key);
  if (!match) return [];
  const id = Number(match[2]);
  if (match[1] === 'lesson') {
    const lesson = bundle.lessons.find((l) => l.id === id);
    return lesson ? learningLessonQuizIds(bundle, lesson) : [];
  }
  const chapter = bundle.chapters.find((c) => c.id === id);
  if (!chapter || !chapter.lessonIds.length) return [];
  for (const lessonId of chapter.lessonIds) {
    const lesson = bundle.lessons.find((l) => l.id === lessonId);
    if (!lesson || lesson.questionIds.some((qid) => !bundle.questions[qid])) return [];
  }
  return chapterQuizIds(bundle, chapter);
}
export function startLesson(p: LearningProgress, id: number, now: number): LearningProgress {
  return { ...p, lessonsStarted: { ...p.lessonsStarted, [id]: p.lessonsStarted[id] ?? now } };
}
export function studyLesson(p: LearningProgress, bundle: ContentBundle, id: number, now: number): LearningProgress {
  const lesson = bundle.lessons.find((l) => l.id === id);
  if (!lesson || lesson.questionIds.length !== 0) return p;
  return { ...startLesson(p, id, now), lessonsStudied: { ...p.lessonsStudied, [id]: p.lessonsStudied[id] ?? now }, lessonsRead: { ...p.lessonsRead, [id]: p.lessonsRead[id] ?? now } };
}
export function recordLearningQuiz(p: LearningProgress, bundle: ContentBundle, key: string, correct: number, total: number, now: number, passPercent = learningPassPercent(useSettings.getState().quizLevel)): LearningProgress {
  const ids = assessmentIds(bundle, key);
  if (!validScore(correct, total) || !ids.length || ids.length !== total) return p;
  const result = { correct, total, at: now, passPercent };
  const previous = p.quizBest[key];
  const passed = passesLearningQuiz(correct, total, passPercent);
  const lessonId = key.startsWith('lesson:') ? Number(key.slice(7)) : null;
  const next = lessonId === null ? p : startLesson(p, lessonId, now);
  return { ...next,
    quizResults: { ...p.quizResults, [key]: result },
    quizBest: { ...p.quizBest, [key]: !previous || correct * previous.total > previous.correct * total ? result : previous },
    quizPassed: passed ? { ...p.quizPassed, [key]: p.quizPassed[key] ?? result } : p.quizPassed,
    lessonsRead: passed && lessonId !== null ? { ...p.lessonsRead, [lessonId]: p.lessonsRead[lessonId] ?? now } : p.lessonsRead,
  };
}
export function lessonStatus(p: LearningProgress, id: number): LearningStatus {
  if (p.lessonsRead[id] !== undefined) return 'completed';
  return p.lessonsStarted[id] !== undefined || Boolean(p.quizResults[`lesson:${id}`]) ? 'inProgress' : 'notStarted';
}
export function chapterStatus(p: LearningProgress, chapter: Chapter): LearningStatus {
  const key = `chapter:${chapter.id}`;
  if (chapter.lessonIds.length > 0 && chapter.lessonIds.every((id) => lessonStatus(p, id) === 'completed') && p.quizPassed[key]) return 'completed';
  return chapter.lessonIds.some((id) => lessonStatus(p, id) !== 'notStarted') || Boolean(p.quizResults[key]) || Boolean(p.quizPassed[key]) ? 'inProgress' : 'notStarted';
}
export function migrateLearning(legacy: Partial<LearningProgress>, bundles: ContentBundle[]): LearningProgress {
  let next: LearningProgress = { ...initialLearning(), lessonsStarted: { ...legacy.lessonsRead }, quizResults: { ...legacy.quizResults } };
  for (const [key, result] of Object.entries(legacy.quizResults ?? {})) {
    if (!result || !validScore(result.correct, result.total) || !Number.isFinite(result.at)) continue;
    const bundle = bundles.find((b) => assessmentIds(b, key).length === result.total);
    if (bundle) next = recordLearningQuiz(next, bundle, key, result.correct, result.total, result.at, result.passPercent ?? LEARNING_PASS_PERCENT);
  }
  return next;
}
