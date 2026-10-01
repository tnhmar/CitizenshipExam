import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { Screen } from '../../../../src/components/Screen';
import { ScoreRing } from '../../../../src/components/ScoreRing';
import { useBundle } from '../../../../src/content/useBundle';
import { averageTimeMs, byChapter, summarize } from '../../../../src/logic/exam';
import { useProgress } from '../../../../src/store/progress';

export default function ResultScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const bundle = useBundle();
  const attempts = useProgress((s) => s.attempts);
  const attempt = attempts.find((a) => a.id === attemptId);
  if (!attempt) return null;

  const s = summarize(attempt.answers, attempt.questionIds.length, bundle.passMark, bundle.examSize);
  const chapters = byChapter(bundle, attempt.answers);
  const timeUp = attempt.finishedAt !== null && attempt.finishedAt - attempt.startedAt >= attempt.limitMs;

  return (
    <Screen>
      <View style={styles.center}>
        <ScoreRing value={s.percent} size={160} color={s.passed ? '#2E7D32' : '#C62828'} label={`${s.score}/${s.total}`} />
        <Text variant='headlineSmall'>{`${s.passed ? '🟢' : '🔴'} ${s.passed ? t('exams.passed') : t('exams.failed')}`}</Text>
        <Text variant='bodyMedium'>{t('exams.needed', { required: s.required })}</Text>
        {timeUp ? <Text style={{ color: theme.colors.error }}>{t('exams.timeUp')}</Text> : null}
      </View>
      <Text variant='bodyLarge'>{`${t('exams.correct')}: ${s.score} · ${t('exams.wrong')}: ${s.wrong} · ${t('exams.unanswered')}: ${s.unanswered}`}</Text>
      <Text variant='bodyMedium'>{t('exams.avgTime', { seconds: Math.round(averageTimeMs(attempt.answers) / 1000) })}</Text>
      <Text variant='titleMedium'>{t('exams.byChapter')}</Text>
      {Object.entries(chapters).map(([key, v]) => (
        <Text key={key} variant='bodyMedium'>{`${bundle.chapters.find((c) => c.id === Number(key))?.title ?? t('exams.other')}: ${v.correct} / ${v.total}`}</Text>
      ))}
      <Button mode='contained' onPress={() => router.push(`/exams/missed/${attempt.id}?filter=wrong`)}>
        {t('exams.reviewMistakes')}
      </Button>
      <Button mode='outlined' onPress={() => router.replace(`/exams/${attempt.examId}`)}>
        {t('exams.retake')}
      </Button>
      <Button onPress={() => router.replace('/exams')}>{t('exams.backToList')}</Button>
    </Screen>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', gap: 8 } });
