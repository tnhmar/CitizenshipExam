import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { QuizRunner } from '../../../src/components/QuizRunner';
import { useBundle } from '../../../src/content/useBundle';
import { chapterQuizIds } from '../../../src/logic/quiz';
import { useProgress } from '../../../src/store/progress';

export default function QuizScreen() {
  const { t } = useTranslation();
  const bundle = useBundle();
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const recordQuiz = useProgress((s) => s.recordQuiz);
  const num = Number(id);
  const ids = useMemo(() => {
    if (kind === 'chapter') {
      const c = bundle.chapters.find((x) => x.id === num);
      return c ? chapterQuizIds(bundle, c) : [];
    }
    const l = bundle.lessons.find((x) => x.id === num);
    return l ? [...l.questionIds] : [];
  }, [kind, num, bundle]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: kind === 'chapter' ? t('learn.chapterQuiz') : t('learn.lessonQuiz') }} />
      <QuizRunner key={`${bundle.lang}-${kind}-${num}`} questionIds={ids} onComplete={(r) => recordQuiz(`${kind}:${num}`, r.correct, r.total)} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
