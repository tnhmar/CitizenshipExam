import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useBundle } from '../content/useBundle';
import { isCorrect, present } from '../logic/quiz';
import { useProgress } from '../store/progress';
import { useSettings } from '../store/settings';
import { palette, tints } from '../theme';
import { Bar } from './Bar';
import { Panel } from './Panel';
import { QuestionCard } from './QuestionCard';
import { ScoreRing } from './ScoreRing';
import { StatCard } from './StatCard';
import { StudyScreen } from './StudyScreen';

interface Props {
  questionIds: number[];
  onComplete?: (r: { correct: number; total: number }) => void;
}

const stamp = (): number => Date.now();

export function QuizRunner({ questionIds, onComplete }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const bundle = useBundle();
  const reduce = useSettings((s) => s.reduceMotion);
  const feedMistake = useProgress((s) => s.feedMistake);
  const [ids, setIds] = useState(questionIds);
  const [seed, setSeed] = useState(stamp);
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [fullRun, setFullRun] = useState(true);
  const [fade] = useState(() => new Animated.Value(1));
  const answered = useRef(new Set<number>());
  const advanced = useRef(new Set<number>());
  const finished = useRef(false);
  const presented = useMemo(() => ids.map((id) => present(bundle.questions[id], seed)), [ids, bundle, seed]);

  useEffect(() => {
    fade.stopAnimation();
    if (reduce) {
      fade.setValue(1);
      return;
    }
    fade.setValue(0);
    const animation = Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [idx, seed, reduce, fade]);

  const restart = (nextIds: number[], isFull: boolean) => {
    answered.current.clear();
    advanced.current.clear();
    finished.current = false;
    setIds(nextIds);
    setSeed(stamp());
    setIdx(0);
    setPicks({});
    setRevealed(false);
    setDone(false);
    setFullRun(isFull);
  };

  if (presented.length === 0) {
    return (
      <StudyScreen footer={<Button onPress={() => router.back()}>{t('learn.done')}</Button>}>
        <Text>{t('learn.noQuiz')}</Text>
      </StudyScreen>
    );
  }

  const correctSoFar = presented.filter((p) => isCorrect(p, picks[p.question.id] ?? null)).length;
  const successColor = theme.dark ? '#8DCB91' : palette.success;
  const dangerColor = theme.dark ? '#FFB4AB' : palette.danger;
  const warningColor = theme.dark ? '#FFBB73' : palette.warning;
  const solid = theme.dark ? tints.dark : tints.light;

  if (done) {
    const wrong = presented.filter((p) => !isCorrect(p, picks[p.question.id] ?? null));
    const correct = presented.length - wrong.length;
    const pct = (correct * 100) / presented.length;
    const tier = pct >= 80 ? 'quiz.tierHigh' : pct >= 60 ? 'quiz.tierMid' : 'quiz.tierLow';
    const tint = pct >= 80 ? successColor : pct >= 60 ? warningColor : dangerColor;
    return (
      <StudyScreen
        scrollKey={`results-${seed}`}
        footer={
          <>
            {wrong.length > 0 ? (
              <Button mode='contained' buttonColor={theme.colors.secondary} textColor={theme.colors.onSecondary} onPress={() => restart(wrong.map((p) => p.question.id), false)}>
                {t('learn.retryMissed')}
              </Button>
            ) : null}
            <View style={styles.actions}>
              <Button mode='outlined' style={styles.grow} onPress={() => restart(questionIds, true)}>
                {t('learn.restart')}
              </Button>
              <Button style={styles.grow} onPress={() => router.back()}>{t('learn.done')}</Button>
            </View>
          </>
        }
      >
        <Panel style={styles.center}>
          <Text variant='titleLarge'>{t('learn.results')}</Text>
          <ScoreRing value={pct} size={150} color={tint} label={`${correct}/${presented.length}`} />
          <Text variant='titleMedium' style={{ color: tint, textAlign: 'center' }}>{t(tier)}</Text>
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
              <Text variant='bodyLarge' style={styles.strong}>{p.question.text}</Text>
              <Text variant='bodyMedium' style={{ color: dangerColor }}>{`✗ ${t('learn.yourAnswer', { answer: pick === undefined ? t('learn.noAnswer') : p.options[pick] })}`}</Text>
              <Text variant='bodyMedium' style={{ color: successColor }}>{`✓ ${t('learn.correctAnswer', { answer: p.options[p.correctIndex] })}`}</Text>
              {p.question.explanation ? <Text variant='bodySmall'>{`💡 ${p.question.explanation}`}</Text> : null}
            </Panel>
          );
        })}
      </StudyScreen>
    );
  }

  const current = presented[idx];
  const pick = picks[current.question.id];
  const last = idx + 1 === presented.length;

  const select = (i: number) => {
    if (finished.current || answered.current.has(current.question.id)) return;
    answered.current.add(current.question.id);
    setPicks((p) => ({ ...p, [current.question.id]: i }));
    setRevealed(true);
    feedMistake(current.question, isCorrect(current, i));
  };

  const next = () => {
    if (!revealed || finished.current || advanced.current.has(idx)) return;
    advanced.current.add(idx);
    if (last) {
      finished.current = true;
      setDone(true);
      if (fullRun) onComplete?.({ correct: correctSoFar, total: presented.length });
      return;
    }
    setIdx(idx + 1);
    setRevealed(false);
  };

  return (
    <StudyScreen
      scrollKey={`question-${seed}-${idx}`}
      top={
        <>
          <View style={styles.header}>
            <Text variant='labelLarge'>{t('learn.question', { current: idx + 1, total: presented.length })}</Text>
            <View style={[styles.pill, { backgroundColor: solid.success }]}>
              <Text variant='labelMedium' style={{ color: successColor }}>{`✓ ${t('quiz.scoreSoFar', { count: correctSoFar })}`}</Text>
            </View>
          </View>
          <Bar value={(idx + (revealed ? 1 : 0)) / presented.length} height={10} />
        </>
      }
      footer={
        revealed ? (
          <Button mode='contained' contentStyle={styles.cta} buttonColor={theme.colors.secondary} textColor={theme.colors.onSecondary} onPress={next}>
            {last ? t('studyControls.results') : t('learn.next')}
          </Button>
        ) : (
          <Text variant='bodyMedium' style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>{t('studyControls.chooseAnswer')}</Text>
        )
      }
    >
      <Animated.View style={{ opacity: fade }}>
        <QuestionCard key={`${seed}-${current.question.id}`} presented={current} selected={pick ?? null} reveal={revealed} onSelect={select} />
      </Animated.View>
    </StudyScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grow: { flex: 1, minWidth: 120 },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  pill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  strong: { fontWeight: '600' },
  cta: { paddingVertical: 6 },
});
