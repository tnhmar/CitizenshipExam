import type { DashboardSnapshot } from './dashboardStats';
import { validScore } from './completion';

export const PREPARATION_WEIGHTS = { course: 0.5, practice: 0.3, mocks: 0.2 } as const;
export const MIN_PREPARATION_PRACTICE_CONCEPTS = 5;
export const MIN_PREPARATION_MOCKS = 2;
export const PREPARATION_WINDOW_MS = 30 * 86400000;
export type PreparationState = 'empty' | 'courseOnly' | 'insufficient' | 'available';
function completionRatio(done: number, total: number): number | null {
  return Number.isSafeInteger(total) && total > 0 && Number.isSafeInteger(done) && done >= 0 && done <= total ? done / total : null;
}
export function preparationEstimate(data: Pick<DashboardSnapshot, 'completion' | 'evidence' | 'exams'>, now: number) {
  const completion = data.completion;
  const lessonRatio = completionRatio(completion.lessonsCompleted, completion.lessonsTotal);
  const chapterRatio = completionRatio(completion.chaptersCompleted, completion.chaptersTotal);
  const courseRatio = lessonRatio !== null && chapterRatio !== null ? (lessonRatio + chapterRatio) / 2 : null;
  const practice = data.evidence.practice;
  const validPractice = validScore(practice.correct, practice.total) && practice.distinctConcepts === practice.total && practice.accuracy !== null && Number.isFinite(practice.accuracy) && practice.accuracy >= 0 && practice.accuracy <= 1 && Math.abs(practice.accuracy - practice.correct / practice.total) < 1e-9;
  const practiceRatio = validPractice ? practice.correct / practice.total : null;
  const mocks = data.exams.recentMocks.filter((row) => validScore(row.correct, row.total) && Number.isFinite(row.attempt.limitMs) && row.attempt.limitMs > 0 && row.attempt.finishedAt !== null && Number.isFinite(row.attempt.finishedAt) && row.attempt.finishedAt <= now && row.attempt.finishedAt >= now - PREPARATION_WINDOW_MS)
    .sort((a, b) => (b.attempt.finishedAt ?? 0) - (a.attempt.finishedAt ?? 0)).slice(0, 5);
  const mockRatio = mocks.length ? mocks.reduce((sum, row) => sum + row.correct / row.total, 0) / mocks.length : null;
  const practiceConcepts = validPractice ? practice.distinctConcepts : 0;
  const enough = courseRatio !== null && practiceRatio !== null && mockRatio !== null && practiceConcepts >= MIN_PREPARATION_PRACTICE_CONCEPTS && mocks.length >= MIN_PREPARATION_MOCKS;
  const hasCourseProgress = completion.lessonsCompleted > 0 || completion.chaptersCompleted > 0;
  const hasPerformance = practiceRatio !== null || mocks.length > 0;
  const state: PreparationState = enough ? 'available' : !hasCourseProgress && !hasPerformance ? 'empty' : hasCourseProgress && !hasPerformance && courseRatio !== null ? 'courseOnly' : 'insufficient';
  const percent = enough && courseRatio !== null && practiceRatio !== null && mockRatio !== null ? (PREPARATION_WEIGHTS.course * courseRatio + PREPARATION_WEIGHTS.practice * practiceRatio + PREPARATION_WEIGHTS.mocks * mockRatio) * 100 : null;
  return { state, percent, coursePercent: courseRatio === null ? null : courseRatio * 100, lessonPercent: lessonRatio === null ? null : lessonRatio * 100, chapterPercent: chapterRatio === null ? null : chapterRatio * 100, practicePercent: practiceRatio === null ? null : practiceRatio * 100, mockPercent: mockRatio === null ? null : mockRatio * 100, practiceConcepts, mockCount: mocks.length, latestMockAt: mocks[0]?.attempt.finishedAt ?? null };
}
