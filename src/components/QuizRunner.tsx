import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useBundle } from '../content/useBundle';
import { isCorrect, present } from '../logic/quiz';
import { useProgress } from '../store/progress';
import { useSettings } from '../store/settings';
import { palette } from '../theme';
import { Bar } from './Bar';
import { Panel } from './Panel';
import { QuestionCard } from './QuestionCard';
import { ScoreRing } from './ScoreRing';
import { StatCard } from './StatCard';

interface Props {
  questionIds: number[];
  onComplete?: (r: { correct: number; total: number }) => void;
}

export function QuizRunner({ questionIds, onComplete }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const bundle = useBundle();
  const reduce = useSettings((s) => s.reduceMotion);
  const feedMistake = useProgress((s) => s.feedMistake);

  const [ids, setIds] = useState(questionIds);
  const [seed, setSeed] = useState(() => Date.now());
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [fade] = useState(() => new Animated.Value(1));

  const presented = useMemo(() => ids.map((id) => present(bundle.questions[id], seed)), [ids, bundle, seed]);

  useEffect(() => {
    if (reduce) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [idx, reduce, fade]);

  if (presented.length === 0) return <Text>{t('learn.noQuiz')}</Text>;

  const restart = (nextIds: number[]) => {
    setIds(nextIds);
    setSeed(Date.now());
    setIdx(0);
    setPicks({});
    setRevealed(false);
    setDone(false);
  };

  const correctSoFar = presented.filter((p) => isCorrect(p, picks[p.question.id] ?? null)).length;

  const finish = () => {
    setDone(true);
    if (ids.length === questionIds.length) onComplete?.({ correct: correctSoFar, total: presented.length });
  };

  if (done) {
    const wrong = presented.filter((p) => !isCorrect(p, picks[p.question.id] ?? null));
    const correct = presented.length - wrong.length;
    const pct = (correct * 100) / presented.length;
    const tier = pct >= 80 ? 'quiz.tierHigh' : pct >= 60 ? 'quiz.tierMid' : 'quiz.tierLow';
    const tint = pct >= 80 ? palette.success : pct >= 60 ? palette.warning : palette.danger;
    return (
      <View style={styles.wrap}>
        <Panel style={styles.center}>
          <Text variant='titleLarge'>{t('learn.results')}</Text>
          <ScoreRing value={pct} size={150} color={tint} label={`${correct}/${presented.length}`} />
          <Text variant='titleMedium' style={{ color: tint, textAlign: 'center' }}>
            {t(tier)}
          </Text>
        </Panel>
        <View style={styles.row}>
          <StatCard icon='✓' value={String(correct)} label={t('quiz.correctLabel')} tone='success' />
          <StatCard icon='✗' value={String(wrong.length)} label={t('quiz.missedLabel')} tone={wrong.length ? 'danger' : 'default'} />
        </View>
        {wrong.length > 0 ? <Text variant='titleMedium'>{t('learn.missed')}</Text> : null}
        {wrong.map((p) => {
          const pick = picks[p.question.id];
          return (
            <Panel key={p.question.id}>
              <Text variant='bodyLarge' style={styles.strong}>
                {p.question.text}
              </Text>
              <Text variant='bodyMedium' style={{ color: palette.danger }}>{`✗ ${t('learn.yourAnswer', { answer: pick === undefined ? t('learn.noAnswer') : p.options[pick] })}`}</Text>
              <Text variant='bodyMedium' style={{ color: palette.success }}>{`✓ ${t('learn.correctAnswer', { answer: p.options[p.correctIndex] })}`}</Text>
              {p.question.explanation ? <Text variant='bodySmall'>{`💡 ${p.question.explanation}`}</Text> : null}
            </Panel>
          );
        })}
        {wrong.length > 0 ? (
          <Button mode='contained' onPress={() => restart(wrong.map((p) => p.question.id))}>
            {t('learn.retryMissed')}
          </Button>
        ) : null}
        <Button mode='outlined' onPress={() => restart(questionIds)}>
          {t('learn.restart')}
        </Button>
        <Button onPress={() => router.back()}>{t('learn.done')}</Button>
      </View>
    );
  }

  const current = presented[idx];
  const pick = picks[current.question.id];
  const last = idx + 1 === presented.length;

  const select = (i: number) => {
    setPicks((p) => ({ ...p, [current.question.id]: i }));
    setRevealed(true);
    feedMistake(current.question, isCorrect(current, i));
  };

  const next = () => {
    if (last) {
      finish();
      return;
    }
    setIdx(idx + 1);
    setRevealed(false);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text variant='labelLarge'>{t('learn.question', { current: idx + 1, total: presented.length })}</Text>
        <View style={[styles.pill, { backgroundColor: palette.successBg }]}>
          <Text variant='labelMedium' style={{ color: palette.success }}>{`✓ ${t('quiz.scoreSoFar', { count: correctSoFar })}`}</Text>
        </View>
      </View>
      <Bar value={(idx + (revealed ? 1 : 0)) / presented.length} height={10} />
      <Animated.View style={{ opacity: fade }}>
        <QuestionCard presented={current} selected={pick ?? null} reveal={revealed} onSelect={select} />
      </Animated.View>
      {revealed ? (
        <Button mode='contained' contentStyle={styles.cta} onPress={next} buttonColor={theme.colors.primary}>
          {last ? t('learn.finish') : t('learn.next')}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  center: { alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  strong: { fontWeight: '600' },
  cta: { paddingVertical: 6 },
});
