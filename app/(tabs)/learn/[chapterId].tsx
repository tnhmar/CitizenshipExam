import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { Bar } from '../../../src/components/Bar';
import { Panel } from '../../../src/components/Panel';
import { getAudio } from '../../../src/content/audio';
import { chapterCover } from '../../../src/content/covers';
import { useBundle } from '../../../src/content/useBundle';
import { useChapterFlowText } from '../../../src/i18n/chapterFlow';
import { useCompletionText } from '../../../src/i18n/completion';
import { courseCompleted, nextChapterTarget } from '../../../src/logic/chapterFlow';
import { assessmentIds, chapterStatus, lessonStatus } from '../../../src/logic/completion';
import { useProgress } from '../../../src/store/progress';
import { palette } from '../../../src/theme';

export default function ChapterScreen() {
  const { t } = useTranslation(); const text = useCompletionText(); const flowText = useChapterFlowText(); const router = useRouter(); const theme = useTheme();
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>(); const bundle = useBundle(); const progress = useProgress();
  const chapter = bundle.chapters.find((c) => c.id === Number(chapterId)); if (!chapter) return null;
  const key = `chapter:${chapter.id}`; const count = chapter.lessonIds.length;
  const done = chapter.lessonIds.filter((id) => lessonStatus(progress, id) === 'completed').length;
  const nextId = chapter.lessonIds.find((id) => lessonStatus(progress, id) !== 'completed');
  const status = chapterStatus(progress, chapter); const quizIds = assessmentIds(bundle, key);
  const latest = progress.quizResults[key]; const best = progress.quizBest[key]; const passed = Boolean(progress.quizPassed[key]);
  const next = nextChapterTarget(bundle, progress, chapter.id);
  const hint = !quizIds.length ? text.noChapterQuiz : status === 'completed' ? text.earned : done === count ? text.chapterQuizRemaining : passed ? text.chapterPassedPending : text.chapterPending;
  return <View style={styles.root}><Stack.Screen options={{ title: chapter.title }} />
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
      <Panel><View style={styles.row}><View style={styles.grow}><Text variant='labelLarge'>{t('lessonUi.chapterLabel', { n: chapter.order })}</Text><Text variant='headlineSmall' style={{ color: theme.colors.secondary, fontWeight: '700' }}>{chapter.title}</Text></View><Text style={styles.cover}>{chapterCover(chapter.order)}</Text></View>
        <Bar value={count ? done / count : 0} height={10} color={status === 'completed' ? palette.success : theme.colors.secondary} /><Text>{done}/{count} · {text.completedLessons}</Text><Text>{text[status]}</Text><Text variant='bodySmall'>{hint}</Text>
        {status === 'completed' ? <Text variant='bodySmall'>{courseCompleted(bundle, progress) ? flowText.courseCompleted : flowText.chapterCompleted}</Text> : null}
        {nextId !== undefined ? <Button mode='contained' onPress={() => router.push(`/learn/lesson/${nextId}`)}>{status === 'notStarted' ? t('learnUi.startChapter') : t('learnUi.continueChapter')}</Button> : status === 'completed' && chapter.lessonIds[0] !== undefined ? <Button mode='outlined' onPress={() => router.push(`/learn/lesson/${chapter.lessonIds[0]}`)}>{t('learnUi.reviewChapter')}</Button> : null}
      </Panel>
      {chapter.lessonIds.map((id, i) => { const lesson = bundle.lessons.find((l) => l.id === id); if (!lesson) return null; const state = lessonStatus(progress, id); const result = progress.quizResults[`lesson:${id}`]; return <Panel key={id} onPress={() => router.push(`/learn/lesson/${id}`)}><View style={styles.row}><View style={styles.grow}><Text variant='labelSmall'>{t('lessonUi.lessonLabel', { n: i + 1 })}</Text><Text variant='titleMedium'>{lesson.title}</Text><Text variant='labelMedium'>{text[state]}</Text><View style={styles.meta}>{getAudio(bundle.lang, id) ? <Text>🔊</Text> : null}{result ? <Text variant='labelSmall'>{text.latest}: {result.correct}/{result.total}</Text> : null}</View></View><View style={[styles.badge, { backgroundColor: theme.colors.surfaceVariant }]}><Text style={{ color: state === 'completed' ? palette.success : theme.colors.secondary, fontSize: 24 }}>{state === 'completed' ? '✓' : state === 'inProgress' ? '◐' : '›'}</Text></View></View></Panel>; })}
    </ScrollView>
    {next ? <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
      <Text variant='bodySmall' style={styles.nextTitle}>{next.title}</Text>
      <Button mode='contained' buttonColor={theme.colors.secondary} textColor={theme.colors.onSecondary} onPress={() => router.push(next.route)}>{flowText.nextChapter}</Button>
      {quizIds.length > 0 ? <Button onPress={() => router.push(`/learn/quiz?kind=chapter&id=${chapter.id}`)}>{t('learn.chapterQuiz')}</Button> : null}
    </View> : quizIds.length > 0 ? <View style={[styles.footer, { backgroundColor: theme.colors.background }]}><Pressable accessibilityRole='button' onPress={() => router.push(`/learn/quiz?kind=chapter&id=${chapter.id}`)} style={[styles.practice, { backgroundColor: theme.colors.secondary }]}><View style={styles.grow}><Text style={{ color: theme.colors.onSecondary }}>{t('learnUi.quizCount', { count: quizIds.length })} · 90%</Text>{latest ? <Text style={{ color: theme.colors.onSecondary }}>{text.latest}: {latest.correct}/{latest.total}</Text> : null}{best ? <Text style={{ color: theme.colors.onSecondary }}>{text.best}: {best.correct}/{best.total}</Text> : null}<Text variant='titleMedium' style={{ color: theme.colors.onSecondary }}>{passed ? '✓ ' : ''}{t('learn.chapterQuiz')}</Text></View><Text style={{ color: theme.colors.onSecondary, fontSize: 26 }}>›</Text></Pressable></View> : null}
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, content: { padding: 16, gap: 12 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, grow: { flex: 1, gap: 4 }, cover: { fontSize: 56, lineHeight: 70 }, meta: { flexDirection: 'row', gap: 10 }, badge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, footer: { padding: 16, gap: 6 }, nextTitle: { textAlign: 'center' }, practice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 22 } });
