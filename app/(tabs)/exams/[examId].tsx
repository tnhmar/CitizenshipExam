import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { QuestionCard } from '../../../src/components/QuestionCard';
import { Screen } from '../../../src/components/Screen';
import { useBundle } from '../../../src/content/useBundle';
import { deviceLang } from '../../../src/i18n';
import { completeAnswers, createAttempt, remainingMs } from '../../../src/logic/exam';
import { isCorrect, present } from '../../../src/logic/quiz';
import { formatClock } from '../../../src/logic/stats';
import { useProgress } from '../../../src/store/progress';
import { useSettings } from '../../../src/store/settings';
import type { Answer, ExamAttempt } from '../../../src/types';

export default function ExamScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const bundle = useBundle();
  const lang = useSettings((s) => s.lang) ?? deviceLang();
  const active = useProgress((s) => s.active);
  const setActive = useProgress((s) => s.setActive);
  const finishExam = useProgress((s) => s.finishExam);
  const feedMistake = useProgress((s) => s.feedMistake);

  const [idx, setIdx] = useState(0);
  const [flags, setFlags] = useState<number[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const spent = useRef<Record<number, number>>({});
  const entered = useRef(0);
  const submitted = useRef(false);

  const exam = bundle.exams.find((e) => e.id === Number(examId));
  const attempt = active && exam && active.examId === exam.id ? active : null;
  const presented = useMemo(
    () => (attempt ? attempt.questionIds.map((id) => present(bundle.questions[id], attempt.seed)) : []),
    [attempt, bundle],
  );

  useEffect(() => {
    entered.current = Date.now();
  }, []);

  useEffect(() => {
    if (exam && !attempt && !submitted.current) setActive(createAttempt(exam, lang, Date.now(), exam.durationMin));
  }, [exam, attempt, lang, setActive]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const commitTime = () => {
    if (!attempt) return;
    const qid = attempt.questionIds[idx];
    spent.current[qid] = (spent.current[qid] ?? 0) + (Date.now() - entered.current);
    entered.current = Date.now();
  };

  const submit = () => {
    if (!attempt || submitted.current) return;
    submitted.current = true;
    commitTime();
    const filled = completeAnswers(bundle, attempt.questionIds, attempt.answers).map((a) => ({ ...a, timeMs: spent.current[a.questionId] ?? 0 }));
    const done: ExamAttempt = { ...attempt, answers: filled, finishedAt: Date.now() };
    finishExam(done);
    for (const a of filled) feedMistake(bundle.questions[a.questionId], a.correct);
    router.replace(`/exams/result/${done.id}`);
  };

  const remaining = attempt ? remainingMs(attempt.startedAt, attempt.limitMs, now) : 1;
  useEffect(() => {
    if (attempt && remaining === 0) submit();
  });

  if (!exam || !attempt || presented.length === 0) return null;

  const p = presented[idx];
  const given = attempt.answers.find((a) => a.questionId === p.question.id);
  const unanswered = attempt.questionIds.length - attempt.answers.length;
  const flagged = flags.includes(p.question.id);

  const go = (n: number) => {
    commitTime();
    setIdx(n);
  };

  const select = (i: number) => {
    const ans: Answer = { questionId: p.question.id, conceptId: p.question.conceptId, chosen: i, correct: isCorrect(p, i), timeMs: 0, flagged: false };
    setActive({ ...attempt, answers: [...attempt.answers.filter((a) => a.questionId !== ans.questionId), ans] });
  };

  const toggleFlag = () => setFlags((f) => (flagged ? f.filter((x) => x !== p.question.id) : [...f, p.question.id]));

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: exam.title,
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable accessibilityRole='button' accessibilityLabel={t('exams.leave')} onPress={() => router.back()}>
              <Text style={{ fontSize: 20 }}>✕</Text>
            </Pressable>
          ),
        }}
      />
      <View style={styles.top}>
        <Text variant='titleMedium' style={remaining < 300000 ? { color: theme.colors.error } : undefined}>
          {`⏱ ${t('exams.timeLeft', { time: formatClock(remaining) })}`}
        </Text>
        <Text variant='labelLarge'>{t('learn.question', { current: idx + 1, total: presented.length })}</Text>
      </View>
      <View style={styles.grid}>
        {attempt.questionIds.map((qid, i) => {
          const answered = attempt.answers.some((a) => a.questionId === qid);
          return (
            <Pressable
              key={qid}
              accessibilityRole='button'
              accessibilityLabel={`${i + 1}`}
              onPress={() => go(i)}
              style={[styles.dot, { borderColor: i === idx ? theme.colors.primary : theme.colors.outline, backgroundColor: answered ? theme.colors.primaryContainer : 'transparent' }]}
            >
              <Text>{flags.includes(qid) ? '⚑' : i + 1}</Text>
            </Pressable>
          );
        })}
      </View>
      <QuestionCard presented={p} selected={given?.chosen ?? null} reveal={false} onSelect={select} />
      <View style={styles.row}>
        <Button mode='outlined' disabled={idx === 0} onPress={() => go(idx - 1)}>
          {t('exams.previous')}
        </Button>
        <Button mode='outlined' onPress={toggleFlag}>
          {flagged ? t('exams.unflag') : t('exams.flag')}
        </Button>
        <Button mode='outlined' disabled={idx + 1 >= presented.length} onPress={() => go(idx + 1)}>
          {t('exams.next')}
        </Button>
      </View>
      <Button mode='contained' onPress={() => setConfirm(true)}>
        {t('exams.finish')}
      </Button>
      <Portal>
        <Dialog visible={confirm} onDismiss={() => setConfirm(false)}>
          <Dialog.Title>{t('exams.confirmTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>{unanswered > 0 ? t('exams.confirmBody', { count: unanswered }) : t('exams.allAnswered')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirm(false)}>{t('common.cancel')}</Button>
            <Button onPress={submit}>{t('exams.finish')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dot: { width: 34, height: 34, borderWidth: 1.5, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
});
