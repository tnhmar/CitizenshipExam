import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { Bar } from '../../../src/components/Bar';
import { Panel } from '../../../src/components/Panel';
import { QuestionCard } from '../../../src/components/QuestionCard';
import { Screen } from '../../../src/components/Screen';
import { useBundle } from '../../../src/content/useBundle';
import { useExamClock } from '../../../src/hooks/useExam';
import { deviceLang } from '../../../src/i18n';
import { createAttempt } from '../../../src/logic/exam';
import { isCorrect, present } from '../../../src/logic/quiz';
import { formatClock } from '../../../src/logic/stats';
import { useProgress } from '../../../src/store/progress';
import { useSettings } from '../../../src/store/settings';
import { palette } from '../../../src/theme';
import type { Answer } from '../../../src/types';

export default function ExamScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const bundle = useBundle();
  const lang = useSettings((s) => s.lang) ?? deviceLang();
  const active = useProgress((s) => s.active);
  const setActive = useProgress((s) => s.setActive);
  const entered = useRef(0);
  const created = useRef(false);

  const exam = bundle.exams.find((e) => e.id === Number(examId));
  const attempt = active && exam && active.examId === exam.id ? active : null;
  const presented = useMemo(
    () => (attempt ? attempt.questionIds.map((id) => present(bundle.questions[id], attempt.seed)) : []),
    [attempt, bundle],
  );
  const remaining = useExamClock(attempt);

  useEffect(() => {
    entered.current = Date.now();
  }, []);

  useEffect(() => {
    if (attempt) {
      created.current = true;
      return;
    }
    if (exam && !created.current) {
      created.current = true;
      setActive(createAttempt(exam, lang, Date.now(), exam.durationMin));
    }
  }, [exam, attempt, lang, setActive]);

  if (!exam || !attempt || presented.length === 0) return null;

  const idx = Math.min(attempt.cursor ?? 0, presented.length - 1);
  const p = presented[idx];
  const flags = attempt.flags ?? [];
  const given = attempt.answers.find((a) => a.questionId === p.question.id);
  const flagged = flags.includes(p.question.id);
  const low = remaining < 300000;

  const go = (n: number) => {
    const qid = attempt.questionIds[idx];
    const spent = { ...(attempt.spent ?? {}), [qid]: (attempt.spent?.[qid] ?? 0) + (Date.now() - entered.current) };
    entered.current = Date.now();
    setActive({ ...attempt, cursor: n, spent });
  };

  const select = (i: number) => {
    const ans: Answer = { questionId: p.question.id, conceptId: p.question.conceptId, chosen: i, correct: isCorrect(p, i), timeMs: 0, flagged: false };
    setActive({ ...attempt, answers: [...attempt.answers.filter((a) => a.questionId !== ans.questionId), ans] });
  };

  const toggleFlag = () =>
    setActive({ ...attempt, flags: flagged ? flags.filter((x) => x !== p.question.id) : [...flags, p.question.id] });

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
      <Panel tone={low ? 'danger' : 'default'}>
        <View style={styles.top}>
          <Text variant='headlineSmall' style={{ fontWeight: '700', color: low ? palette.danger : undefined }}>
            {`⏱ ${formatClock(remaining)}`}
          </Text>
          <Text variant='labelLarge'>{t('learn.question', { current: idx + 1, total: presented.length })}</Text>
        </View>
        <Bar value={attempt.answers.length / presented.length} />
        <Text variant='bodySmall'>{t('examUi.answered', { n: attempt.answers.length, total: presented.length })}</Text>
      </Panel>

      <View style={styles.grid}>
        {attempt.questionIds.map((qid, i) => {
          const answered = attempt.answers.some((a) => a.questionId === qid);
          const isFlagged = flags.includes(qid);
          return (
            <Pressable
              key={qid}
              accessibilityRole='button'
              accessibilityLabel={`${i + 1}`}
              onPress={() => go(i)}
              style={[
                styles.dot,
                {
                  borderColor: i === idx ? theme.colors.primary : isFlagged ? palette.warning : theme.colors.outline,
                  borderWidth: i === idx ? 3 : 1.5,
                  backgroundColor: answered ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              <Text style={{ color: answered ? theme.colors.onPrimary : theme.colors.onSurface, fontWeight: '600' }}>{i + 1}</Text>
              {isFlagged ? <Text style={styles.flag}>⚑</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <QuestionCard presented={p} selected={given?.chosen ?? null} reveal={false} onSelect={select} />

      <View style={styles.row}>
        <Button mode='outlined' disabled={idx === 0} onPress={() => go(idx - 1)}>
          {t('exams.previous')}
        </Button>
        <Button mode={flagged ? 'contained' : 'outlined'} buttonColor={flagged ? palette.warning : undefined} onPress={toggleFlag}>
          {`⚑ ${flagged ? t('exams.unflag') : t('exams.flag')}`}
        </Button>
        <Button mode='outlined' disabled={idx + 1 >= presented.length} onPress={() => go(idx + 1)}>
          {t('exams.next')}
        </Button>
      </View>

      <Button mode='contained' contentStyle={styles.cta} onPress={() => router.push('/exams/summary')}>
        {t('exams.finish')}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  flag: { position: 'absolute', top: -8, right: -4, fontSize: 14, color: '#ED6C02' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cta: { paddingVertical: 6 },
});
