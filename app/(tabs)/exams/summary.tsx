import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { Panel } from '../../../src/components/Panel';
import { StatCard } from '../../../src/components/StatCard';
import { StudyScreen } from '../../../src/components/StudyScreen';
import { getBundle } from '../../../src/content/loader';
import { useExamClock, useSubmitExam } from '../../../src/hooks/useExam';
import { formatClock } from '../../../src/logic/stats';
import { useProgress } from '../../../src/store/progress';
import { palette } from '../../../src/theme';

type Filter = 'all' | 'unanswered' | 'flagged';
export default function ExamSummary() {
  const { t } = useTranslation(); const router = useRouter(); const theme = useTheme();
  const active = useProgress((s) => s.active); const remaining = useExamClock(active); const submit = useSubmitExam();
  const [filter, setFilter] = useState<Filter>('all'); const [confirm, setConfirm] = useState(false);
  if (!active) return null;
  const bundle = getBundle(active.lang); const flags = active.flags ?? [];
  const answeredIds = new Set(active.answers.filter((a) => a.chosen !== null).map((a) => a.questionId));
  const rows = active.questionIds.map((qid, i) => ({ qid, i, answered: answeredIds.has(qid), flagged: flags.includes(qid) }));
  const unanswered = rows.filter((r) => !r.answered).length; const shown = rows.filter((r) => filter === 'all' || filter === 'unanswered' && !r.answered || filter === 'flagged' && r.flagged);
  const warning = theme.dark ? '#FFBB73' : palette.warning; const danger = theme.dark ? '#FFB4AB' : palette.danger;
  const jump = (i: number) => {
    const current = useProgress.getState().active;
    if (!current || current.id !== active.id || i < 0 || i >= current.questionIds.length) return;
    useProgress.getState().setActive({ ...current, cursor: i });
    router.push(`/exams/${current.examId}`);
  };
  return <>
    <StudyScreen scrollKey={filter} top={<Panel tone={remaining < 300000 ? 'danger' : 'default'}><Text accessibilityLabel={t('exams.timeLeft', { time: formatClock(remaining) })} variant='headlineSmall' style={{ fontWeight: '700', color: remaining < 300000 ? danger : theme.colors.onSurface }}>{`⏱ ${formatClock(remaining)}`}</Text><Text variant='bodySmall'>{t('examUi.reviewHint')}</Text></Panel>} footer={<><Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{t('examUi.reviewCounts', { unanswered, flagged: flags.length })}</Text><Button mode='contained' buttonColor={theme.colors.secondary} textColor={theme.colors.onSecondary} contentStyle={styles.cta} onPress={() => setConfirm(true)}>{t('examUi.submit')}</Button><Button mode='outlined' onPress={() => router.back()}>{t('examUi.backToExam')}</Button></>}>
      <View style={styles.row}><StatCard icon='●' value={`${rows.length - unanswered}/${rows.length}`} label={t('examUi.statAnswered')} /><StatCard icon='○' value={String(unanswered)} label={t('examUi.statUnanswered')} tone={unanswered ? 'danger' : 'default'} /><StatCard icon='⚑' value={String(flags.length)} label={t('examUi.statFlagged')} tone={flags.length ? 'warning' : 'default'} /></View>
      <View style={styles.row}>{(['all', 'unanswered', 'flagged'] as const).map((f) => <Button key={f} compact mode={filter === f ? 'contained' : 'outlined'} onPress={() => setFilter(f)}>{f === 'all' ? t('examUi.filterAll') : f === 'unanswered' ? t('examUi.filterUnanswered') : t('examUi.filterFlagged')}</Button>)}</View>
      {shown.length === 0 ? <Text variant='bodyLarge'>{t('examUi.nothing')}</Text> : null}
      {shown.map((r) => <Panel key={r.qid} onPress={() => jump(r.i)} accessibilityLabel={`${t('examUi.questionNo', { n: r.i + 1 })}, ${r.answered ? t('examUi.statAnswered') : t('examUi.statUnanswered')}${r.flagged ? `, ${t('examUi.statFlagged')}` : ''}`}><View style={styles.item}><View style={[styles.badge, { backgroundColor: r.answered ? theme.colors.primary : theme.colors.surfaceVariant }]}><Text style={{ color: r.answered ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, fontWeight: '700' }}>{r.i + 1}</Text></View><Text variant='bodyMedium' style={styles.grow}>{bundle.questions[r.qid].text}</Text>{r.flagged ? <Text style={{ color: warning, fontSize: 18 }}>⚑</Text> : null}<Text style={{ color: r.answered ? theme.colors.secondary : danger, fontSize: 18 }}>{r.answered ? '●' : '○'}</Text></View></Panel>)}
    </StudyScreen>
    <Portal><Dialog visible={confirm} onDismiss={() => setConfirm(false)}><Dialog.Title>{t('examUi.submitTitle')}</Dialog.Title><Dialog.Content>{unanswered > 0 ? <Text>{t('examUi.submitUnanswered', { count: unanswered })}</Text> : null}<Text>{t('examUi.submitFinal')}</Text></Dialog.Content><Dialog.Actions><Button onPress={() => setConfirm(false)}>{t('common.cancel')}</Button><Button onPress={() => { setConfirm(false); submit(active); }}>{t('examUi.submit')}</Button></Dialog.Actions></Dialog></Portal>
  </>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, item: { flexDirection: 'row', alignItems: 'center', gap: 12 }, badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, grow: { flex: 1 }, cta: { paddingVertical: 6 } });
