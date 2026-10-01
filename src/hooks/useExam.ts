import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getBundle } from '../content/loader';
import { completeAnswers, remainingMs } from '../logic/exam';
import { addQuestionTime } from '../logic/examTime';
import { useProgress } from '../store/progress';
import type { ExamAttempt } from '../types';

const stamp = (): number => Date.now();
type Tracking = { owner: symbol; attemptId: string; questionId: number; enteredAt: number };
let tracking: Tracking | null = null;

export function flushExamQuestionTime(attemptId: string, stop = false, now = stamp()): void {
  const interval = tracking;
  if (!interval || interval.attemptId !== attemptId) return;
  tracking = stop ? null : { ...interval, enteredAt: now };
  const store = useProgress.getState();
  const current = store.active;
  if (!current || current.id !== attemptId) return;
  const updated = addQuestionTime(current, interval.questionId, interval.enteredAt, now);
  if (updated !== current) store.setActive(updated);
}

export function useExamQuestionTime(attemptId: string | undefined, questionId: number | undefined): void {
  useFocusEffect(useCallback(() => {
    if (!attemptId || questionId === undefined) return;
    const owner = Symbol('exam-question');
    const start = () => {
      const current = useProgress.getState().active;
      if (!current || current.id !== attemptId || current.questionIds[current.cursor ?? 0] !== questionId) return;
      if (tracking) flushExamQuestionTime(tracking.attemptId, true);
      tracking = { owner, attemptId, questionId, enteredAt: stamp() };
    };
    const stop = () => {
      if (tracking?.owner === owner) flushExamQuestionTime(attemptId, true);
    };
    if (AppState.currentState !== 'background' && AppState.currentState !== 'inactive') start();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
      else stop();
    });
    return () => { listener.remove(); stop(); };
  }, [attemptId, questionId]));
}

export function useSubmitExam() {
  const router = useRouter();
  return useCallback((attempt: ExamAttempt) => {
    const now = stamp();
    flushExamQuestionTime(attempt.id, true, now);
    const store = useProgress.getState();
    const current = store.active;
    if (!current || current.id !== attempt.id) return;
    const bundle = getBundle(current.lang);
    const flags = new Set(current.flags ?? []);
    const filled = completeAnswers(bundle, current.questionIds, current.answers).map((a) => ({
      ...a, timeMs: current.spent?.[a.questionId] ?? 0, flagged: flags.has(a.questionId),
    }));
    const done: ExamAttempt = { ...current, answers: filled, finishedAt: now };
    store.finishExam(done);
    for (const a of filled) store.feedMistake(bundle.questions[a.questionId], a.correct);
    router.dismissAll();
    router.push(`/exams/result/${done.id}`);
  }, [router]);
}

export function useExamClock(attempt: ExamAttempt | null): number {
  const submit = useSubmitExam();
  const [now, setNow] = useState(stamp);
  useEffect(() => {
    const tick = () => setNow(stamp());
    const timer = setInterval(tick, 1000);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') tick(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, []);
  const remaining = attempt ? Math.min(attempt.limitMs, remainingMs(attempt.startedAt, attempt.limitMs, now)) : 1;
  useEffect(() => {
    if (attempt && remaining === 0) submit(attempt);
  }, [attempt, remaining, submit]);
  return remaining;
}
