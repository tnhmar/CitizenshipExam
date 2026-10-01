import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Button, Dialog, Menu, Portal, ProgressBar, Text, useTheme } from 'react-native-paper';
import { QuestionCard } from '../../../src/components/QuestionCard';
import { Screen } from '../../../src/components/Screen';
import { ScoreRing } from '../../../src/components/ScoreRing';
import { REVIEW_SESSION_SIZE } from '../../../src/config';
import { useBundle } from '../../../src/content/useBundle';
import { isCorrect, present } from '../../../src/logic/quiz';
import { buildDeck, nextDueAfter, type DeckKind } from '../../../src/logic/review';
import { shuffleSeeded } from '../../../src/logic/shuffle';
import { gradeFrom } from '../../../src/logic/srs';
import { formatClock } from '../../../src/logic/stats';
import { useProgress } from '../../../src/store/progress';
import { useSettings } from '../../../src/store/settings';
import type { Grade } from '../../../src/types';

type Mode = 'quiz' | 'flash';
const ZERO = { know: 0, guess: 0, unknown: 0 };

export default function ReviewSession() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { deck } = useLocalSearchParams<{ deck: string }>();
  const bundle = useBundle();
  const reduce = useSettings((s) => s.reduceMotion);
  const review = useProgress((s) => s.review);
  const glossaryDeck = deck === 'flashcards';

  const [seed] = useState(() => Date.now());
  const [ids, setIds] = useState<number[]>(() =>
    glossaryDeck
      ? shuffleSeeded(
          bundle.glossary.map((g) => g.id),
          seed,
        ).slice(0, REVIEW_SESSION_SIZE)
      : buildDeck(deck as DeckKind, bundle, Object.values(useProgress.getState().cards), Date.now(), REVIEW_SESSION_SIZE, seed),
  );
  const [round, setRound] = useState(0);
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<Mode>(glossaryDeck ? 'flash' : 'quiz');
  const [pick, setPick] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [guessing, setGuessing] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState(ZERO);
  const [missed, setMissed] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [nextDue, setNextDue] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const [quit, setQuit] = useState(false);
  const startedAt = useRef(0);
  const [flip] = useState(() => new Animated.Value(0));

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const qid = ids[idx];
  const q = glossaryDeck ? undefined : bundle.questions[qid];
  const term = glossaryDeck ? bundle.glossary.find((g) => g.id === qid) : undefined;
  const p = useMemo(() => (q ? present(q, seed + round * 1000 + idx) : null), [q, seed, round, idx]);

  const resetItem = () => {
    setPick(null);
    setRevealed(false);
    setGuessing(false);
    setFlipped(false);
    flip.setValue(0);
  };

  const record = (g: Grade) => {
    if (q) review(q, g);
    setStats((s) => ({ ...s, [g]: s[g] + 1 }));
    if (g === 'unknown') setMissed((m) => [...m, qid]);
  };

  const advance = () => {
    if (idx + 1 >= ids.length) {
      setElapsed(Date.now() - startedAt.current);
      setNextDue(nextDueAfter(Object.values(useProgress.getState().cards), Date.now()));
      setDone(true);
      return;
    }
    setIdx(idx + 1);
    resetItem();
  };

  const pickAnswer = (i: number) => {
    if (!p) return;
    setPick(i);
    setRevealed(true);
    record(gradeFrom(isCorrect(p, i), guessing ? 'guess' : 'know'));
  };

  const dontKnow = () => {
    setRevealed(true);
    record('unknown');
  };

  const doFlip = () => {
    Animated.timing(flip, { toValue: flipped ? 0 : 1, duration: reduce ? 0 : 400, useNativeDriver: true }).start();
    setFlipped(!flipped);
  };

  const grade = (g: Grade) => {
    record(g);
    advance();
  };

  const redo = () => {
    setIds(missed);
    setMissed([]);
    setRound((r) => r + 1);
    setIdx(0);
    setStats(ZERO);
    setDone(false);
    resetItem();
    startedAt.current = Date.now();
  };

  if (ids.length === 0) {
    return (
      <Screen>
        <Text variant='bodyLarge'>{t('review.empty')}</Text>
        <Button mode='contained' onPress={() => router.back()}>
          {t('review.done')}
        </Button>
      </Screen>
    );
  }

  if (done) {
    const total = stats.know + stats.guess + stats.unknown;
    return (
      <Screen>
        <Text variant='titleLarge'>{t('review.summaryTitle')}</Text>
        <View style={styles.center}>
          <ScoreRing value={total ? (stats.know * 100) / total : 0} label={`${stats.know}/${total}`} />
        </View>
        <Text variant='bodyLarge'>{t('review.time', { time: formatClock(elapsed) })}</Text>
        <Text variant='bodyLarge'>{t('review.stats', stats)}</Text>
        {glossaryDeck ? null : (
          <Text variant='bodyMedium'>{nextDue ? t('review.nextReview', { date: new Date(nextDue).toLocaleDateString() }) : t('review.noNext')}</Text>
        )}
        {missed.length > 0 ? (
          <Button mode='outlined' onPress={redo}>
            {t('review.redoMissed')}
          </Button>
        ) : null}
        <Button mode='contained' onPress={() => router.back()}>
          {t('review.done')}
        </Button>
      </Screen>
    );
  }

  const front = term ? term.term : (q?.text ?? '');
  const back = term ? term.definition : p ? `${p.options[p.correctIndex]}${q?.explanation ? `\n\n${q.explanation}` : ''}` : '';
  const frontRot = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRot = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const last = idx + 1 >= ids.length;

  return (
    <Screen>
      <View style={styles.top}>
        <Text variant='labelLarge'>{t('review.progress', { current: idx + 1, total: ids.length })}</Text>
        <Menu visible={menu} onDismiss={() => setMenu(false)} anchor={<Button accessibilityLabel={t('review.changeMode')} onPress={() => setMenu(true)}>⋮</Button>}>
          {glossaryDeck ? null : (
            <Menu.Item
              title={mode === 'quiz' ? t('review.modeFlash') : t('review.modeQuiz')}
              onPress={() => {
                setMenu(false);
                setMode(mode === 'quiz' ? 'flash' : 'quiz');
                setFlipped(false);
                flip.setValue(0);
              }}
            />
          )}
          <Menu.Item
            title={t('review.quit')}
            onPress={() => {
              setMenu(false);
              setQuit(true);
            }}
          />
        </Menu>
      </View>
      <ProgressBar progress={idx / ids.length} />

      {mode === 'quiz' && p ? (
        <View style={styles.block}>
          <QuestionCard presented={p} selected={pick} reveal={revealed} onSelect={pickAnswer} />
          {revealed ? (
            <Button mode='contained' onPress={advance}>
              {last ? t('learn.finish') : t('learn.next')}
            </Button>
          ) : (
            <View style={styles.row}>
              <Button mode={guessing ? 'contained' : 'outlined'} onPress={() => setGuessing(!guessing)}>
                {guessing ? t('review.guessingOn') : t('review.guessing')}
              </Button>
              <Button mode='outlined' onPress={dontKnow}>
                {t('review.dontKnow')}
              </Button>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.block}>
          <Text variant='bodySmall'>{t('review.flipHint')}</Text>
          <Pressable accessibilityRole='button' onPress={doFlip} style={styles.cardBox}>
            <Animated.View style={[styles.face, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline, backfaceVisibility: 'hidden', transform: [{ perspective: 1000 }, { rotateY: frontRot }] }]}>
              <Text variant='titleLarge'>{front}</Text>
            </Animated.View>
            <Animated.View style={[styles.face, { backgroundColor: theme.colors.secondaryContainer, borderColor: theme.colors.outline, backfaceVisibility: 'hidden', transform: [{ perspective: 1000 }, { rotateY: backRot }] }]}>
              <Text variant='bodyLarge'>{back}</Text>
            </Animated.View>
          </Pressable>
          {flipped ? (
            <View style={styles.row}>
              <Button mode='outlined' onPress={() => grade('unknown')}>
                {t('review.dontKnow')}
              </Button>
              <Button mode='outlined' onPress={() => grade('guess')}>
                {t('review.guessed')}
              </Button>
              <Button mode='contained' onPress={() => grade('know')}>
                {t('review.know')}
              </Button>
            </View>
          ) : null}
        </View>
      )}

      <Portal>
        <Dialog visible={quit} onDismiss={() => setQuit(false)}>
          <Dialog.Title>{t('review.quitTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('review.quitBody')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setQuit(false)}>{t('common.cancel')}</Button>
            <Button onPress={() => router.back()}>{t('review.quit')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  block: { gap: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  center: { alignItems: 'center' },
  cardBox: { minHeight: 240 },
  face: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1.5, borderRadius: 16, padding: 20, justifyContent: 'center' },
});
