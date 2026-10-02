import type { ContentBundle } from '../types';
import type { DashboardAction } from './dashboardStats';
import { daysUntil, isValidDay } from './date';

export interface HomeStep { route: string; subject: string | null; }
export function homeStep(action: DashboardAction, bundle: ContentBundle): HomeStep {
  if (action.kind === 'resumeExam') {
    const exam = bundle.exams.find((e) => e.id === action.examId);
    return exam ? { route: `/exams/${exam.id}`, subject: exam.title } : { route: '/exams', subject: null };
  }
  if (action.kind === 'reviewDue') return { route: '/review', subject: null };
  if (action.kind === 'studyTopic' || action.kind === 'finishChapter') {
    const chapter = bundle.chapters.find((c) => c.id === action.chapterId);
    return chapter ? { route: `/learn/${chapter.id}`, subject: chapter.title } : { route: '/learn', subject: null };
  }
  if (action.kind === 'startLearning' || action.kind === 'continueLesson') {
    const lesson = bundle.lessons.find((l) => l.id === action.lessonId);
    return lesson ? { route: `/learn/lesson/${lesson.id}`, subject: lesson.title } : { route: '/learn', subject: null };
  }
  return { route: '/exams', subject: null };
}
export interface HomeExamDate { kind: 'unset' | 'past' | 'today' | 'upcoming'; value: string; days: number | null; }
export function homeExamDate(date: string | null, now: number): HomeExamDate {
  if (!date || !isValidDay(date)) return { kind: 'unset', value: '+', days: null };
  const days = daysUntil(date, now);
  return days < 0 ? { kind: 'past', value: '—', days } : days === 0 ? { kind: 'today', value: '🎯', days } : { kind: 'upcoming', value: String(days), days };
}
export function homePercent(ratio: number | null): string {
  return ratio === null || !Number.isFinite(ratio) || ratio < 0 || ratio > 1 ? '—' : `${Math.round(ratio * 100)}%`;
}
