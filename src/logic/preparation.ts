import type { DashboardSnapshot } from './dashboardStats';
import { validScore } from './completion';

export const PREPARATION_WEIGHTS = { course: 0.25, practice: 0.4, mocks: 0.35 } as const;
export const MIN_PREPARATION_PRACTICE_CONCEPTS = 5;
export const MIN_PREPARATION_MOCKS = 2;
export const PREPARATION_WINDOW_MS = 30 * 86400000;
export type PreparationState = 'empty' | 'courseOnly' | 'insufficient' | 'available';
export type PreparationPhase = 'beginner' | 'intermediate' | 'final';
export interface PreparationWeights { course: number; practice: number; mocks: number; }
const BEGINNER_WEIGHTS: PreparationWeights = { course: 0.7, practice: 0.3, mocks: 0 };
const INTERMEDIATE_WEIGHTS: PreparationWeights = { course: 0.4, practice: 0.4, mocks: 0.2 };
function completionRatio(done: number, total: number): number | null { return Number.isSafeInteger(total) && total > 0 && Number.isSafeInteger(done) && done >= 0 && done <= total ? done / total : null; }
function unit(value: number | null): value is number { return value !== null && Number.isFinite(value) && value >= 0 && value <= 1; }
export function preparationPhase(courseRatio: number): PreparationPhase { return courseRatio < 0.3 ? 'beginner' : courseRatio <= 0.7 ? 'intermediate' : 'final'; }
export function preparationWeights(phase: PreparationPhase): PreparationWeights { return phase === 'beginner' ? BEGINNER_WEIGHTS : phase === 'intermediate' ? INTERMEDIATE_WEIGHTS : PREPARATION_WEIGHTS; }
export function preparationEstimate(data: Pick<DashboardSnapshot, 'completion' | 'evidence' | 'exams'>, now: number) {
  const completion = data.completion; const lessonRatio = completionRatio(completion.lessonsCompleted, completion.lessonsTotal); const chapterRatio = completionRatio(completion.chaptersCompleted, completion.chaptersTotal);
  const courseRatio = lessonRatio !== null && chapterRatio !== null ? (lessonRatio + chapterRatio) / 2 : null;
  const practice = data.evidence.practice; const validPractice = validScore(practice.correct, practice.total) && practice.distinctConcepts === practice.total && practice.accuracy !== null && Number.isFinite(practice.accuracy) && practice.accuracy >= 0 && practice.accuracy <= 1 && Math.abs(practice.accuracy - practice.correct / practice.total) < 1e-9;
  const practiceAccuracy = validPractice ? practice.correct / practice.total : null;
  const coverage = data.evidence.coverage; const coverageRatio = unit(coverage.coverage) && Number.isSafeInteger(coverage.assessableConcepts) && coverage.assessableConcepts > 0 && Number.isSafeInteger(coverage.distinctConcepts) && coverage.distinctConcepts >= 0 && coverage.distinctConcepts <= coverage.assessableConcepts ? coverage.coverage : null;
  const practiceRatio = practiceAccuracy !== null && coverageRatio !== null ? practiceAccuracy * coverageRatio : null;
  const mocks = data.exams.recentMocks.filter((row) => validScore(row.correct, row.total) && Number.isFinite(row.attempt.limitMs) && row.attempt.limitMs > 0 && row.attempt.finishedAt !== null && Number.isFinite(row.attempt.finishedAt) && row.attempt.finishedAt <= now && row.attempt.finishedAt >= now - PREPARATION_WINDOW_MS).sort((a, b) => (b.attempt.finishedAt ?? 0) - (a.attempt.finishedAt ?? 0)).slice(0, 5);
  const mockRatio = mocks.length ? mocks.reduce((sum, row) => sum + row.correct / row.total, 0) / mocks.length : null;
  const practiceConcepts = coverageRatio === null ? 0 : coverage.distinctConcepts; const confidence = Math.min(1, practiceConcepts / 100);
  const activeCourseRatio = courseRatio ?? 0; const phase = preparationPhase(activeCourseRatio); const weights = preparationWeights(phase);
  const needsMocks = weights.mocks > 0; const enough = courseRatio !== null && practiceRatio !== null && practiceConcepts >= MIN_PREPARATION_PRACTICE_CONCEPTS && (!needsMocks || mockRatio !== null && mocks.length >= MIN_PREPARATION_MOCKS);
  const hasCourseProgress = completion.lessonsCompleted > 0 || completion.chaptersCompleted > 0; const hasPerformance = practiceAccuracy !== null || mocks.length > 0;
  const state: PreparationState = enough ? 'available' : !hasCourseProgress && !hasPerformance ? 'empty' : hasCourseProgress && !hasPerformance && courseRatio !== null ? 'courseOnly' : 'insufficient';
  const rawPercent = enough && courseRatio !== null && practiceRatio !== null ? (weights.course * courseRatio + weights.practice * practiceRatio + (weights.mocks > 0 && mockRatio !== null ? weights.mocks * mockRatio : 0)) * 100 : null;
  const capped = rawPercent !== null && (courseRatio < 0.5 || (coverageRatio ?? 0) < 0.5); const percent = rawPercent === null ? null : capped ? Math.min(rawPercent, 40) : rawPercent;
  return { state, percent, rawPercent, capped, phase, weights, confidence, coveragePercent: coverageRatio === null ? null : coverageRatio * 100, assessableConcepts: coverage.assessableConcepts, coursePercent: courseRatio === null ? null : courseRatio * 100, lessonPercent: lessonRatio === null ? null : lessonRatio * 100, chapterPercent: chapterRatio === null ? null : chapterRatio * 100, practicePercent: practiceRatio === null ? null : practiceRatio * 100, practiceAccuracyPercent: practiceAccuracy === null ? null : practiceAccuracy * 100, mockPercent: mockRatio === null ? null : mockRatio * 100, practiceConcepts, mockCount: mocks.length, latestMockAt: mocks[0]?.attempt.finishedAt ?? null };
}
