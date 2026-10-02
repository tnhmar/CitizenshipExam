import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Panel } from '../../src/components/Panel';
import { ScoreRing } from '../../src/components/ScoreRing';
import { StatCard } from '../../src/components/StatCard';
import { StudyStreakCard } from '../../src/components/StudyStreakCard';
import { useBundle } from '../../src/content/useBundle';
import { useHomeFocusText } from '../../src/i18n/homeFocus';
import { useHomeLearningText } from '../../src/i18n/homeLearning';
import { useNextStepText } from '../../src/i18n/nextStep';
import { snapshot } from '../../src/logic/dashboardStats';
import { completionPreviewPercent, homeFocusTarget } from '../../src/logic/homeFocus';
import { homeExamDate, homeStep } from '../../src/logic/homePresentation';
import { needsTabAnchor } from '../../src/navigation/tabRoots';
import { useProgress } from '../../src/store/progress';
import { useSettings } from '../../src/store/settings';

const stamp = (): number => Date.now();
export default function Home() {
  const { t } = useTranslation();
  const text = useHomeLearningText(); const focusText = useHomeFocusText(); const nextText = useNextStepText();
  const router = useRouter(); const theme = useTheme(); const insets = useSafeAreaInsets();
  const bundle = useBundle(); const progress = useProgress(); const examDate = useSettings((s) => s.examDate);
  const [now, setNow] = useState(stamp);
  useFocusEffect(useCallback(() => {
    const refresh = () => setNow(stamp());
    const initial = setTimeout(refresh, 0);
    const timer = setInterval(refresh, 60000);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearTimeout(initial); clearInterval(timer); listener.remove(); };
  }, []));
  const data = useMemo(() => snapshot(bundle, progress, now), [bundle, progress, now]);
  const target = homeFocusTarget(data.nextAction, bundle);
  const alternative = data.nextAlternative ? homeStep(data.nextAlternative.action, bundle) : null;
  const actionLabel = data.nextAction.kind === 'finishChapter' ? target.canValidate ? nextText.finishChapter : nextText.openChapter : data.nextAction.kind === 'startLearning' ? target.startsChapter ? nextText.startChapter : nextText.startLesson : text.actions[data.nextAction.kind];
  const reason = target.canValidate ? nextText.reasons[data.nextAction.kind] : nextText.quizUnavailable;
  const date = homeExamDate(examDate, now);
  const dateLabel = date.kind === 'unset' ? t('homeUi.setDate') : date.kind === 'past' ? t('homeUi.testPassed') : date.kind === 'today' ? t('homeUi.testToday') : t('homeUi.testIn', { count: date.days ?? 0 });
  const completion = data.completion;
  const percent = completionPreviewPercent(completion.lessonsCompleted, completion.lessonsTotal);
  const open = (route: string) => router.push(route, { withAnchor: needsTabAnchor(route) });
  const tile = (icon: string, label: string, route: string) => <Panel onPress={() => open(route)} accessibilityLabel={label} style={styles.tile}><Text style={styles.tileIcon}>{icon}</Text><Text variant='titleSmall' style={styles.center}>{label}</Text></Panel>;
  return <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
    <View style={styles.header}>
      <Text variant='headlineSmall' style={styles.grow}>{t('home.greeting')}</Text>
      <Button mode='text' compact accessibilityLabel={t('settings.title')} onPress={() => open('/settings')}>{t('settings.title')}</Button>
    </View>
    {bundle.sample ? <Panel tone='warning'><Text>{t('common.sampleBanner')}</Text></Panel> : null}
    <Panel>
      <Text variant='labelLarge' style={{ color: theme.colors.onSurfaceVariant }}>{text.next}</Text>
      {target.subject ? <Text variant='titleLarge'>{target.subject}</Text> : null}
      <Text variant='bodyMedium'>{reason}</Text>
      <Button mode='contained' contentStyle={styles.primary} accessibilityLabel={actionLabel} onPress={() => open(target.route)}>{actionLabel}</Button>
      {data.nextAlternative && alternative ? <View style={styles.alternative}>
        {data.nextAction.kind === 'resumeExam' ? <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{nextText.examWarning}</Text> : null}
        <Button mode='text' onPress={() => open(alternative.route)}>{nextText[data.nextAlternative.label]}</Button>
        {alternative.subject && alternative.subject !== target.subject ? <Text variant='bodySmall' style={styles.center}>{alternative.subject}</Text> : null}
      </View> : null}
    </Panel>
    <View style={styles.section}>
      <Text variant='titleMedium'>{focusText.today}</Text>
      <View style={styles.today}>
        <View style={styles.todayItem}><StatCard icon='🔄' value={String(data.review.due)} label={t('homeUi.dueLabel')} onPress={() => open('/review')} /></View>
        <View style={styles.todayItem}><StatCard icon='📅' value={date.value} label={dateLabel} onPress={() => open('/settings')} /></View>
        <View style={styles.todayItem}><StudyStreakCard streak={progress.streak} now={now} legacySaved={progress.legacyActivityStreak !== null} /></View>
      </View>
    </View>
    <Panel>
      <Text variant='titleMedium'>{text.completion}</Text>
      <View style={styles.progressRow}>
        <ScoreRing value={percent} label={`${completion.lessonsCompleted}/${completion.lessonsTotal}`} size={80} />
        <View style={styles.progressText}>
          <Text variant='bodyMedium'>{text.lessonsCompleted}: {completion.lessonsCompleted}/{completion.lessonsTotal}</Text>
          <Text variant='bodyMedium'>{text.chaptersCompleted}: {completion.chaptersCompleted}/{completion.chaptersTotal}</Text>
        </View>
      </View>
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{focusText.progressHint}</Text>
      <Button mode='outlined' onPress={() => open('/progress')}>{focusText.viewProgress}</Button>
    </Panel>
    <View style={styles.section}>
      <Text variant='titleMedium'>{focusText.shortcuts}</Text>
      <View style={styles.tiles}>
        {tile('📚', t('tabs.learn'), '/learn')}
        {tile('🔄', t('tabs.review'), '/review')}
        {tile('📝', t('tabs.exams'), '/exams')}
        {tile('📊', t('tabs.progress'), '/progress')}
      </View>
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grow: { flex: 1 },
  primary: { minHeight: 48 },
  alternative: { gap: 4 },
  center: { textAlign: 'center' },
  section: { gap: 10 },
  today: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  todayItem: { flex: 1, minWidth: 130 },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  progressText: { flex: 1, minWidth: 170, gap: 4 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { flexBasis: '46%', flexGrow: 1, minWidth: 120, alignItems: 'center', paddingVertical: 16, gap: 6 },
  tileIcon: { fontSize: 24 },
});
