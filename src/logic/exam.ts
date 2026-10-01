import type { Answer, ContentBundle, Exam, ExamAttempt, Lang } from '../types';

export function requiredToPass(total: number, passMark: number, examSize: number): number {
  return total === examSize ? passMark : Math.ceil((total * passMark) / examSize);
}

export interface ExamSummary {
  score: number;
  total: number;
  wrong: number;
  unanswered: number;
  percent: number;
  required: number;
  passed: boolean;
}

export function summarize(answers: Answer[], total: number, passMark: number, examSize: number): ExamSummary {
  const score = answers.filter((a) => a.correct).length;
  const answered = answers.filter((a) => a.chosen !== null).length;
  const required = requiredToPass(total, passMark, examSize);
  return {
    score,
    total,
    wrong: answered - score,
    unanswered: total - answered,
    percent: total > 0 ? Math.round((score * 100) / total) : 0,
    required,
    passed: score >= required,
  };
}

export function remainingMs(startedAt: number, limitMs: number, now: number): number {
  return Math.max(0, startedAt + limitMs - now);
}

export function createAttempt(exam: Exam, lang: Lang, now: number, limitMin: number): ExamAttempt {
  return {
    id: `${exam.id}-${now}`,
    examId: exam.id,
    lang,
    seed: now % 2147483647,
    questionIds: [...exam.questionIds],
    startedAt: now,
    finishedAt: null,
    limitMs: limitMin * 60000,
    answers: [],
  };
}

export function completeAnswers(bundle: ContentBundle, questionIds: number[], answers: Answer[]): Answer[] {
  const given = new Map(answers.map((a) => [a.questionId, a]));
  return questionIds.map(
    (id) =>
      given.get(id) ?? {
        questionId: id,
        conceptId: bundle.questions[id]?.conceptId ?? '',
        chosen: null,
        correct: false,
        timeMs: 0,
        flagged: false,
      },
  );
}

export function byChapter(bundle: ContentBundle, answers: Answer[]): Record<number, { correct: number; total: number }> {
  const out: Record<number, { correct: number; total: number }> = {};
  for (const a of answers) {
    const chapterId = bundle.questions[a.questionId]?.chapterId ?? 0;
    const row = out[chapterId] ?? { correct: 0, total: 0 };
    row.total += 1;
    if (a.correct) row.correct += 1;
    out[chapterId] = row;
  }
  return out;
}

export function averageTimeMs(answers: Answer[]): number {
  const given = answers.filter((a) => a.chosen !== null);
  return given.length ? Math.round(given.reduce((s, a) => s + a.timeMs, 0) / given.length) : 0;
}
