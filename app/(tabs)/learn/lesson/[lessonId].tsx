import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { activeBlocks, alignSentences, layoutBlocks, sentencesFromTiming } from '../../../../src/audio/alignment';
import { AudioBar } from '../../../../src/components/AudioBar';
import { RichText } from '../../../../src/components/RichText';
import { Screen } from '../../../../src/components/Screen';
import { LESSON_QUIZ_MIN_QUESTIONS } from '../../../../src/config';
import { getAudio } from '../../../../src/content/audio';
import { useBundle } from '../../../../src/content/useBundle';
import { deviceLang } from '../../../../src/i18n';
import { lessonQuizIds } from '../../../../src/logic/quiz';
import { useProgress } from '../../../../src/store/progress';
import { useSettings } from '../../../../src/store/settings';

export default function LessonScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const bundle = useBundle();
  const lang = useSettings((s) => s.lang) ?? deviceLang();
  const markRead = useProgress((s) => s.markLessonRead);
  const setLastRoute = useProgress((s) => s.setLastRoute);
  const addStudyTime = useProgress((s) => s.addStudyTime);
  const [ms, setMs] = useState(0);

  const lesson = bundle.lessons.find((l) => l.id === Number(lessonId));
  const audio = lesson ? getAudio(lang, lesson.id) : undefined;
  const layout = useMemo(() => layoutBlocks(lesson?.blocks ?? []), [lesson]);
  const spans = useMemo(
    () => (audio?.timing ? alignSentences(layout.text, sentencesFromTiming(audio.timing), lesson?.title ?? '') : []),
    [audio, layout, lesson],
  );
  const active = useMemo(() => activeBlocks(layout.ranges, spans, ms), [layout, spans, ms]);

  useEffect(() => {
    if (!lesson) return;
    setLastRoute(`/learn/lesson/${lesson.id}`);
    const start = Date.now();
    return () => addStudyTime(Math.min(Date.now() - start, 1800000));
  }, [lesson, setLastRoute, addStudyTime]);

  if (!lesson) return null;

  const siblings = bundle.chapters.find((c) => c.id === lesson.chapterId)?.lessonIds ?? [];
  const nextId = siblings[siblings.indexOf(lesson.id) + 1];
  const hasQuiz = lessonQuizIds(lesson, LESSON_QUIZ_MIN_QUESTIONS).length > 0;

  const goNext = () => {
    markRead(lesson.id);
    if (nextId !== undefined) router.replace(`/learn/lesson/${nextId}`);
    else router.back();
  };

  return (
    <View style={styles.root}>
      <Screen>
        <Stack.Screen options={{ title: lesson.title }} />
        {lesson.blocks.map((b, i) => {
          const style = active.includes(i) ? { backgroundColor: theme.colors.primaryContainer, borderRadius: 8, padding: 6 } : { padding: 6 };
          if (b.k === 'h') return <RichText key={i} variant='titleMedium' text={b.t} style={style} />;
          return <RichText key={i} text={b.k === 'li' ? `• ${b.t}` : b.t} style={style} />;
        })}
        {hasQuiz ? (
          <Button
            mode='outlined'
            onPress={() => {
              markRead(lesson.id);
              router.push(`/learn/quiz?kind=lesson&id=${lesson.id}`);
            }}
          >
            {t('learn.lessonQuiz')}
          </Button>
        ) : null}
        <Button mode='contained' onPress={goNext}>
          {nextId !== undefined ? t('learn.nextLesson') : t('learn.backToChapter')}
        </Button>
        {audio ? <View style={styles.spacer} /> : null}
      </Screen>
      {audio ? (
        <View style={styles.floating}>
          <AudioBar source={audio.audio} onTime={setMs} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  spacer: { height: 72 },
  floating: { position: 'absolute', left: 12, right: 12, bottom: 12 },
});
