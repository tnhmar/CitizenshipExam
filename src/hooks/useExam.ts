import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useBundle } from '../content/useBundle';
import { completeAnswers, remainingMs } from '../logic/exam';
import { useProgress } from '../store/progress';
import type { ExamAttempt } from '../types';

export function useSubmitExam() {
  const router = useRouter();
  const bundle = useBundle();
  return useCallback(
    (attempt: ExamAttempt) => {
      const store = useProgress.getState();
      const current = store.active;
      if (!current || current.id !== attempt.id) return;
      const spent = current.spent ?? {};
      const filled = completeAnswers(bundle, current.questionIds, current.answers).map((a) => ({ ...a, timeMs: spent[a.questionId] ?? 0 }));
      const done: ExamAttempt = { ...current, answers: filled, finishedAt: Date.now() };
      store.finishExam(done);
      for (const a of filled) store.feedMistake(bundle.questions[a.questionId], a.correct);
      router.dismissAll();
      router.push(`/exams/result/${done.id}`);
    },
    [bundle, router],
  );
}

export function useExamClock(attempt: ExamAttempt | null): number {
  const submit = useSubmitExam();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = attempt ? remainingMs(attempt.startedAt, attempt.limitMs, now) : 1;
  useEffect(() => {
    if (attempt && remaining === 0) submit(attempt);
  });
  return remaining;
}
