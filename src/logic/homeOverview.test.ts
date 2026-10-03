import { describe, expect, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import { initialLearning } from './completion';
import { snapshot } from './dashboardStats';
import { homeOverviewModel, miniMockChart, overviewMocks } from './homeOverview';
import { initialAssessmentHistory, type ExamEvidence } from './learningStats';
const bundle = makeBundle(); const now = new Date(2026, 9, 2, 12).getTime();
const data = snapshot(bundle, { ...initialLearning(), ...initialAssessmentHistory(), attempts: [], cards: {}, active: null }, now);
const row = (id: string, correct: number, total: number, required: number, at: number): ExamEvidence => ({ attempt: { id, examId: bundle.exams[0].id, lang: bundle.lang, seed: 1, questionIds: [], startedAt: at - 1000, finishedAt: at, limitMs: 60000, answers: [] }, correct, total, answered: total, required, passed: correct >= required, ratio: correct / total });
describe('compact Home overview', () => {
  test('empty practice and mocks are absent evidence, not zero performance', () => {
    const model = homeOverviewModel(data); expect(model.practicePercent).toBeNull(); expect(model.mockAveragePercent).toBeNull(); expect(model.mocks).toEqual([]);
  });
  test('the course chart uses only completed lessons, not blended readiness', () => {
    const model = homeOverviewModel({ ...data, completion: { ...data.completion, lessonsCompleted: 9, lessonsTotal: 85, chaptersCompleted: 1, chaptersTotal: 14 } });
    expect(model.coursePercent).toBeCloseTo(9 * 100 / 85);
  });
  test('an assessed zero practice result is still displayed as zero', () => {
    const model = homeOverviewModel({ ...data, evidence: { ...data.evidence, practice: { correct: 0, total: 4, distinctConcepts: 4, accuracy: 0 } } });
    expect(model.practicePercent).toBe(0); expect(model.practiceTotal).toBe(4);
  });
  test('malformed practice and an empty course cannot fabricate percentages', () => {
    const model = homeOverviewModel({ ...data, completion: { ...data.completion, lessonsTotal: 0 }, evidence: { ...data.evidence, practice: { correct: 1, total: 2, distinctConcepts: 2, accuracy: NaN } } });
    expect(model.coursePercent).toBeNull(); expect(model.practicePercent).toBeNull();
  });
  test('mock points use per-attempt score and pass denominators', () => {
    const rows = overviewMocks([row('a', 8, 10, 8, now - 1), row('b', 14, 20, 15, now)]);
    expect(rows[0]).toMatchObject({ percent: 80, threshold: 80, passed: true });
    expect(rows[1]).toMatchObject({ percent: 70, threshold: 75, passed: false });
  });
  test('at most five newest mocks are shown oldest to newest without mutating input', () => {
    const input = Array.from({ length: 6 }, (_, index) => row(String(index), 8, 10, 8, now - index));
    expect(overviewMocks(input).map((entry) => entry.id)).toEqual(['4', '3', '2', '1', '0']); expect(input[0].attempt.id).toBe('0');
  });
  test('empty and one-point charts have honest geometry', () => {
    expect(miniMockChart([])).toEqual({ points: [], scorePath: '', targetPath: '' });
    const chart = miniMockChart(overviewMocks([row('a', 8, 10, 8, now)]));
    expect(chart.points[0].x).toBe(150); expect(chart.targetPath).toContain('L 280');
  });
  test('the overview average uses the same visible normalized mock scores', () => {
    const model = homeOverviewModel({ ...data, exams: { ...data.exams, recentMocks: [row('a', 8, 10, 8, now), row('b', 15, 20, 15, now - 1)] } });
    expect(model.mockAveragePercent).toBe(77.5);
  });
});
