import type { ExamAttempt } from '../types';

export function addQuestionTime(attempt: ExamAttempt, questionId: number, enteredAt: number, leftAt: number): ExamAttempt {
  if (!attempt.questionIds.includes(questionId)) return attempt;
  const start = Math.max(attempt.startedAt, enteredAt);
  const end = Math.min(leftAt, attempt.startedAt + attempt.limitMs, attempt.finishedAt ?? Infinity);
  const elapsed = Math.max(0, end - start);
  if (elapsed === 0) return attempt;
  return {
    ...attempt,
    spent: { ...attempt.spent, [questionId]: (attempt.spent?.[questionId] ?? 0) + elapsed },
  };
}
