import type { ContentBundle, ExamAttempt, Question, SrsCard } from '../types';
import { byChapter } from './exam';
import { readiness, recentExamAverage } from './progress';

type Tally = { correct: number; total: number };

export function examChapterStats(bundle: ContentBundle, attempts: ExamAttempt[]): Record<number, Tally> {
  const out: Record<number, Tally> = {};
  for (const a of attempts) {
    if (a.finishedAt === null) continue;
    for (const [key, v] of Object.entries(byChapter(bundle, a.answers))) {
      const id = Number(key);
      const row = out[id] ?? { correct: 0, total: 0 };
      row.correct += v.correct;
      row.total += v.total;
      out[id] = row;
    }
  }
  return out;
}

export function mostMissed(bundle: ContentBundle, cards: SrsCard[], chapterId: number, n: number): Question[] {
  return cards
    .filter((c) => c.lapses > 0 && bundle.questions[c.questionId]?.chapterId === chapterId)
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, n)
    .map((c) => bundle.questions[c.questionId]);
}

function quizTotals(quizResults: Record<string, Tally>): Tally {
  let correct = 0;
  let total = 0;
  for (const q of Object.values(quizResults)) {
    correct += q.correct;
    total += q.total;
  }
  return { correct, total };
}

export function overallAccuracy(quizResults: Record<string, Tally>, attempts: ExamAttempt[]): number {
  const q = quizTotals(quizResults);
  let correct = q.correct;
  let total = q.total;
  for (const a of attempts) {
    if (a.finishedAt === null) continue;
    correct += a.answers.filter((x) => x.correct).length;
    total += a.questionIds.length;
  }
  return total > 0 ? correct / total : 0;
}

export function computeReadiness(
  bundle: ContentBundle,
  lessonsRead: Record<number, number>,
  quizResults: Record<string, Tally>,
  attempts: ExamAttempt[],
): number {
  const q = quizTotals(quizResults);
  return readiness({
    lessonsRead: Object.keys(lessonsRead).length,
    totalLessons: bundle.lessons.length,
    quizAccuracy: q.total > 0 ? q.correct / q.total : 0,
    examAvg: recentExamAverage(attempts, 3),
  });
}

export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  const h = Math.floor(minutes / 60);
  return h > 0 ? `${h} h ${minutes % 60} min` : `${minutes} min`;
}

export function formatClock(ms: number): string {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
