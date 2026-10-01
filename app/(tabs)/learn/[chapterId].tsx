import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { Bar } from '../../../src/components/Bar';
import { Panel } from '../../../src/components/Panel';
import { Screen } from '../../../src/components/Screen';
import { getAudio } from '../../../src/content/audio';
import { useBundle } from '../../../src/content/useBundle';
import { deviceLang } from '../../../src/i18n';
import { chapterQuizIds } from '../../../src/logic/quiz';
import { useProgress } from '../../../src/store/progress';
import { useSettings } from '../../../src/store/settings';
import { palette } from '../../../src/theme';

export default function ChapterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const bundle = useBundle();
  const lang = useSettings((s) => s.lang) ?? deviceLang();
  const lessonsRead = useProgress((s) => s.lessonsRead);
  const quizResults = useProgress((s) => s.quizResults);

  const chapter = bundle.chapters.find((c) => c.id === Number(chapterId));
  if (!chapter) return null;

  const count = chapter.lessonIds.length;
  const read = chapter.lessonIds.filter((id) => lessonsRead[id]).length;
  const nextId = chapter.lessonIds.find((id) => !lessonsRead[id]) ?? chapter.lessonIds[0];
  const cta = read === 0 ? t('learnUi.startChapter') : read === count ? t('learnUi.reviewChapter') : t('learnUi.continueChapter');
  const quizIds = chapterQuizIds(bundle, chapter);
  const best = quizResults[`chapter:${chapter.id}`];

  return (
    <Screen>
      <Stack.Screen options={{ title: chapter.title }} />
      <Panel tone='primary'>
        <Text variant='labelLarge' style={{ color: theme.colors.onPrimary }}>
          {t('learnUi.chapter', { n: chapter.order })}
        </Text>
        <Text variant='headlineSmall' style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
          {chapter.title}
        </Text>
        <Bar value={count > 0 ? read / count : 0} color='#FFFFFF' trackColor='rgba(255,255,255,0.3)' height={10} />
        <Text variant='bodyMedium' style={{ color: theme.colors.onPrimary }}>
          {t('learn.chapterProgress', { done: read, total: count })}
        </Text>
        {nextId !== undefined ? (
          <Button mode='contained' buttonColor='#FFFFFF' textColor={theme.colors.primary} onPress={() => router.push(`/learn/lesson/${nextId}`)}>
            {cta}
          </Button>
        ) : null}
      </Panel>

      <Text variant='titleMedium'>{t('learn.lessons')}</Text>
      {chapter.lessonIds.map((id, i) => {
        const lesson = bundle.lessons.find((l) => l.id === id);
        if (!lesson) return null;
        const isRead = Boolean(lessonsRead[id]);
        const result = quizResults[`lesson:${id}`];
        return (
          <Panel key={id} onPress={() => router.push(`/learn/lesson/${id}`)}>
            <View style={styles.row}>
              <View style={[styles.badge, { backgroundColor: isRead ? palette.success : theme.colors.surfaceVariant }]}>
                <Text style={{ color: isRead ? '#FFFFFF' : theme.colors.onSurfaceVariant, fontWeight: '700' }}>{isRead ? '✓' : i + 1}</Text>
              </View>
              <View style={styles.grow}>
                <Text variant='bodyLarge' style={styles.strong}>
                  {lesson.title}
                </Text>
                {result ? <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{`📝 ${result.correct}/${result.total}`}</Text> : null}
              </View>
              {getAudio(lang, id) ? <Text style={styles.audio}>🔊</Text> : null}
              <Text style={styles.chevron}>›</Text>
            </View>
          </Panel>
        );
      })}

      {quizIds.length > 0 ? (
        <Panel tone={best ? 'success' : 'default'} onPress={() => router.push(`/learn/quiz?kind=chapter&id=${chapter.id}`)}>
          <View style={styles.row}>
            <Text style={styles.audio}>🏆</Text>
            <View style={styles.grow}>
              <Text variant='titleMedium'>{t('learn.chapterQuiz')}</Text>
              <Text variant='bodySmall'>{t('learnUi.quizCount', { count: quizIds.length })}</Text>
              {best ? <Text variant='bodySmall'>{t('learn.best', { correct: best.correct, total: best.total })}</Text> : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Panel>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1, gap: 2 },
  strong: { fontWeight: '600' },
  audio: { fontSize: 22 },
  chevron: { fontSize: 28 },
});
