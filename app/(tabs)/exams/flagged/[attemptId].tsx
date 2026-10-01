import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Panel } from '../../../../src/components/Panel';
import { Screen } from '../../../../src/components/Screen';
import { useBundle } from '../../../../src/content/useBundle';
import { present } from '../../../../src/logic/quiz';
import { useProgress } from '../../../../src/store/progress';
import { palette } from '../../../../src/theme';

export default function FlaggedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const bundle = useBundle();
  const attempts = useProgress((s) => s.attempts);
  const attempt = attempts.find((a) => a.id === attemptId);
  if (!attempt) return null;

  const flags = attempt.flags ?? [];
  const items = attempt.answers.filter((a) => flags.includes(a.questionId));

  return (
    <Screen>
      <Text variant='bodyMedium'>{t('examUi.flaggedHint')}</Text>
      {items.length === 0 ? <Text variant='bodyLarge'>{t('examUi.nothing')}</Text> : null}
      {items.map((a) => {
        const q = bundle.questions[a.questionId];
        const p = present(q, attempt.seed);
        const blank = a.chosen === null;
        return (
          <Panel key={a.questionId} tone={a.correct ? 'success' : blank ? 'warning' : 'danger'}>
            <Text variant='bodyLarge' style={styles.strong}>{`⚑ ${q.text}`}</Text>
            <Text variant='labelLarge' style={{ color: a.correct ? palette.success : blank ? palette.warning : palette.danger }}>
              {a.correct ? t('examUi.wasCorrect') : blank ? t('examUi.wasBlank') : t('examUi.wasWrong')}
            </Text>
            {!blank ? <Text variant='bodyMedium'>{t('learn.yourAnswer', { answer: p.options[a.chosen ?? 0] })}</Text> : null}
            {!a.correct ? <Text variant='bodyMedium'>{t('learn.correctAnswer', { answer: p.options[p.correctIndex] })}</Text> : null}
            {q.explanation ? <Text variant='bodySmall'>{`💡 ${q.explanation}`}</Text> : null}
            {q.lessonId ? (
              <Button compact onPress={() => router.push(`/learn/lesson/${q.lessonId}`)}>
                {t('exams.openLesson')}
              </Button>
            ) : null}
          </Panel>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({ strong: { fontWeight: '600' } });
