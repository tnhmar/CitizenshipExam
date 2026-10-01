import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, View } from 'react-native';
import { Button, ProgressBar, Text } from 'react-native-paper';
import { useBundle } from '../content/useBundle';
import { isCorrect, present } from '../logic/quiz';
import { useProgress } from '../store/progress';
import { useSettings } from '../store/settings';
import { QuestionCard } from './QuestionCard';
import { ScoreRing } from './ScoreRing';

interface Props {
  questionIds: number[];
  mode: 'immediate' | 'deferred';
  onComplete?: (r: { correct: number; total: number }) => void;
}

export function QuizRunner({ questionIds, mode, onComplete }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const bundle = useBundle();
  const reduce = useSettings((s) => s.reduceMotion);
  const feedMistake = useProgress((s) => s.feedMistake);

  const [ids, setIds] = useState(questionIds);
  const [seed, setSeed] = useState(() => Date.now());
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

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

  const finish = () => {
    let correct = 0;
    for (const p of presented) {
      const ok = isCorrect(p, picks[p.question.id] ?? null);
      if (ok) correct += 1;
      if (mode === 'deferred') feedMistake(p.question, ok);
    }
    setDone(true);
    if (ids.length === questionIds.length) onComplete?.({ correct, total: presented.length });
  };

  if (done) {
    const wrong = presented.filter((p) => !isCorrect(p, picks[p.question.id] ?? null));
    const correct = presented.length - wrong.length;
    return (
      <View style={styles.wrap}>
        <Text variant='titleLarge'>{t('learn.results')}</Text>
        <View style={styles.center}>
          <ScoreRing value={(correct * 100) / presented.length} label={`${correct}/${presented.length}`} />
          {wrong.length === 0 ? <Text variant='titleMedium'>{t('learn.allCorrect')}</Text> : null}
        </View>
        {wrong.length > 0 ? <Text variant='titleMedium'>{t('learn.missed')}</Text> : null}
        {wrong.map((p) => {
          const pick = picks[p.question.id];
          return (
            <View key={p.question.id} style={styles.missed}>
              <Text variant='bodyLarge'>{p.question.text}</Text>
              <Text variant='bodyMedium'>{t('learn.yourAnswer', { answer: pick === undefined ? t('learn.noAnswer') : p.options[pick] })}</Text>
              <Text variant='bodyMedium'>{t('learn.correctAnswer', { answer: p.options[p.correctIndex] })}</Text>
              {p.question.explanation ? <Text variant='bodySmall'>{p.question.explanation}</Text> : null}
            </View>
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
  const canAdvance = mode === 'immediate' ? revealed : pick !== undefined;
  const last = idx + 1 === presented.length;

  const select = (i: number) => {
    setPicks((p) => ({ ...p, [current.question.id]: i }));
    if (mode === 'immediate') {
      setRevealed(true);
      feedMistake(current.question, isCorrect(current, i));
    }
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
      <Text variant='labelLarge'>{t('learn.question', { current: idx + 1, total: presented.length })}</Text>
      <ProgressBar progress={idx / presented.length} />
      <Animated.View style={{ opacity: fade }}>
        <QuestionCard presented={current} selected={pick ?? null} reveal={mode === 'immediate' && revealed} onSelect={select} />
      </Animated.View>
      <Button mode='contained' disabled={!canAdvance} onPress={next}>
        {last ? t('learn.finish') : t('learn.next')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  center: { alignItems: 'center', gap: 8 },
  missed: { gap: 4, paddingVertical: 8 },
});
