import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Accordion } from '../../src/components/Accordion';
import { Panel } from '../../src/components/Panel';
import { ScoreRing } from '../../src/components/ScoreRing';
import { StatCard } from '../../src/components/StatCard';
import { useBundle } from '../../src/content/useBundle';
import { useHomeLearningText } from '../../src/i18n/homeLearning';
import { useNextStepText } from '../../src/i18n/nextStep';
import { bookmarkQuestions } from '../../src/logic/bookmarks';
import { assessmentIds } from '../../src/logic/completion';
import { snapshot } from '../../src/logic/dashboardStats';
import { homeExamDate, homePercent, homeStep } from '../../src/logic/homePresentation';
import { currentStreak } from '../../src/logic/progress';
import { needsTabAnchor } from '../../src/navigation/tabRoots';
import { useProgress } from '../../src/store/progress';
import { useSettings } from '../../src/store/settings';

const stamp = (): number => Date.now();
export default function Home() {
  const { t, i18n } = useTranslation(); const text = useHomeLearningText(); const nextText = useNextStepText();
  const router = useRouter(); const theme = useTheme(); const insets = useSafeAreaInsets();
  const bundle = useBundle(); const progress = useProgress(); const examDate = useSettings((s) => s.examDate);
  const [now, setNow] = useState(stamp);
  useFocusEffect(useCallback(() => {
    setNow(stamp());
    const timer = setInterval(() => setNow(stamp()), 60000);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') setNow(stamp()); });
    return () => { clearInterval(timer); listener.remove(); };
  }, []));
  const data = useMemo(() => snapshot(bundle, progress, now), [bundle, progress, now]);
  const step = homeStep(data.nextAction, bundle); const date = homeExamDate(examDate, now);
  const alternative = data.nextAlternative ? homeStep(data.nextAlternative.action, bundle) : null;
  const recommendedLesson = bundle.lessons.find((lesson) => lesson.id === data.nextAction.lessonId);
  const recommendedChapter = bundle.chapters.find((chapter) => chapter.id === recommendedLesson?.chapterId);
  const canValidate = data.nextAction.kind !== 'finishChapter' || assessmentIds(bundle, `chapter:${data.nextAction.chapterId}`).length > 0;
  const actionLabel = data.nextAction.kind === 'finishChapter' ? canValidate ? nextText.finishChapter : nextText.openChapter : data.nextAction.kind === 'startLearning' ? recommendedChapter?.lessonIds[0] === recommendedLesson?.id ? nextText.startChapter : nextText.startLesson : text.actions[data.nextAction.kind];
  const reason = canValidate ? nextText.reasons[data.nextAction.kind] : nextText.quizUnavailable;
  const dateLabel = date.kind === 'unset' ? t('homeUi.setDate') : date.kind === 'past' ? t('homeUi.testPassed') : date.kind === 'today' ? t('homeUi.testToday') : t('homeUi.testIn', { count: date.days ?? 0 });
  const saved = bookmarkQuestions(bundle, progress.bookmarks).length; const streakDays = currentStreak(progress.streak, now);
  const completion = data.completion; const white = theme.colors.onPrimary;
  const completionPercent = completion.lessonsTotal ? completion.lessonsCompleted * 100 / completion.lessonsTotal : 0;
  const open = (route: string) => router.push(route, { withAnchor: needsTabAnchor(route) });
  const tile = (icon: string, label: string, route: string) => <Panel onPress={() => open(route)} style={styles.tile}><Text style={styles.tileIcon}>{icon}</Text><Text variant='titleSmall' style={styles.centerText}>{label}</Text></Panel>;
  const metric = (label: string, value: string) => <View style={styles.between}><Text variant='bodyMedium' style={styles.grow}>{label}</Text><Text variant='labelLarge' style={styles.value}>{value}</Text></View>;
  const evidenceValue = (correct: number, total: number, accuracy: number | null) => accuracy === null ? text.noEvidence : `${correct}/${total} · ${homePercent(accuracy)}`;
  return <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
    <View style={[styles.hero, { backgroundColor: theme.colors.primary, paddingTop: insets.top + 12 }]}>
      <Text style={styles.leaf}>🍁</Text>
      <View style={styles.heroTop}><View style={styles.grow}><Text variant='headlineSmall' style={[styles.strong, { color: white }]}>{t('home.greeting')}</Text><Text variant='bodyMedium' style={{ color: white }}>{t('homeUi.subtitle')}</Text></View><Pressable accessibilityRole='button' accessibilityLabel={t('settings.title')} onPress={() => open('/settings')} style={styles.gear}><Text style={{ fontSize: 22 }}>⚙️</Text></Pressable></View>
      <View style={styles.heroBody}><ScoreRing value={completionPercent} label={`${completion.lessonsCompleted}/${completion.lessonsTotal}`} size={120} color={white} trackColor={theme.colors.primaryContainer} textColor={white} /><View style={styles.grow}><Text variant='titleMedium' style={[styles.strong, { color: white }]}>{text.completion}</Text><Text variant='bodyMedium' style={{ color: white }}>{text.lessonsCompleted}: {completion.lessonsCompleted}/{completion.lessonsTotal}</Text><Text variant='bodyMedium' style={{ color: white }}>{text.chaptersCompleted}: {completion.chaptersCompleted}/{completion.chaptersTotal}</Text><Text variant='bodySmall' style={{ color: white }}>{text.inProgress}: {completion.lessonsInProgress}</Text></View></View>
      <Text variant='bodySmall' style={{ color: white }}>{text.completionHint}</Text>
      <Text variant='labelLarge' style={{ color: white }}>{text.next}</Text>
      <Pressable accessibilityRole='button' accessibilityLabel={actionLabel} onPress={() => open(step.route)} style={styles.mainCta}><Text style={[styles.centerText, styles.strong, { color: theme.colors.primary, fontSize: 16 }]}>{actionLabel}</Text></Pressable>
      {step.subject ? <Text variant='bodySmall' style={[styles.centerText, { color: white }]}>{recommendedChapter ? `${recommendedChapter.title} · ${step.subject}` : step.subject}</Text> : null}
      <Text variant='bodySmall' style={[styles.centerText, { color: white }]}>{reason}</Text>
      {data.nextAlternative && alternative ? <View style={styles.alternative}>
        {data.nextAction.kind === 'resumeExam' ? <Text variant='bodySmall' style={[styles.centerText, { color: white }]}>{nextText.examWarning}</Text> : null}
        <Button mode='text' textColor={white} onPress={() => open(alternative.route)}>{nextText[data.nextAlternative.label]}</Button>
        {alternative.subject && alternative.subject !== step.subject ? <Text variant='bodySmall' style={[styles.centerText, { color: white }]}>{alternative.subject}</Text> : null}
      </View> : null}
    </View>
    <View style={styles.body}>
      {bundle.sample ? <Panel tone='warning'><Text>{t('common.sampleBanner')}</Text></Panel> : null}
      <View style={styles.row}><StatCard icon='🔥' value={String(streakDays)} label={t('homeUi.streakLabel', { count: streakDays })} tone={streakDays > 0 ? 'warning' : 'default'} /><StatCard icon='📅' value={date.value} label={dateLabel} onPress={() => open('/settings')} /><StatCard icon='🔄' value={String(data.review.due)} label={t('homeUi.dueLabel')} onPress={() => open('/review')} /></View>
      <Text variant='titleMedium'>{t('homeUi.shortcuts')}</Text>
      <View style={styles.row}>{tile('📚', t('tabs.learn'), '/learn')}{tile('📝', t('tabs.exams'), '/exams')}</View>
      <View style={styles.row}>{tile('🔄', t('tabs.review'), '/review')}{tile('📊', t('tabs.progress'), '/progress')}</View>
      <View style={styles.row}>{tile('🔖', `${t('bookmarksUi.title')} (${saved})`, '/review/bookmarks')}{tile('📖', t('glossaryUi.title'), '/learn/glossary')}</View>
      <Panel>
        <Text variant='titleMedium'>{text.mocks}</Text>
        {data.exams.recentMocks.length ? <>
          {metric(text.average, homePercent(data.exams.recentMockAverage))}
          {metric(text.attempts, String(data.exams.recentMocks.length))}
          <Accordion title={text.recentResults}>{data.exams.recentMocks.map((e) => <Pressable key={e.attempt.id} accessibilityRole='button' accessibilityLabel={`${e.correct}/${e.total} · ${e.passed ? text.passed : text.failed}`} onPress={() => open(`/exams/result/${encodeURIComponent(e.attempt.id)}`)} style={[styles.examRow, { borderColor: theme.colors.outlineVariant }]}><View style={styles.grow}><Text variant='bodyMedium'>{bundle.exams.find((x) => x.id === e.attempt.examId)?.title ?? t('tabs.exams')}</Text><Text variant='bodySmall'>{new Date(e.attempt.finishedAt ?? e.attempt.startedAt).toLocaleDateString(i18n.language)}</Text></View><View style={styles.examScore}><Text variant='titleMedium'>{e.correct}/{e.total}</Text><Text variant='labelSmall' style={{ color: e.passed ? theme.colors.secondary : theme.colors.error }}>{e.passed ? text.passed : text.failed}</Text></View></Pressable>)}</Accordion>
        </> : <Text>{text.noMocks}</Text>}
        {metric(text.improvement, data.exams.improvement === null ? '—' : `${data.exams.improvement > 0 ? '+' : ''}${data.exams.improvement.toFixed(1)} ${text.points}`)}
        <Text variant='bodySmall'>{data.exams.improvement === null ? text.noTrend : text.trendHint}</Text>
        <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.mockHint}</Text>
        <Button mode='outlined' onPress={() => open('/exams')}>{text.examsAction}</Button>
      </Panel>
      <Panel>
        <Text variant='titleMedium'>{text.evidence}</Text>
        {metric(text.validated, String(completion.lessonsValidated))}
        {completion.lessonsStudiedWithoutQuiz > 0 ? metric(text.studied, String(completion.lessonsStudiedWithoutQuiz)) : null}
        {metric(text.coverage, data.evidence.coverage.assessableConcepts ? `${data.evidence.coverage.distinctConcepts}/${data.evidence.coverage.assessableConcepts}` : text.noEvidence)}
        {metric(text.practice, evidenceValue(data.evidence.practice.correct, data.evidence.practice.total, data.evidence.practice.accuracy))}
        {metric(text.recall, evidenceValue(data.evidence.delayedRecall.correct, data.evidence.delayedRecall.total, data.evidence.delayedRecall.accuracy))}
        <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.evidenceHint}</Text><Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.recallHint}</Text>
        <Text variant='bodySmall'>{data.evidence.historyStartedAt === null ? text.historyEmpty : `${text.since}: ${new Date(data.evidence.historyStartedAt).toLocaleDateString(i18n.language)}`}</Text>
        {data.evidence.truncatedBefore !== null ? <Text variant='bodySmall'>{text.pruned}</Text> : null}
        <Button mode='outlined' onPress={() => open('/progress')}>{text.details}</Button>
      </Panel>

      <Panel><Text variant='titleMedium'>{t('remindersUi.title')}</Text><Button mode='outlined' onPress={() => open('/settings')}>{t('settings.title')}</Button></Panel>
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { paddingBottom: 24, gap: 16 }, hero: { paddingHorizontal: 20, paddingBottom: 24, gap: 16, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' }, leaf: { position: 'absolute', right: -20, top: 70, fontSize: 170, opacity: 0.12 }, heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, heroBody: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 }, gear: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FDE3E3', alignItems: 'center', justifyContent: 'center' }, mainCta: { backgroundColor: '#FFFFFF', minHeight: 52, padding: 16, borderRadius: 26, justifyContent: 'center' }, alternative: { gap: 4 }, body: { paddingHorizontal: 16, gap: 16 }, strong: { fontWeight: '700' }, row: { flexDirection: 'row', gap: 12 }, grow: { flex: 1, gap: 4 }, tile: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 20 }, tileIcon: { fontSize: 30 }, centerText: { textAlign: 'center' }, between: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 4 }, value: { flexShrink: 1, textAlign: 'right' }, examRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 }, examScore: { alignItems: 'flex-end', gap: 4 } });
