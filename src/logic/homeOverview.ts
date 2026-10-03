import type { DashboardSnapshot } from './dashboardStats';
import { validScore } from './completion';
import type { ExamEvidence } from './learningStats';

export interface OverviewMock { id: string; at: number; correct: number; total: number; required: number; percent: number; threshold: number; passed: boolean; }
export function overviewMocks(rows: ExamEvidence[]): OverviewMock[] {
  return rows.filter((row) => validScore(row.correct, row.total) && Number.isSafeInteger(row.required) && row.required > 0 && row.required <= row.total && row.attempt.finishedAt !== null && Number.isFinite(row.attempt.finishedAt))
    .sort((a, b) => (b.attempt.finishedAt ?? 0) - (a.attempt.finishedAt ?? 0) || b.attempt.id.localeCompare(a.attempt.id))
    .slice(0, 5).reverse().map((row) => ({ id: row.attempt.id, at: row.attempt.finishedAt ?? row.attempt.startedAt, correct: row.correct, total: row.total, required: row.required, percent: row.correct * 100 / row.total, threshold: row.required * 100 / row.total, passed: row.correct >= row.required }));
}
export function miniMockChart(rows: OverviewMock[]) {
  const points = rows.map((row, index) => ({ ...row, x: rows.length === 1 ? 150 : 20 + index * 260 / (rows.length - 1), y: 80 - row.percent * 0.72, targetY: 80 - row.threshold * 0.72 }));
  const scorePath = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const targetPath = points.length === 1 ? `M 20 ${points[0].targetY} L 280 ${points[0].targetY}` : points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.targetY}`).join(' ');
  return { points, scorePath, targetPath };
}
export function homeOverviewModel(data: Pick<DashboardSnapshot, 'completion' | 'exams' | 'evidence'>) {
  const completion = data.completion;
  const coursePercent = Number.isSafeInteger(completion.lessonsTotal) && completion.lessonsTotal > 0 && Number.isSafeInteger(completion.lessonsCompleted) && completion.lessonsCompleted >= 0 ? Math.max(0, Math.min(100, completion.lessonsCompleted * 100 / completion.lessonsTotal)) : null;
  const practice = data.evidence.practice;
  const practicePercent = practice.accuracy !== null && Number.isFinite(practice.accuracy) && practice.accuracy >= 0 && practice.accuracy <= 1 && validScore(practice.correct, practice.total) ? practice.accuracy * 100 : null;
  const mocks = overviewMocks(data.exams.recentMocks);
  return { coursePercent, practicePercent, practiceCorrect: practice.correct, practiceTotal: practice.total, mocks, mockAveragePercent: mocks.length ? mocks.reduce((sum, row) => sum + row.percent, 0) / mocks.length : null };
}
