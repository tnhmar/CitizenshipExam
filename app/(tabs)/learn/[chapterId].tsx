import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { Screen } from '../../../src/components/Screen';
import { getAudio } from '../../../src/content/audio';
import { useBundle } from '../../../src/content/useBundle';
import { deviceLang } from '../../../src/i18n';
import { chapterQuizIds } from '../../../src/logic/quiz';
import { useProgress } from '../../../src/store/progress';
import { useSettings } from '../../../src/store/settings';

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

  const quizIds = chapterQuizIds(bundle, chapter);
  const best = quizResults[`chapter:${chapter.id}`];

  return (
    <Screen>
      <Stack.Screen options={{ title: chapter.title }} />
      <Text variant='titleMedium'>{t('learn.lessons')}</Text>
      {chapter.lessonIds.map((id) => {
        const lesson = bundle.lessons.find((l) => l.id === id);
        if (!lesson) return null;
        const result = quizResults[`lesson:${id}`];
        return (
          <Pressable
            key={id}
            accessibilityRole='button'
            onPress={() => router.push(`/learn/lesson/${id}`)}
            style={[styles.row, { borderColor: theme.colors.outlineVariant }]}
          >
            <Text style={styles.mark}>{lessonsRead[id] ? '✓' : '○'}</Text>
            <View style={styles.grow}>
              <Text variant='bodyLarge'>{lesson.title}</Text>
              {result ? <Text variant='bodySmall'>{t('learn.best', { correct: result.correct, total: result.total })}</Text> : null}
            </View>
            {getAudio(lang, id) ? <Text>🔊</Text> : null}
          </Pressable>
        );
      })}
      {quizIds.length > 0 ? (
        <View style={styles.quiz}>
          <Text variant='titleMedium'>{t('learn.chapterQuiz')}</Text>
          <Text variant='bodySmall'>{t('learn.chapterQuizHint', { count: quizIds.length })}</Text>
          {best ? <Text variant='bodySmall'>{t('learn.best', { correct: best.correct, total: best.total })}</Text> : null}
          <Button mode='contained' onPress={() => router.push(`/learn/quiz?kind=chapter&id=${chapter.id}`)}>
            {t('learn.chapterQuiz')}
          </Button>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderRadius: 12 },
  mark: { fontSize: 18, width: 22, textAlign: 'center' },
  grow: { flex: 1 },
  quiz: { gap: 8, marginTop: 8 },
});
