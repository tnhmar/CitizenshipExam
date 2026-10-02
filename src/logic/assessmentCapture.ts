import type { ContentBundle, ExamAttempt, Question } from '../types';
import { appendAssessmentEvent, initialAssessmentHistory, type AssessmentEvent, type AssessmentHistory } from './learningStats';

export interface AssessmentContext {
  sessionId: string;
  stepId: string;
  at: number;
  mode: AssessmentEvent['mode'];
  response: AssessmentEvent['response'];
  firstResponse: boolean;
  retry: AssessmentEvent['retry'];
  confidence: AssessmentEvent['confidence'];
  correct?: boolean;
}
export function historyData(h: AssessmentHistory): AssessmentHistory {
  return { assessmentEvents: h.assessmentEvents, assessmentHistoryStartedAt: h.assessmentHistoryStartedAt, assessmentHistoryTruncatedBefore: h.assessmentHistoryTruncatedBefore };
}
export function captureQuestionResponse(h: AssessmentHistory, bundle: ContentBundle, q: Question, correct: boolean, context: AssessmentContext): AssessmentHistory {
  const history = historyData(h);
  const expected = bundle.questions[q.id];
  if (!expected || expected.conceptId !== q.conceptId || typeof context.stepId !== 'string' || !context.stepId.length) return history;
  return appendAssessmentEvent(history, { id: JSON.stringify([context.sessionId, context.stepId, q.id]), sessionId: context.sessionId, questionId: q.id, conceptId: q.conceptId, at: context.at, mode: context.mode, response: context.response, correct, firstResponse: context.firstResponse, retry: context.retry, confidence: context.confidence });
}
export function captureExamSelections(previous: ExamAttempt | null, next: ExamAttempt | null, bundle: ContentBundle, h: AssessmentHistory, now: number): AssessmentHistory {
  let history = historyData(h);
  if (!previous || !next || previous.id !== next.id || previous.lang !== next.lang || previous.finishedAt !== null || next.finishedAt !== null || next.limitMs <= 0) return history;
  const exam = bundle.exams.find((e) => e.id === next.examId);
  if (!exam) return history;
  const before = new Map(previous.answers.map((a) => [a.questionId, a]));
  const allowed = new Set(previous.questionIds.filter((id) => next.questionIds.includes(id)));
  for (const answer of next.answers) {
    if (answer.chosen === null || !allowed.has(answer.questionId)) continue;
    const q = bundle.questions[answer.questionId]; if (!q || q.conceptId !== answer.conceptId || !Number.isSafeInteger(answer.chosen) || answer.chosen < 0 || answer.chosen >= q.options.length) continue;
    const old = before.get(answer.questionId);
    if (old && old.chosen === answer.chosen && old.correct === answer.correct) continue;
    const sessionId = `exam:${next.id}`;
    const firstId = JSON.stringify([sessionId, 'first', q.id]);
    const firstResponse = (!old || old.chosen === null) && !history.assessmentEvents.some((e) => e.id === firstId);
    history = captureQuestionResponse(history, bundle, q, answer.correct, { sessionId, stepId: firstResponse ? 'first' : `change:${now}:${answer.chosen}`, at: now, mode: exam.kind === 'mock' ? 'mock' : 'practiceExam', response: 'objective', firstResponse, retry: 'none', confidence: null });
  }
  return history;
}
export function migrateCapturedProgress<T extends object>(initial: T, legacy: Partial<T>): T & AssessmentHistory {
  return { ...initial, ...legacy, ...initialAssessmentHistory() };
}
