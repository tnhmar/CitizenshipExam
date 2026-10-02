import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { Accordion } from '../../src/components/Accordion';
import { Bar } from '../../src/components/Bar';
import { Panel } from '../../src/components/Panel';
import { Screen } from '../../src/components/Screen';
import { ScoreRing } from '../../src/components/ScoreRing';
import { StatCard } from '../../src/components/StatCard';
import { useBundle } from '../../src/content/useBundle';
import { useCompletionText } from '../../src/i18n/completion';
import { useProgressLearningText } from '../../src/i18n/progressLearning';
import { snapshot } from '../../src/logic/dashboardStats';
import { homePercent, homeStep } from '../../src/logic/homePresentation';
import { finishedExamEvidence, type ExamEvidence, type TopicEvidence } from '../../src/logic/learningStats';
import { progressChapter, progressEvidence, progressHistory, progressScoreColour, type ProgressChapterRow, type ProgressQuizScore } from '../../src/logic/progressPresentation';
import { formatDuration, mostMissed } from '../../src/logic/stats';
import { needsTabAnchor } from '../../src/navigation/tabRoots';
import { useProgress } from '../../src/store/progress';

const stamp = (): number => Date.now();
export default function ProgressScreen() {
  const { t, i18n } = useTranslation(); const text = useProgressLearningText(); const completionText = useCompletionText();
  const router = useRouter(); const theme = useTheme(); const bundle = useBundle(); const progress = useProgress();
  const [now, setNow] = useState(stamp);
  useFocusEffect(useCallback(() => {
    setNow(stamp());
    const timer = setInterval(() => setNow(stamp()), 60000);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') setNow(stamp()); });
    return () => { clearInterval(timer); listener.remove(); };
  }, []));
  const data = useMemo(() => snapshot(bundle, progress, now), [bundle, progress, now]);
  const history = useMemo(() => progressHistory(bundle, progress.attempts, now), [bundle, progress.attempts, now]);
  const finished = useMemo(() => finishedExamEvidence(bundle, progress.attempts, now), [bundle, progress.attempts, now]);
  const chapters = useMemo(() => bundle.chapters.map((c) => progressChapter(bundle, progress, c.id)).filter((row): row is ProgressChapterRow => row !== null), [bundle, progress]);
  const weak = [...data.evidence.topics].filter((topic) => topic.status === 'needsReview').sort((a, b) => (a.accuracy ?? 1) - (b.accuracy ?? 1)).slice(0, 3);
  const step = homeStep(data.nextAction, bundle); const completion = data.completion;
  const completionPercent = completion.lessonsTotal ? completion.lessonsCompleted * 100 / completion.lessonsTotal : 0;
  const cardList = Object.values(progress.cards);
  const open = (route: string) => router.push(route, { withAnchor: needsTabAnchor(route) });
  const scoreColour = (passed: boolean) => progressScoreColour(passed, theme.dark);
  const dateLabel = (at: number | null) => at === null || !Number.isFinite(at) ? text.noEvidence : new Date(at).toLocaleDateString(i18n.language);
  const metric = (label: string, value: string) => <View style={styles.metric}><Text variant='bodyMedium' style={styles.grow}>{label}</Text><Text variant='labelLarge' style={styles.metricValue}>{value}</Text></View>;
  const quizValue = (score: ProgressQuizScore | null) => score ? `${score.correct}/${score.total} · ${score.passed ? text.quizPassed : text.quizFailed}` : text.noQuizResult;
  const examRow = (exam: ExamEvidence) => <Pressable key={exam.attempt.id} accessibilityRole='button' accessibilityLabel={`${exam.correct}/${exam.total} · ${exam.passed ? text.passed : text.failed}`} onPress={() => open(`/exams/result/${encodeURIComponent(exam.attempt.id)}`)} style={[styles.examRow, { borderColor: theme.colors.outlineVariant }]}>
    <View style={styles.grow}><Text variant='bodyMedium'>{bundle.exams.find((e) => e.id === exam.attempt.examId)?.title ?? t('tabs.exams')}</Text><Text variant='bodySmall'>{dateLabel(exam.attempt.finishedAt)}</Text><Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.passRequired}: {exam.required}/{exam.total}</Text></View>
    <View style={styles.score}><Text variant='titleMedium'>{exam.correct}/{exam.total}</Text><Text variant='labelSmall' style={{ color: scoreColour(exam.passed) }}>{exam.passed ? text.passed : text.failed}</Text></View>
  </Pressable>;
  const topicBlock = (topic: TopicEvidence) => <View style={styles.topicBlock}>
    <Text variant='labelLarge' style={{ color: topic.status === 'needsReview' ? scoreColour(false) : topic.status === 'strongEvidence' ? scoreColour(true) : theme.colors.onSurfaceVariant }}>{text.topicLabels[topic.status]}</Text>
    {metric(text.topicCoverage, topic.assessableConcepts ? `${topic.distinctConcepts}/${topic.assessableConcepts}` : text.noEvidence)}
    {metric(text.topicEvidence, progressEvidence(topic) ?? text.noEvidence)}
    {metric(text.assessmentDays, String(topic.days))}
    {metric(text.lastAssessed, dateLabel(topic.lastAssessedAt))}
    {topic.coverage !== null ? <Bar value={topic.coverage} color={theme.colors.secondary} /> : null}
  </View>;
  return <Screen>
    {bundle.sample ? <Panel tone='warning'><Text>{t('common.sampleBanner')}</Text></Panel> : null}
    <Panel tone='primary'>
      <View style={styles.hero}><ScoreRing value={completionPercent} label={`${completion.lessonsCompleted}/${completion.lessonsTotal}`} size={120} color={theme.colors.onPrimary} trackColor={theme.colors.primaryContainer} textColor={theme.colors.onPrimary} /><View style={styles.grow}><Text variant='titleLarge' style={{ color: theme.colors.onPrimary }}>{text.completion}</Text><Text style={{ color: theme.colors.onPrimary }}>{text.lessonsCompleted}: {completion.lessonsCompleted}/{completion.lessonsTotal}</Text><Text style={{ color: theme.colors.onPrimary }}>{text.chaptersCompleted}: {completion.chaptersCompleted}/{completion.chaptersTotal}</Text><Text style={{ color: theme.colors.onPrimary }}>{text.inProgress}: {completion.lessonsInProgress}</Text></View></View>
      <Text variant='bodySmall' style={{ color: theme.colors.onPrimary }}>{text.completionHint}</Text>
      <Text variant='labelLarge' style={{ color: theme.colors.onPrimary }}>{text.next}</Text>
      <Button mode='contained' buttonColor={theme.colors.surface} textColor={theme.colors.onSurface} onPress={() => open(step.route)}>{text.actions[data.nextAction.kind]}</Button>
      {step.subject ? <Text variant='bodySmall' style={{ color: theme.colors.onPrimary }}>{step.subject}</Text> : null}
    </Panel>
    <Panel>
      <Text variant='titleMedium'>{text.coverage}</Text>
      {metric(text.validated, String(completion.lessonsValidated))}
      {completion.lessonsStudiedWithoutQuiz > 0 ? metric(text.studied, String(completion.lessonsStudiedWithoutQuiz)) : null}
      {metric(text.coverage, data.evidence.coverage.assessableConcepts ? `${data.evidence.coverage.distinctConcepts}/${data.evidence.coverage.assessableConcepts} · ${homePercent(data.evidence.coverage.coverage)}` : text.noEvidence)}
      {data.evidence.coverage.coverage !== null ? <Bar value={data.evidence.coverage.coverage} color={theme.colors.secondary} /> : null}
      {metric(text.practice, progressEvidence(data.evidence.practice) ?? text.noEvidence)}
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.coverageHint}</Text>
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.evidenceHint}</Text>
      <Text variant='bodySmall'>{data.evidence.historyStartedAt === null ? text.historyEmpty : `${text.since}: ${dateLabel(data.evidence.historyStartedAt)}`}</Text>
      {data.evidence.truncatedBefore !== null ? <Text variant='bodySmall'>{text.pruned}</Text> : null}
    </Panel>
    <Panel>
      <Text variant='titleMedium'>{text.recall}</Text>
      <Text variant='headlineSmall'>{progressEvidence(data.evidence.delayedRecall) ?? text.noEvidence}</Text>
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.recallHint}</Text>
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.recallEvidenceHint}</Text>
      <Button mode='outlined' onPress={() => open('/review')}>{text.reviewAction}</Button>
    </Panel>
    <Panel>
      <Text variant='titleMedium'>{text.mocks}</Text>
      {data.exams.recentMocks.length > 0 ? <>
        {metric(text.average, homePercent(data.exams.recentMockAverage))}
        {metric(text.attempts, String(data.exams.recentMocks.length))}
        <Accordion title={text.recentResults}>{data.exams.recentMocks.map(examRow)}</Accordion>
      </> : <Text>{text.noMocks}</Text>}
      {metric(text.improvement, data.exams.improvement === null ? '—' : `${data.exams.improvement > 0 ? '+' : ''}${data.exams.improvement.toFixed(1)} ${text.points}`)}
      <Text variant='bodySmall'>{data.exams.improvement === null ? text.noTrend : text.trendHint}</Text>
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.mockHint}</Text>
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.examRuleHint}</Text>
      <Button mode='outlined' onPress={() => open('/exams')}>{text.examsAction}</Button>
    </Panel>
    <Panel>
      <Text variant='titleMedium'>{text.reviewWorkload}</Text>
      <View style={styles.row}><StatCard icon='🔄' value={String(data.review.due)} label={text.due} /><StatCard icon='⏳' value={String(data.review.overdue)} label={text.overdue} tone={data.review.overdue ? 'warning' : 'default'} /></View>
      {data.review.due === 0 ? <Text variant='bodySmall'>{text.noDue}</Text> : null}
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.overdueHint}</Text>
      <Button mode='outlined' onPress={() => open('/review')}>{text.reviewAction}</Button>
    </Panel>
    <Panel>
      <Text variant='titleMedium'>{text.history}</Text>
      {metric(text.finishedExams, String(finished.length))}
      {metric(text.bestExam, data.exams.best ? `${data.exams.best.correct}/${data.exams.best.total} · ${homePercent(data.exams.best.ratio)}` : '—')}
      {history.length > 0 ? <Accordion title={text.history}>
        <View style={styles.chart}>{[...history].reverse().map((exam) => <Pressable key={exam.attempt.id} accessibilityRole='button' accessibilityLabel={`${exam.correct}/${exam.total} · ${exam.passed ? text.passed : text.failed}`} onPress={() => open(`/exams/result/${encodeURIComponent(exam.attempt.id)}`)} style={styles.barColumn}>
          <Text variant='labelSmall' numberOfLines={1} adjustsFontSizeToFit style={{ color: scoreColour(exam.passed) }}>{exam.correct}/{exam.total}</Text>
          <View style={[styles.bar, { height: exam.ratio * 90, backgroundColor: scoreColour(exam.passed) }]} />
        </Pressable>)}</View>
        <Text variant='bodySmall'>{text.chartLegend}</Text>
        {history.map(examRow)}
      </Accordion> : <Text>{text.historyEmpty}</Text>}
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.historyHint}</Text>
    </Panel>
    <Panel>
      <Text variant='titleMedium'>{text.focus}</Text>
      {weak.length > 0 ? weak.map((topic) => <View key={topic.chapterId} style={styles.topicBlock}>
        <Text variant='titleSmall'>{bundle.chapters.find((c) => c.id === topic.chapterId)?.title ?? String(topic.chapterId)}</Text>
        {topicBlock(topic)}
        <Button mode='outlined' onPress={() => open(`/learn/${topic.chapterId}`)}>{text.openChapter}</Button>
      </View>) : <Text variant='bodySmall'>{text.focusEmpty}</Text>}
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.topicHint}</Text>
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.topicRule}</Text>
    </Panel>
    <Text variant='titleMedium'>{text.chapters}</Text>
    {chapters.map((chapter) => {
      const topic = data.evidence.topics.find((entry) => entry.chapterId === chapter.id);
      const missed = mostMissed(bundle, cardList, chapter.id, 3);
      const requirement = chapter.status === 'completed' ? text.validationEarned : !chapter.quizAvailable ? text.noChapterQuiz : chapter.quizPassed ? completionText.chapterPassedPending : chapter.completed === chapter.total ? text.chapterQuizRemaining : text.chapterQuizPending;
      return <Accordion key={chapter.id} title={chapter.title} subtitle={`${text.lessonStatuses[chapter.status]} · ${chapter.completed}/${chapter.total}`}>
        <Text variant='labelLarge' style={{ color: chapter.status === 'completed' ? scoreColour(true) : theme.colors.onSurfaceVariant }}>{text.lessonStatuses[chapter.status]}</Text>
        {metric(text.lessonCoverage, `${chapter.completed}/${chapter.total}`)}
        <Bar value={chapter.total ? chapter.completed / chapter.total : 0} color={chapter.status === 'completed' ? scoreColour(true) : theme.colors.secondary} height={10} />
        <Text variant='bodySmall'>{requirement}</Text>
        {chapter.lessons.map((lesson) => <Pressable key={lesson.id} accessibilityRole='button' accessibilityState={{ disabled: !lesson.available }} accessibilityLabel={`${lesson.title} · ${text.lessonStatuses[lesson.status]}`} disabled={!lesson.available} onPress={() => open(`/learn/lesson/${lesson.id}`)} style={[styles.lessonRow, { borderColor: theme.colors.outlineVariant }]}>
          <Text style={{ color: lesson.status === 'completed' ? scoreColour(true) : theme.colors.onSurfaceVariant, fontSize: 18 }}>{lesson.status === 'completed' ? '✓' : lesson.status === 'inProgress' ? '◐' : '○'}</Text>
          <View style={styles.grow}><Text variant='bodyMedium'>{lesson.title}</Text><Text variant='labelSmall'>{text.lessonStatuses[lesson.status]}</Text>{lesson.studiedWithoutQuiz ? <Text variant='bodySmall'>{text.studied}</Text> : null}{!lesson.available ? <Text variant='bodySmall'>{text.contentUnavailable}</Text> : null}{lesson.latest ? <Text variant='bodySmall' style={{ color: scoreColour(lesson.latest.passed) }}>{text.latestQuiz}: {quizValue(lesson.latest)}</Text> : null}</View>
        </Pressable>)}
        {metric(text.latestQuiz, quizValue(chapter.latest))}
        {chapter.best ? metric(text.bestQuiz, `${chapter.best.correct}/${chapter.best.total}`) : null}
        {topic ? <><Text variant='titleSmall'>{text.topicEvidence}</Text>{topicBlock(topic)}</> : null}
        <Text variant='titleSmall'>{text.historicMisses}</Text>
        <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.historicHint}</Text>
        {missed.length ? missed.map((q) => <Text key={q.id} variant='bodySmall'>{`• ${q.text}`}</Text>) : <Text variant='bodySmall'>{text.noHistoricMisses}</Text>}
        <Button mode='outlined' onPress={() => open(`/learn/${chapter.id}`)}>{text.openChapter}</Button>
      </Accordion>;
    })}
    <Panel>
      <Text variant='titleMedium'>{text.activity}</Text>
      <View style={styles.row}><StatCard icon='⏱' value={formatDuration(progress.studyMs)} label={text.readerTime} /><StatCard icon='🔥' value={String(progress.streak.best)} label={text.bestStreak} /></View>
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.activityHint}</Text>
    </Panel>
  </Screen>;
}
const styles = StyleSheet.create({ hero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 }, grow: { flex: 1, gap: 4 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, metric: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 4 }, metricValue: { flexShrink: 1, textAlign: 'right' }, examRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 }, score: { alignItems: 'flex-end', gap: 4 }, chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, gap: 6 }, barColumn: { flex: 1, height: 120, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }, bar: { width: '70%', borderRadius: 8 }, topicBlock: { gap: 6, paddingVertical: 8 }, lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 } });
