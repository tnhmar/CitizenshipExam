import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { Accordion } from '../../src/components/Accordion';
import { Bar } from '../../src/components/Bar';
import { Panel } from '../../src/components/Panel';
import { Screen } from '../../src/components/Screen';
import { DistributionRing, ExamTrendChart, TopicAccuracyChart } from '../../src/components/ProgressCharts';
import { StatCard } from '../../src/components/StatCard';
import { useBundle } from '../../src/content/useBundle';
import { useCompletionText } from '../../src/i18n/completion';
import { useProgressChartText } from '../../src/i18n/progressCharts';
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
  const { t, i18n } = useTranslation(); const text = useProgressLearningText(); const charts = useProgressChartText(); const completionText = useCompletionText();
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
  const step = homeStep(data.nextAction, bundle); const completion = data.completion;
  const notStarted = Math.max(0, completion.lessonsTotal - completion.lessonsCompleted - completion.lessonsInProgress);
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
    <Panel>
      <Text variant='titleLarge'>{text.completion}</Text>
      <DistributionRing label={text.completion} center={`${completion.lessonsCompleted}/${completion.lessonsTotal}`} segments={[
        { label: text.lessonStatuses.completed, value: completion.lessonsCompleted, color: scoreColour(true) },
        { label: text.lessonStatuses.inProgress, value: completion.lessonsInProgress, color: theme.colors.secondary },
        { label: text.lessonStatuses.notStarted, value: notStarted, color: theme.colors.outlineVariant },
      ]} />
      <View style={styles.summary}><Text variant='titleMedium'>{completion.chaptersCompleted}/{completion.chaptersTotal} {charts.chapters}</Text><Text variant='labelMedium'>{text.validated}: {completion.lessonsValidated}</Text>{completion.lessonsStudiedWithoutQuiz > 0 ? <Text variant='labelMedium'>{text.studied}: {completion.lessonsStudiedWithoutQuiz}</Text> : null}</View>
      <Button mode='contained' buttonColor={theme.colors.secondary} textColor={theme.colors.onSecondary} onPress={() => open(step.route)}>{text.actions[data.nextAction.kind]}</Button>
      {step.subject ? <Text variant='bodySmall' style={styles.centerText}>{step.subject}</Text> : null}
    </Panel>
    <Panel>
      <Text variant='titleMedium'>{text.coverage}</Text>
      <DistributionRing label={text.coverage} center={homePercent(data.evidence.coverage.coverage)} segments={[
        { label: charts.assessed, value: data.evidence.coverage.distinctConcepts, color: theme.colors.secondary },
        { label: charts.unassessed, value: Math.max(0, data.evidence.coverage.assessableConcepts - data.evidence.coverage.distinctConcepts), color: theme.colors.outlineVariant },
      ]} />
      {metric(text.practice, progressEvidence(data.evidence.practice) ?? text.noEvidence)}
      <Accordion title={charts.details}>
        <Text variant='bodySmall'>{text.coverageHint}</Text><Text variant='bodySmall'>{text.evidenceHint}</Text>
        <Text variant='bodySmall'>{data.evidence.historyStartedAt === null ? charts.recordingEmpty : `${text.since}: ${dateLabel(data.evidence.historyStartedAt)}`}</Text>
        {data.evidence.truncatedBefore !== null ? <Text variant='bodySmall'>{text.pruned}</Text> : null}
      </Accordion>
    </Panel>
    <Panel>
      <Text variant='titleMedium'>{text.recall}</Text>
      <DistributionRing label={text.recall} center={homePercent(data.evidence.delayedRecall.accuracy)} segments={[
        { label: charts.correctRecall, value: data.evidence.delayedRecall.correct, color: scoreColour(true) },
        { label: charts.missedRecall, value: Math.max(0, data.evidence.delayedRecall.total - data.evidence.delayedRecall.correct), color: scoreColour(false) },
      ]} />
      {data.evidence.delayedRecall.total === 0 ? <Text variant='bodySmall'>{text.noEvidence}</Text> : null}
      <Accordion title={charts.details}><Text variant='bodySmall'>{text.recallHint}</Text><Text variant='bodySmall'>{text.recallEvidenceHint}</Text></Accordion>
      <Button mode='outlined' onPress={() => open('/review')}>{text.reviewAction}</Button>
    </Panel>
    <Panel>
      <Text variant='titleMedium'>{text.mocks}</Text>
      <View style={styles.summary}><Text variant='headlineMedium'>{homePercent(data.exams.recentMockAverage)}</Text><Text variant='labelMedium'>{text.average} · {data.exams.recentMocks.length} {text.attempts}</Text></View>
      <ExamTrendChart rows={data.exams.recentMocks} onSelect={(id) => open(`/exams/result/${encodeURIComponent(id)}`)} formatDate={dateLabel} emptyLabel={text.noMocks} passedLabel={text.passed} failedLabel={text.failed} targetLabel={charts.examTarget} />
      <Text variant='bodySmall' style={styles.centerText}>{charts.attemptOrder}</Text>
      {metric(text.improvement, data.exams.improvement === null ? '—' : `${data.exams.improvement > 0 ? '+' : ''}${data.exams.improvement.toFixed(1)} ${text.points}`)}
      <Accordion title={charts.details}><Text variant='bodySmall'>{data.exams.improvement === null ? text.noTrend : text.trendHint}</Text><Text variant='bodySmall'>{text.mockHint}</Text><Text variant='bodySmall'>{text.examRuleHint}</Text>{data.exams.recentMocks.map(examRow)}</Accordion>
      <Button mode='outlined' onPress={() => open('/exams')}>{text.examsAction}</Button>
    </Panel>
    <Panel>
      <Text variant='titleMedium'>{text.reviewWorkload}</Text>
      <DistributionRing label={text.reviewWorkload} center={String(data.review.due)} segments={[
        { label: text.overdue, value: data.review.overdue, color: scoreColour(false) },
        { label: charts.dueToday, value: Math.max(0, data.review.due - data.review.overdue), color: theme.colors.secondary },
      ]} />
      {data.review.due === 0 ? <Text variant='bodySmall'>{text.noDue}</Text> : null}
      <Accordion title={charts.details}><Text variant='bodySmall'>{text.overdueHint}</Text></Accordion>
      <Button mode='outlined' onPress={() => open('/review')}>{text.reviewAction}</Button>
    </Panel>
    <Panel>
      <Text variant='titleMedium'>{text.history}</Text>
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
      <Text variant='titleMedium'>{charts.topics}</Text>
      <TopicAccuracyChart topics={data.evidence.topics} titleForTopic={(id) => bundle.chapters.find((c) => c.id === id)?.title ?? String(id)} statusLabel={(status) => text.topicLabels[status]} onSelect={(id) => open(`/learn/${id}`)} emptyLabel={text.noEvidence} showAllLabel={charts.showAll} showLessLabel={charts.showLess} />
      <Text variant='bodySmall'>{charts.topicsHint}</Text>
      <Accordion title={charts.details}><Text variant='bodySmall'>{text.topicHint}</Text><Text variant='bodySmall'>{text.topicRule}</Text></Accordion>
    </Panel>
    <Accordion title={charts.chapterDetails}>
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
    </Accordion>
    <Accordion title={charts.activity}>
      <View style={styles.row}><StatCard icon='⏱' value={formatDuration(progress.studyMs)} label={text.readerTime} /><StatCard icon='🔥' value={String(progress.streak.best)} label={text.bestStreak} /></View>
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.activityHint}</Text>
    </Accordion>
  </Screen>;
}
const styles = StyleSheet.create({ grow: { flex: 1, gap: 4 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, summary: { alignItems: 'center', gap: 4, paddingVertical: 8 }, centerText: { textAlign: 'center' }, metric: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 4 }, metricValue: { flexShrink: 1, textAlign: 'right' }, examRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 }, score: { alignItems: 'flex-end', gap: 4 }, topicBlock: { gap: 6, paddingVertical: 8 }, lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 } });
