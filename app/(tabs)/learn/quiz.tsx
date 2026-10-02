import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { QuizRunner } from '../../../src/components/QuizRunner';
import { useBundle } from '../../../src/content/useBundle';
import { useChapterFlowText } from '../../../src/i18n/chapterFlow';
import { assessmentChapterId, nextChapterTarget } from '../../../src/logic/chapterFlow';
import { assessmentIds } from '../../../src/logic/completion';
import { useProgress } from '../../../src/store/progress';
import type { ContentBundle } from '../../../src/types';

export default function QuizScreen() {
  const bundle = useBundle(); const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  return <Assessment key={`${bundle.lang}-${kind}-${id}`} bundle={bundle} assessmentKey={`${kind}:${id}`} kind={kind} />;
}
function Assessment({ bundle, assessmentKey, kind }: { bundle: ContentBundle; assessmentKey: string; kind: string }) {
  const { t } = useTranslation(); const flowText = useChapterFlowText(); const router = useRouter();
  const progress = useProgress(); const record = progress.recordQuiz;
  const onComplete = useCallback((r: { correct: number; total: number }) => {
    record(assessmentKey, r.correct, r.total, bundle.lang);
  }, [record, assessmentKey, bundle.lang]);
  const ids = assessmentIds(bundle, assessmentKey);
  const chapterId = assessmentChapterId(bundle, assessmentKey);
  const next = chapterId === null ? null : nextChapterTarget(bundle, progress, chapterId);
  return <View style={styles.root}>
    <Stack.Screen options={{ title: kind === 'chapter' ? t('learn.chapterQuiz') : t('learn.lessonQuiz') }} />
    <QuizRunner questionIds={ids} assessmentKey={assessmentKey} onComplete={onComplete} resultAction={next ? { label: flowText.nextChapter, subject: next.title, onPress: () => router.replace(next.route) } : undefined} />
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1 } });
