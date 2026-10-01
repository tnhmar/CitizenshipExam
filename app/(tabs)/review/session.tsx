import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { Bar } from '../../../src/components/Bar';
import { BookmarkButton } from '../../../src/components/BookmarkButton';
import { Panel } from '../../../src/components/Panel';
import { QuestionCard } from '../../../src/components/QuestionCard';
import { ScoreRing } from '../../../src/components/ScoreRing';
import { StatCard } from '../../../src/components/StatCard';
import { StudyScreen } from '../../../src/components/StudyScreen';
import { REVIEW_SESSION_SIZE } from '../../../src/config';
import { useBundle } from '../../../src/content/useBundle';
import { claimReviewStep } from '../../../src/logic/bookmarks';
import { isCorrect, present } from '../../../src/logic/quiz';
import { buildDeck, nextDueAfter } from '../../../src/logic/review';
import { shuffleSeeded } from '../../../src/logic/shuffle';
import { gradeFrom } from '../../../src/logic/srs';
import { formatClock } from '../../../src/logic/stats';
import { useProgress } from '../../../src/store/progress';
import { palette } from '../../../src/theme';
import type { ContentBundle, Grade } from '../../../src/types';

const stamp = (): number => Date.now();
const ZERO = { know: 0, guess: 0, unknown: 0 };
export default function ReviewSession() {
  const bundle = useBundle();
  const { deck } = useLocalSearchParams<{ deck: string }>();
  return <Session key={`${bundle.lang}-${deck}`} bundle={bundle} deck={deck} />;
}
function Session({ bundle, deck }: { bundle: ContentBundle; deck: string }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const review = useProgress((s) => s.review);
  const glossary = deck === 'flashcards';
  const [seed] = useState(stamp);
  const [ids, setIds] = useState(() => glossary ? shuffleSeeded(bundle.glossary.map((g) => g.id), seed).slice(0, REVIEW_SESSION_SIZE) : buildDeck(deck === 'due' || deck === 'missed' ? deck : 'random', bundle, Object.values(useProgress.getState().cards), seed, REVIEW_SESSION_SIZE, seed));
  const [round, setRound] = useState(0);
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<'quiz' | 'flash'>(glossary ? 'flash' : 'quiz');
  const [pick, setPick] = useState<number | null>(null);
  const [graded, setGraded] = useState<Grade | null>(null);
  const [guessing, setGuessing] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState(ZERO);
  const [missed, setMissed] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [nextDue, setNextDue] = useState<number | null>(null);
  const [quit, setQuit] = useState(false);
  const seen = useRef(new Set<string>());
  const advanced = useRef(new Set<string>());
  const started = useRef<number | null>(null);
  const qid = ids[idx];
  const q = glossary ? undefined : bundle.questions[qid];
  const term = glossary ? bundle.glossary.find((g) => g.id === qid) : undefined;
  const p = useMemo(() => q ? present(q, seed + round * 1000 + idx) : null, [q, seed, round, idx]);
  const step = `${round}:${idx}`;
  const record = (grade: Grade): boolean => {
    if (done || !claimReviewStep(seen.current, step)) return false;
    if (started.current === null) started.current = seed;
    if (q) review(q, grade);
    setGraded(grade);
    setStats((s) => ({ ...s, [grade]: s[grade] + 1 }));
    if (grade === 'unknown') setMissed((m) => [...m, qid]);
    return true;
  };
  const advance = () => {
    if (!graded || !claimReviewStep(advanced.current, step)) return;
    if (idx + 1 >= ids.length) {
      const now = stamp();
      setElapsed(Math.max(0, now - (started.current ?? seed)));
      setNextDue(nextDueAfter(Object.values(useProgress.getState().cards), now));
      setDone(true);
      return;
    }
    setIdx(idx + 1); setPick(null); setGraded(null); setGuessing(false); setFlipped(false);
  };
  const redo = () => {
    setIds(missed); setMissed([]); setRound(round + 1); setIdx(0); setStats(ZERO); setDone(false); setPick(null); setGraded(null); setGuessing(false); setFlipped(false); started.current = stamp();
  };
  if (!ids.length) return <StudyScreen footer={<Button onPress={() => router.back()}>{t('review.done')}</Button>}><Text>{t('review.empty')}</Text></StudyScreen>;
  if (done) {
    const total = stats.know + stats.guess + stats.unknown;
    return <StudyScreen scrollKey={`done-${round}`} footer={<>{missed.length > 0 ? <Button mode='outlined' onPress={redo}>{t('review.redoMissed')}</Button> : null}<Button mode='contained' buttonColor={theme.colors.secondary} textColor={theme.colors.onSecondary} onPress={() => router.back()}>{t('review.done')}</Button></>}>
      <Panel style={styles.center}><Text variant='titleLarge'>{t('review.summaryTitle')}</Text><ScoreRing value={total ? stats.know * 100 / total : 0} size={150} color={theme.dark ? '#8DCB91' : palette.success} label={`${stats.know}/${total}`} /><Text>{t('review.time', { time: formatClock(elapsed) })}</Text></Panel>
      <View style={styles.row}><StatCard icon='✓' value={String(stats.know)} label={t('review.know')} tone='success' /><StatCard icon='≈' value={String(stats.guess)} label={t('review.guessed')} tone={stats.guess ? 'warning' : 'default'} /><StatCard icon='✗' value={String(stats.unknown)} label={t('review.dontKnow')} tone={stats.unknown ? 'danger' : 'default'} /></View>
      {!glossary ? <Panel><Text>{nextDue ? t('review.nextReview', { date: new Date(nextDue).toLocaleDateString(i18n.language) }) : t('review.noNext')}</Text></Panel> : null}
    </StudyScreen>;
  }
  const back = term?.definition ?? (p ? `${p.options[p.correctIndex]}${q?.explanation ? `\n\n${q.explanation}` : ''}` : '');
  const last = idx + 1 === ids.length;
  const score = (grade: Grade) => { if (flipped && !graded) record(grade); };
  return <>
    <StudyScreen scrollKey={`${round}-${idx}`} top={<>
      <View style={styles.top}><Text variant='labelLarge'>{t('review.progress', { current: idx + 1, total: ids.length })}</Text><View style={styles.row}>{!glossary ? <Button onPress={() => { setMode(mode === 'quiz' ? 'flash' : 'quiz'); setFlipped(Boolean(graded)); }}>{mode === 'quiz' ? t('review.modeFlash') : t('review.modeQuiz')}</Button> : null}<Button onPress={() => setQuit(true)}>{t('review.quit')}</Button></View></View>
      <Bar value={(idx + (graded ? 1 : 0)) / ids.length} height={10} />
    </>} footer={graded ? <><Text variant='bodySmall'>{t('bookmarksUi.recorded')}</Text><Button mode='contained' buttonColor={theme.colors.secondary} textColor={theme.colors.onSecondary} onPress={advance}>{last ? t('studyControls.results') : t('learn.next')}</Button></> : mode === 'quiz' ? <View style={styles.row}><Button mode={guessing ? 'contained' : 'outlined'} onPress={() => setGuessing(!guessing)}>{guessing ? t('review.guessingOn') : t('review.guessing')}</Button><Button mode='outlined' onPress={() => record('unknown')}>{t('review.dontKnow')}</Button></View> : flipped ? <View style={styles.row}>{(['unknown', 'guess', 'know'] as const).map((grade) => <Pressable key={grade} accessibilityRole='button' onPress={() => score(grade)} style={[styles.grade, { backgroundColor: grade === 'unknown' ? palette.danger : grade === 'guess' ? '#9A4700' : palette.success }]}><Text style={styles.gradeText}>{grade === 'unknown' ? t('review.dontKnow') : grade === 'guess' ? t('review.guessed') : t('review.know')}</Text></Pressable>)}</View> : <Button mode='outlined' onPress={() => setFlipped(true)}>{t('review.flipHint')}</Button>}>
      {mode === 'quiz' && p ? <QuestionCard key={step} presented={p} selected={pick} reveal={graded !== null} onSelect={(i) => { if (record(gradeFrom(isCorrect(p, i), guessing ? 'guess' : 'know'))) setPick(i); }} /> : <>
        {q ? <View style={styles.bookmark}><BookmarkButton question={q} /></View> : null}
        <Pressable accessibilityRole='button' accessibilityLabel={t('review.flipHint')} onPress={() => setFlipped(!flipped)} style={[styles.flash, { backgroundColor: flipped ? theme.colors.primaryContainer : theme.colors.surface, borderColor: theme.colors.outlineVariant }]}><Text variant={flipped ? 'bodyLarge' : 'titleLarge'} style={{ color: flipped ? theme.colors.onPrimaryContainer : theme.colors.onSurface, textAlign: 'center' }}>{flipped ? back : term?.term ?? q?.text ?? ''}</Text></Pressable>
      </>}
    </StudyScreen>
    <Portal><Dialog visible={quit} onDismiss={() => setQuit(false)}><Dialog.Title>{t('review.quitTitle')}</Dialog.Title><Dialog.Content><Text>{t('review.quitBody')}</Text></Dialog.Content><Dialog.Actions><Button onPress={() => setQuit(false)}>{t('common.cancel')}</Button><Button onPress={() => router.back()}>{t('review.quit')}</Button></Dialog.Actions></Dialog></Portal>
  </>;
}
const styles = StyleSheet.create({ top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, center: { alignItems: 'center', gap: 12 }, flash: { minHeight: 240, padding: 24, borderRadius: 24, borderWidth: 1.5, justifyContent: 'center' }, bookmark: { flexDirection: 'row', justifyContent: 'flex-end' }, grade: { flex: 1, minWidth: 90, minHeight: 52, padding: 10, borderRadius: 14, justifyContent: 'center' }, gradeText: { color: '#FFFFFF', textAlign: 'center', fontWeight: '600' } });
