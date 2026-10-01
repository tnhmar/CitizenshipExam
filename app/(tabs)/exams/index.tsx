import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { Bar } from '../../../src/components/Bar';
import { Panel } from '../../../src/components/Panel';
import { Screen } from '../../../src/components/Screen';
import { useBundle } from '../../../src/content/useBundle';
import { requiredToPass } from '../../../src/logic/exam';
import { useProgress } from '../../../src/store/progress';
import { palette, tints } from '../../../src/theme';
import type { ExamAttempt } from '../../../src/types';

const scoreOf = (a: ExamAttempt) => a.answers.filter((x) => x.correct).length;

export default function ExamsIndex() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const bundle = useBundle();
  const attempts = useProgress((s) => s.attempts);
  const active = useProgress((s) => s.active);
  const setActive = useProgress((s) => s.setActive);
  const [pending, setPending] = useState<number | null>(null);
  const finished = attempts.filter((a) => a.finishedAt !== null);
  const required = requiredToPass(bundle.examSize, bundle.passMark, bundle.examSize);
  const tried = new Set(finished.map((a) => a.examId)).size;
  const best = finished.reduce((m, a) => Math.max(m, scoreOf(a)), 0);
  const solid = theme.dark ? tints.dark : tints.light;
  const success = theme.dark ? '#8DCB91' : palette.success;
  const danger = theme.dark ? '#FFB4AB' : palette.danger;
  const warning = theme.dark ? '#FFBB73' : palette.warning;
  const last = (examId: number) => finished.filter((a) => a.examId === examId).sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))[0];
  const open = (examId: number) => {
    if (active && active.examId !== examId) setPending(examId);
    else router.push(`/exams/${examId}`);
  };
  const nextExam = bundle.exams.find((e) => e.kind === 'mock' && !finished.some((a) => a.examId === e.id)) ?? bundle.exams[0];
  const group = (kind: 'mock' | 'practice', title: string) => {
    const exams = bundle.exams.filter((e) => e.kind === kind);
    return <View style={styles.group}>
      <Text variant='titleMedium'>{`${title} · ${exams.length}`}</Text>
      {exams.map((e) => {
        const l = last(e.id);
        const isActive = active?.examId === e.id;
        const passed = l ? scoreOf(l) >= requiredToPass(l.questionIds.length, bundle.passMark, bundle.examSize) : false;
        return <Panel key={e.id} onPress={() => open(e.id)}>
          <View style={styles.row}>
            <View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer }]}><Text style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}>{e.title.split(' ').pop()}</Text></View>
            <View style={styles.grow}><Text variant='titleSmall'>{e.title}</Text><Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{t('exams.meta', { count: e.questionIds.length, min: e.durationMin })}</Text></View>
            {isActive ? <View style={[styles.pill, { backgroundColor: solid.warning }]}><Text variant='labelMedium' style={{ color: warning }}>{t('examUi.inProgressTag')}</Text></View> : l ? <View style={[styles.pill, { backgroundColor: passed ? solid.success : solid.danger }]}><Text variant='labelMedium' style={{ color: passed ? success : danger }}>{`${scoreOf(l)}/${l.questionIds.length}`}</Text></View> : null}
            <Text style={styles.chevron}>›</Text>
          </View>
        </Panel>;
      })}
    </View>;
  };
  return (
    <Screen>
      <Panel>
        <Text variant='headlineSmall' style={{ color: theme.colors.secondary, fontWeight: '700' }}>{t('examUi.introTitle')}</Text>
        <View style={styles.wrap}>
          {[t('examUi.introQuestions', { count: bundle.examSize }), t('examUi.introMinutes', { min: bundle.examMinutes }), t('examUi.introPass', { required, total: bundle.examSize })].map((label) => <View key={label} style={[styles.pill, { backgroundColor: theme.colors.surfaceVariant }]}><Text variant='labelLarge'>{label}</Text></View>)}
        </View>
        <Text variant='bodyMedium'>{t('examUi.introBody')}</Text>
        <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{t('examUi.introSimulation')}</Text>
        {active || nextExam ? <Button mode='contained' buttonColor={theme.colors.secondary} textColor={theme.colors.onSecondary} contentStyle={styles.cta} onPress={() => { const id = active?.examId ?? nextExam?.id; if (id !== undefined) open(id); }}>{active ? t('exams.resume') : t('examUi.startTraining')}</Button> : null}
      </Panel>
      <Panel tone='primary'>
        <Text variant='titleMedium' style={{ color: theme.colors.onPrimary }}>{t('examUi.overall')}</Text>
        <Text variant='headlineSmall' style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>{t('examUi.takenCount', { n: tried, total: bundle.exams.length })}</Text>
        <Bar value={bundle.exams.length > 0 ? tried / bundle.exams.length : 0} color='#FFFFFF' trackColor='rgba(255,255,255,0.3)' height={10} />
        {finished.length > 0 ? <Text variant='bodyMedium' style={{ color: theme.colors.onPrimary }}>{t('examUi.bestScore', { score: best, total: bundle.examSize })}</Text> : null}
      </Panel>
      {active ? <Panel tone='warning'><Text variant='titleMedium'>{`⏱ ${t('exams.resume')}`}</Text><Text variant='bodySmall'>{t('exams.resumeHint', { title: bundle.exams.find((e) => e.id === active.examId)?.title ?? '' })}</Text><Button mode='contained' onPress={() => open(active.examId)}>{t('common.continue')}</Button></Panel> : null}
      {group('mock', t('exams.mock'))}
      {group('practice', t('exams.practice'))}
      <Portal><Dialog visible={pending !== null} onDismiss={() => setPending(null)}>
        <Dialog.Title>{t('exams.abandonTitle')}</Dialog.Title><Dialog.Content><Text>{t('exams.abandonBody')}</Text></Dialog.Content>
        <Dialog.Actions><Button onPress={() => setPending(null)}>{t('common.cancel')}</Button><Button onPress={() => { const id = pending; setPending(null); setActive(null); if (id !== null) router.push(`/exams/${id}`); }}>{t('common.confirm')}</Button></Dialog.Actions>
      </Dialog></Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { minWidth: 44, height: 44, borderRadius: 22, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  pill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  chevron: { fontSize: 28 },
  cta: { paddingVertical: 6 },
});
