import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Screen } from '../../../../src/components/Screen';
import { useBundle } from '../../../../src/content/useBundle';
import { present } from '../../../../src/logic/quiz';
import { useProgress } from '../../../../src/store/progress';

type Filter = 'wrong' | 'unanswered' | 'all';

export default function MissedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { attemptId, filter: initial } = useLocalSearchParams<{ attemptId: string; filter?: string }>();
  const bundle = useBundle();
  const attempts = useProgress((s) => s.attempts);
  const [filter, setFilter] = useState<Filter>(initial === 'unanswered' || initial === 'all' ? initial : 'wrong');
  const attempt = attempts.find((a) => a.id === attemptId);
  if (!attempt) return null;

  const items = attempt.answers.filter((a) => {
    if (a.correct) return false;
    if (filter === 'wrong') return a.chosen !== null;
    if (filter === 'unanswered') return a.chosen === null;
    return true;
  });

  return (
    <Screen>
      <View style={styles.row}>
        {(['wrong', 'unanswered', 'all'] as const).map((f) => (
          <Button key={f} mode={filter === f ? 'contained' : 'outlined'} onPress={() => setFilter(f)}>
            {f === 'wrong' ? t('exams.wrong') : f === 'unanswered' ? t('exams.unanswered') : t('exams.all')}
          </Button>
        ))}
      </View>
      {items.length === 0 ? <Text variant='bodyLarge'>{t('exams.empty')}</Text> : null}
      {items.map((a) => {
        const q = bundle.questions[a.questionId];
        const p = present(q, attempt.seed);
        return (
          <View key={a.questionId} style={styles.item}>
            <Text variant='bodyLarge'>{q.text}</Text>
            <Text variant='bodyMedium'>{t('learn.yourAnswer', { answer: a.chosen === null ? t('learn.noAnswer') : p.options[a.chosen] })}</Text>
            <Text variant='bodyMedium'>{t('learn.correctAnswer', { answer: p.options[p.correctIndex] })}</Text>
            {q.explanation ? <Text variant='bodySmall'>{q.explanation}</Text> : null}
            {q.lessonId ? (
              <Button compact onPress={() => router.push(`/learn/lesson/${q.lessonId}`)}>
                {t('exams.openLesson')}
              </Button>
            ) : null}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: { gap: 4, paddingVertical: 8 },
});
