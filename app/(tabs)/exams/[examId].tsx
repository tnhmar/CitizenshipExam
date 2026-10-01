import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Menu, Text, useTheme } from 'react-native-paper';
import { Bar } from '../../../src/components/Bar';
import { ExamOverview } from '../../../src/components/ExamOverview';
import { QuestionCard } from '../../../src/components/QuestionCard';
import { StudyScreen } from '../../../src/components/StudyScreen';
import { getBundle } from '../../../src/content/loader';
import { flushExamQuestionTime, useExamClock, useExamQuestionTime } from '../../../src/hooks/useExam';
import { deviceLang } from '../../../src/i18n';
import { hasBookmark } from '../../../src/logic/bookmarks';
import { createAttempt } from '../../../src/logic/exam';
import { isCorrect, present } from '../../../src/logic/quiz';
import { formatClock } from '../../../src/logic/stats';
import { useProgress } from '../../../src/store/progress';
import { useSettings } from '../../../src/store/settings';
import { palette } from '../../../src/theme';
import type { Answer } from '../../../src/types';

const stamp = (): number => Date.now();
export default function ExamScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  return <ExamSession key={examId} examId={Number(examId)} />;
}
function ExamSession({ examId }: { examId: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const lang = useSettings((s) => s.lang) ?? deviceLang();
  const textScale = useSettings((s) => s.textScale);
  const active = useProgress((s) => s.active);
  const toggleBookmark = useProgress((s) => s.toggleBookmark);
  const created = useRef(false);
  const reviewing = useRef(false);
  const [overview, setOverview] = useState(false);
  const [menu, setMenu] = useState(false);
  const attempt = active?.examId === examId ? active : null;
  const bundle = getBundle(attempt?.lang ?? lang);
  const exam = bundle.exams.find((e) => e.id === examId);
  const presented = useMemo(() => attempt ? attempt.questionIds.map((id) => present(bundle.questions[id], attempt.seed)) : [], [attempt, bundle]);
  const idx = Math.max(0, Math.min(attempt?.cursor ?? 0, presented.length - 1));
  const p = presented[idx];
  const saved = useProgress((s) => p ? hasBookmark(s.bookmarks, p.question.conceptId) : false);
  useExamQuestionTime(attempt?.id, overview || menu ? undefined : attempt?.questionIds[idx]);
  const remaining = useExamClock(attempt);
  useFocusEffect(useCallback(() => { reviewing.current = false; }, []));
  useEffect(() => {
    if (attempt) { created.current = true; return; }
    if (exam && !created.current) { created.current = true; useProgress.getState().setActive(createAttempt(exam, lang, stamp(), exam.durationMin)); }
  }, [exam, attempt, lang]);
  if (!exam || !attempt || !p) return null;
  const given = attempt.answers.find((a) => a.questionId === p.question.id);
  const flags = attempt.flags ?? [];
  const flagged = flags.includes(p.question.id);
  const last = idx + 1 === presented.length;
  const warning = theme.dark ? '#FFBB73' : palette.warning;
  const danger = theme.dark ? '#FFB4AB' : palette.danger;
  const getCurrent = () => {
    const current = useProgress.getState().active;
    return current?.id === attempt.id && current.questionIds[current.cursor ?? 0] === p.question.id && stamp() < current.startedAt + current.limitMs ? current : null;
  };
  const go = (n: number) => {
    if (!getCurrent() || n === idx || n < 0 || n >= presented.length) return;
    flushExamQuestionTime(attempt.id, true);
    const current = useProgress.getState().active;
    if (current?.id === attempt.id) useProgress.getState().setActive({ ...current, cursor: n });
  };
  const select = (i: number) => {
    const current = getCurrent();
    if (!current) return;
    const ans: Answer = { questionId: p.question.id, conceptId: p.question.conceptId, chosen: i, correct: isCorrect(p, i), timeMs: 0, flagged: (current.flags ?? []).includes(p.question.id) };
    useProgress.getState().setActive({ ...current, answers: [...current.answers.filter((a) => a.questionId !== ans.questionId), ans] });
  };
  const toggleFlag = () => {
    const current = getCurrent();
    if (!current) return;
    const f = current.flags ?? [];
    useProgress.getState().setActive({ ...current, flags: f.includes(p.question.id) ? f.filter((id) => id !== p.question.id) : [...f, p.question.id] });
  };
  const review = () => {
    if (!getCurrent() || reviewing.current) return;
    reviewing.current = true;
    setMenu(false); setOverview(false);
    flushExamQuestionTime(attempt.id, true);
    router.push('/exams/summary');
  };
  const leave = () => { flushExamQuestionTime(attempt.id, true); router.back(); };
  return <>
    <Stack.Screen options={{ title: exam.title, headerBackVisible: false,
      headerLeft: () => <Pressable accessibilityRole='button' accessibilityLabel={t('exams.leave')} onPress={leave} style={styles.headerButton}><Text style={{ fontSize: 22, color: theme.colors.onPrimary }}>✕</Text></Pressable>,
      headerRight: () => <Menu visible={menu} onDismiss={() => setMenu(false)} anchor={<Pressable accessibilityRole='button' accessibilityLabel={t('focusUi.actions')} onPress={() => setMenu(true)} style={styles.headerButton}><Text style={{ fontSize: 26, color: theme.colors.onPrimary }}>⋯</Text></Pressable>}>
        <Menu.Item title={t(saved ? 'bookmarksUi.remove' : 'bookmarksUi.save')} onPress={() => { toggleBookmark(p.question); setMenu(false); }} />
        <Menu.Item title={t('examUi.summaryTitle')} onPress={review} />
      </Menu>,
    }} />
    <StudyScreen scrollKey={`${attempt.id}-${idx}`} top={<>
      <View style={styles.status}><Text accessibilityLabel={t('exams.timeLeft', { time: formatClock(remaining) })} variant='titleMedium' style={{ fontWeight: '700', color: remaining < 300000 ? danger : theme.colors.onSurface }}>{`⏱ ${formatClock(remaining)}`}</Text><Text variant='labelLarge'>{t('learn.question', { current: idx + 1, total: presented.length })}</Text><Button compact onPress={() => setOverview(true)}>{t('focusUi.questions')}</Button></View>
      <Bar value={attempt.answers.length / presented.length} height={4} />
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{t('examUi.answered', { n: attempt.answers.length, total: presented.length })}</Text>
    </>} footer={<View style={styles.controls}>
      <Pressable accessibilityRole='button' accessibilityState={{ disabled: idx === 0 }} disabled={idx === 0} onPress={() => go(idx - 1)} style={[styles.control, { borderColor: theme.colors.outline }, idx === 0 && styles.disabled]}><Text style={{ color: theme.colors.secondary, textAlign: 'center' }}>{t('exams.previous')}</Text></Pressable>
      <Pressable accessibilityRole='button' accessibilityLabel={flagged ? t('exams.unflag') : t('exams.flag')} accessibilityState={{ selected: flagged }} onPress={toggleFlag} style={[styles.flagButton, { borderColor: warning, backgroundColor: flagged ? theme.colors.surfaceVariant : theme.colors.surface }]}><Text style={{ color: warning, fontSize: 24 }}>⚑</Text></Pressable>
      <Pressable accessibilityRole='button' onPress={last ? review : () => go(idx + 1)} style={[styles.control, { borderColor: theme.colors.secondary, backgroundColor: theme.colors.secondary }]}><Text style={{ color: theme.colors.onSecondary, textAlign: 'center', fontWeight: '700' }}>{last ? t('focusUi.review') : t('exams.next')}</Text></Pressable>
    </View>}>
      <QuestionCard key={p.question.id} presented={p} selected={given?.chosen ?? null} reveal={false} onSelect={select} showBookmark={false} compact textSize={17 * textScale} />
    </StudyScreen>
    <ExamOverview visible={overview} ids={attempt.questionIds} answered={attempt.answers.filter((a) => a.chosen !== null).map((a) => a.questionId)} flags={flags} current={idx} onClose={() => setOverview(false)} onChoose={(i) => { setOverview(false); go(i); }} />
  </>;
}
const styles = StyleSheet.create({ status: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 }, controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }, control: { flex: 1, minWidth: 100, minHeight: 48, padding: 10, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, flagButton: { width: 48, height: 48, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.4 }, headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } });
