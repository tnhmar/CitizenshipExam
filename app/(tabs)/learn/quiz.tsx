import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { QuizRunner } from '../../../src/components/QuizRunner';
import { useBundle } from '../../../src/content/useBundle';
import { useCompletionText } from '../../../src/i18n/completion';
import { assessmentIds, passesLearningQuiz } from '../../../src/logic/completion';
import { useProgress } from '../../../src/store/progress';
import type { ContentBundle } from '../../../src/types';

export default function QuizScreen() {
  const bundle = useBundle(); const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  return <Assessment key={`${bundle.lang}-${kind}-${id}`} bundle={bundle} assessmentKey={`${kind}:${id}`} kind={kind} />;
}
function Assessment({ bundle, assessmentKey, kind }: { bundle: ContentBundle; assessmentKey: string; kind: string }) {
  const { t } = useTranslation(); const text = useCompletionText(); const theme = useTheme();
  const record = useProgress((s) => s.recordQuiz); const earned = useProgress((s) => Boolean(s.quizPassed[assessmentKey]));
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const onComplete = useCallback((r: { correct: number; total: number }) => { record(assessmentKey, r.correct, r.total, bundle.lang); setResult(r); }, [record, assessmentKey, bundle.lang]);
  const ids = assessmentIds(bundle, assessmentKey);
  return <View style={styles.root}><Stack.Screen options={{ title: kind === 'chapter' ? t('learn.chapterQuiz') : t('learn.lessonQuiz') }} />
    <View style={[styles.notice, { backgroundColor: theme.colors.surface }]}><Text>90% · {text.practiceOnly}</Text>{earned ? <Text>{text.earned}</Text> : null}{result ? <Text accessibilityLiveRegion='polite'>{text.latest}: {result.correct}/{result.total} · {passesLearningQuiz(result.correct, result.total) ? text.quizPassed : text.quizFailed}</Text> : null}{!ids.length ? <Text>{text.unavailable}</Text> : null}</View>
    <QuizRunner questionIds={ids} onComplete={onComplete} />
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, notice: { paddingHorizontal: 16, paddingVertical: 8, gap: 4 } });
