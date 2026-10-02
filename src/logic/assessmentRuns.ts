import type { AssessmentContext } from './assessmentCapture';
import type { AssessmentEvent } from './learningStats';

export function assessmentRunId(scope: 'quiz' | 'review', at: number, nonce: string): string {
  return JSON.stringify([scope, at, nonce]);
}
export function quizResponseContext(sessionId: string, assessmentKey: string | undefined, questionId: number, at: number, retry: AssessmentEvent['retry']): AssessmentContext | null {
  const mode = assessmentKey === undefined ? 'bookmark' : /^lesson:[1-9]\d*$/.test(assessmentKey) ? 'lesson' : /^chapter:[1-9]\d*$/.test(assessmentKey) ? 'chapter' : null;
  if (mode === null) return null;
  return { sessionId, stepId: `question:${questionId}`, at, mode, response: 'objective', firstResponse: true, retry, confidence: null };
}
export function reviewResponseContext(sessionId: string, round: number, step: number, at: number, response: AssessmentEvent['response'], correct: boolean, confidence: AssessmentEvent['confidence'], firstResponse = true): AssessmentContext {
  return { sessionId: `${sessionId}:round:${round}`, stepId: String(step), at, mode: 'review', response, correct, firstResponse, retry: round === 0 ? 'none' : 'missed', confidence };
}

export function reviewExposureContext(sessionId: string, round: number, step: number, at: number): AssessmentContext {
  // Non-objective, unscored exposure; never interpret correct as a graded answer.
  const context = reviewResponseContext(sessionId, round, step, at, 'selfReport', false, null, false);
  return { ...context, stepId: `exposure:${step}:${at}` };
}
