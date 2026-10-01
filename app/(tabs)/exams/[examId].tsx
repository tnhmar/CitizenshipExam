import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Bar } from '../../../src/components/Bar';
import { Panel } from '../../../src/components/Panel';
import { QuestionCard } from '../../../src/components/QuestionCard';
import { StudyScreen } from '../../../src/components/StudyScreen';
import { getBundle } from '../../../src/content/loader';
import { flushExamQuestionTime, useExamClock, useExamQuestionTime } from '../../../src/hooks/useExam';
import { deviceLang } from '../../../src/i18n';
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
  const active = useProgress((s) => s.active);
  const created = useRef(false);
  const reviewing = useRef(false);
  const attempt = active?.examId === examId ? active : null;
  const bundle = getBundle(attempt?.lang ?? lang);
  const exam = bundle.exams.find((e) => e.id === examId);
  const presented = useMemo(() => attempt ? attempt.questionIds.map((id) => present(bundle.questions[id], attempt.seed)) : [], [attempt, bundle]);
  const idx = Math.max(0, Math.min(attempt?.cursor ?? 0, presented.length - 1));
  useExamQuestionTime(attempt?.id, attempt?.questionIds[idx]);
  const remaining = useExamClock(attempt);
  useFocusEffect(useCallback(() => { reviewing.current = false; }, []));
  useEffect(() => {
    if (attempt) { created.current = true; return; }
    if (exam && !created.current) { created.current = true; useProgress.getState().setActive(createAttempt(exam, lang, stamp(), exam.durationMin)); }
  }, [exam, attempt, lang]);
  if (!exam || !attempt || !presented.length) return null;
  const p = presented[idx];
  const given = attempt.answers.find((a) => a.questionId === p.question.id);
  const flags = attempt.flags ?? [];
  const flagged = flags.includes(p.question.id);
  const last = idx + 1 === presented.length;
  const low = remaining < 300000;
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
    flushExamQuestionTime(attempt.id, true);
    router.push('/exams/summary');
  };
  const leave = () => { flushExamQuestionTime(attempt.id, true); router.back(); };
  return <>
    <Stack.Screen options={{ title: exam.title, headerBackVisible: false, headerLeft: () => <Pressable accessibilityRole='button' accessibilityLabel={t('exams.leave')} onPress={leave} style={styles.close}><Text style={{ fontSize: 22, color: theme.colors.onPrimary }}>✕</Text></Pressable> }} />
    <StudyScreen scrollKey={`${attempt.id}-${idx}`} top={<Panel tone={low ? 'danger' : 'default'}><View style={styles.top}><Text accessibilityLabel={t('exams.timeLeft', { time: formatClock(remaining) })} variant='headlineSmall' style={{ fontWeight: '700', color: low ? danger : theme.colors.onSurface }}>{`⏱ ${formatClock(remaining)}`}</Text><Text variant='labelLarge'>{t('learn.question', { current: idx + 1, total: presented.length })}</Text></View><Bar value={attempt.answers.length / presented.length} /><Text variant='bodySmall'>{t('examUi.answered', { n: attempt.answers.length, total: presented.length })}</Text></Panel>} footer={<>
      <View style={styles.controls}>
        <Pressable accessibilityRole='button' accessibilityState={{ disabled: idx === 0 }} disabled={idx === 0} onPress={() => go(idx - 1)} style={[styles.control, { borderColor: theme.colors.outline }, idx === 0 && styles.disabled]}><Text style={{ color: theme.colors.secondary, textAlign: 'center' }}>{t('exams.previous')}</Text></Pressable>
        <Pressable accessibilityRole='button' accessibilityLabel={flagged ? t('exams.unflag') : t('exams.flag')} accessibilityState={{ selected: flagged }} onPress={toggleFlag} style={[styles.flagButton, { borderColor: warning, backgroundColor: flagged ? theme.colors.surfaceVariant : theme.colors.surface }]}><Text style={{ color: warning, fontSize: 24 }}>⚑</Text></Pressable>
        <Pressable accessibilityRole='button' onPress={last ? review : () => go(idx + 1)} style={[styles.control, { borderColor: theme.colors.secondary, backgroundColor: theme.colors.secondary }]}><Text style={{ color: theme.colors.onSecondary, textAlign: 'center', fontWeight: '700' }}>{last ? t('examUi.summaryTitle') : t('exams.next')}</Text></Pressable>
      </View>
      {!last ? <Pressable accessibilityRole='button' onPress={review} style={styles.review}><Text style={{ color: theme.colors.secondary, textAlign: 'center' }}>{t('examUi.summaryTitle')}</Text></Pressable> : null}
    </>}>
      <View style={styles.grid}>{attempt.questionIds.map((qid, i) => {
        const answered = attempt.answers.some((a) => a.questionId === qid);
        const marked = flags.includes(qid);
        return <Pressable key={qid} accessibilityRole='button' accessibilityLabel={`${t('examUi.questionNo', { n: i + 1 })}, ${answered ? t('examUi.statAnswered') : t('examUi.statUnanswered')}${marked ? `, ${t('examUi.statFlagged')}` : ''}`} accessibilityState={{ selected: i === idx }} onPress={() => go(i)} style={[styles.dot, { borderWidth: i === idx ? 3 : 1.5, borderColor: i === idx ? theme.colors.primary : marked ? warning : theme.colors.outline, backgroundColor: answered ? theme.colors.primary : theme.colors.surface }]}><Text style={{ color: answered ? theme.colors.onPrimary : theme.colors.onSurface }}>{i + 1}</Text>{marked ? <Text style={[styles.flag, { color: warning }]}>⚑</Text> : null}</Pressable>;
      })}</View>
      <QuestionCard key={p.question.id} presented={p} selected={given?.chosen ?? null} reveal={false} onSelect={select} />
    </StudyScreen>
  </>;
}
const styles = StyleSheet.create({ top: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, dot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, flag: { position: 'absolute', top: -6, right: -2, fontSize: 14 }, controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }, control: { flex: 1, minWidth: 100, minHeight: 48, padding: 10, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, flagButton: { width: 48, height: 48, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.4 }, review: { minHeight: 44, justifyContent: 'center' }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } });
