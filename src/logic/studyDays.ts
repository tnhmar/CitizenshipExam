import type { ContentBundle, ExamAttempt } from '../types';
import type { AssessmentContext } from './assessmentCapture';
import { dayKey, type Streak } from './progress';

export const emptyStudyStreak = (): Streak => ({ count: 0, best: 0, lastDay: null });
const count = (value: number): number => Number.isSafeInteger(value) && value > 0 ? value : 0;
function yesterdayKey(now: number): string {
  const date = new Date(now); date.setDate(date.getDate() - 1); return dayKey(date.getTime());
}
export function touchStudyDay(streak: Streak, now: number): Streak {
  if (!Number.isFinite(now) || now < 0) return streak;
  const today = dayKey(now);
  if (streak.lastDay === today && count(streak.count) > 0) return streak;
  const next = streak.lastDay === yesterdayKey(now) ? count(streak.count) + 1 : 1;
  return { count: next, best: Math.max(count(streak.best), next), lastDay: today };
}
export type StudyDayState = 'doneToday' | 'continueToday' | 'restart' | 'notStarted';
export function studyDayStatus(streak: Streak, now: number): { state: StudyDayState; days: number } {
  if (!Number.isFinite(now) || !streak.lastDay || count(streak.count) === 0) return { state: 'notStarted', days: 0 };
  if (streak.lastDay === dayKey(now)) return { state: 'doneToday', days: count(streak.count) };
  if (streak.lastDay === yesterdayKey(now)) return { state: 'continueToday', days: count(streak.count) };
  return { state: 'restart', days: 0 };
}
export function objectiveStudyResponse(context: AssessmentContext | undefined, now: number): boolean {
  return Boolean(context && context.response === 'objective' && Number.isFinite(context.at) && context.at >= 0 && context.at <= now);
}
export function studyExamCompletion(attempt: ExamAttempt, bundle: ContentBundle, now: number): boolean {
  if (attempt.finishedAt === null || !Number.isFinite(attempt.finishedAt) || attempt.finishedAt < attempt.startedAt || attempt.finishedAt > now || !bundle.exams.some((exam) => exam.id === attempt.examId)) return false;
  const ids = new Set(attempt.questionIds);
  return attempt.answers.some((answer) => {
    const question = bundle.questions[answer.questionId];
    return Boolean(question && ids.has(answer.questionId) && question.conceptId === answer.conceptId && answer.chosen !== null && Number.isSafeInteger(answer.chosen) && answer.chosen >= 0 && answer.chosen < question.options.length);
  });
}
export function migrateStudyDayFields(legacy: { streak?: Streak; legacyActivityStreak?: Streak | null }, version: number): { streak: Streak; legacyActivityStreak: Streak | null } {
  if (version < 4) return { streak: emptyStudyStreak(), legacyActivityStreak: legacy.legacyActivityStreak ?? legacy.streak ?? null };
  return { streak: legacy.streak ?? emptyStudyStreak(), legacyActivityStreak: legacy.legacyActivityStreak ?? null };
}
