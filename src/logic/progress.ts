import type { ExamAttempt } from '../types';

export const DAY_MS = 86400000;

export interface Streak {
  count: number;
  best: number;
  lastDay: string | null;
}

export function dayKey(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function daysBetween(fromMs: number, toMs: number): number {
  return Math.round((startOfDay(toMs) - startOfDay(fromMs)) / DAY_MS);
}

function parseDay(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function touchStreak(s: Streak, now: number): Streak {
  const today = dayKey(now);
  if (s.lastDay === today) return s;
  const gap = s.lastDay ? daysBetween(parseDay(s.lastDay), now) : null;
  const count = gap === 1 ? s.count + 1 : 1;
  return { count, best: Math.max(s.best, count), lastDay: today };
}

export function currentStreak(s: Streak, now: number): number {
  if (!s.lastDay) return 0;
  return daysBetween(parseDay(s.lastDay), now) <= 1 ? s.count : 0;
}

export function recentExamAverage(attempts: ExamAttempt[], n = 3): number {
  const done = attempts
    .filter((a) => a.finishedAt !== null)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
    .slice(0, n);
  if (!done.length) return 0;
  const ratios = done.map((a) =>
    a.questionIds.length ? a.answers.filter((x) => x.correct).length / a.questionIds.length : 0,
  );
  return ratios.reduce((s, r) => s + r, 0) / ratios.length;
}

export function readiness(i: { lessonsRead: number; totalLessons: number; quizAccuracy: number; examAvg: number }): number {
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const coverage = i.totalLessons > 0 ? i.lessonsRead / i.totalLessons : 0;
  return Math.round(100 * (0.4 * clamp(coverage) + 0.3 * clamp(i.quizAccuracy) + 0.3 * clamp(i.examAvg)));
}
