import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { BookmarkButton } from '../../../../src/components/BookmarkButton';
import { Panel } from '../../../../src/components/Panel';
import { Screen } from '../../../../src/components/Screen';
import { getBundle } from '../../../../src/content/loader';
import { present } from '../../../../src/logic/quiz';
import { useProgress } from '../../../../src/store/progress';
import { palette } from '../../../../src/theme';

export default function FlaggedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const attempts = useProgress((s) => s.attempts);
  const attempt = attempts.find((a) => a.id === attemptId);
  if (!attempt || attempt.finishedAt === null) return null;
  const bundle = getBundle(attempt.lang);
  const flags = attempt.flags ?? [];
  const items = attempt.answers.filter((a) => flags.includes(a.questionId));
  const success = theme.dark ? '#8DCB91' : palette.success;
  const danger = theme.dark ? '#FFB4AB' : palette.danger;
  const warning = theme.dark ? '#FFBB73' : palette.warning;
  return <Screen>
    <Text variant='bodyMedium'>{t('examUi.flaggedHint')}</Text>
    {items.length === 0 ? <Text variant='bodyLarge'>{t('examUi.nothing')}</Text> : null}
    {items.map((a) => {
      const q = bundle.questions[a.questionId];
      if (!q) return null;
      const p = present(q, attempt.seed);
      const blank = a.chosen === null;
      return <Panel key={a.questionId} tone={a.correct ? 'success' : blank ? 'warning' : 'danger'}>
        <View style={styles.tools}><BookmarkButton question={q} /></View>
        <Text variant='bodyLarge' style={styles.strong}>{`⚑ ${q.text}`}</Text>
        <Text variant='labelLarge' style={{ color: a.correct ? success : blank ? warning : danger }}>{a.correct ? t('examUi.wasCorrect') : blank ? t('examUi.wasBlank') : t('examUi.wasWrong')}</Text>
        {!blank ? <Text variant='bodyMedium'>{t('learn.yourAnswer', { answer: p.options[a.chosen ?? 0] })}</Text> : null}
        {!a.correct ? <Text variant='bodyMedium'>{t('learn.correctAnswer', { answer: p.options[p.correctIndex] })}</Text> : null}
        {q.explanation ? <Text variant='bodySmall'>{`💡 ${q.explanation}`}</Text> : null}
        {q.lessonId ? <Button compact onPress={() => router.push(`/learn/lesson/${q.lessonId}`)}>{t('exams.openLesson')}</Button> : null}
      </Panel>;
    })}
  </Screen>;
}
const styles = StyleSheet.create({ tools: { flexDirection: 'row', justifyContent: 'flex-end' }, strong: { fontWeight: '600' } });
