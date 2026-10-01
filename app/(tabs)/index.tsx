import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { Screen } from '../../src/components/Screen';
import { ScoreRing } from '../../src/components/ScoreRing';
import { useBundle } from '../../src/content/useBundle';
import { daysUntil } from '../../src/logic/date';
import { currentStreak, readiness, recentExamAverage } from '../../src/logic/progress';
import { dueCards } from '../../src/logic/srs';
import { useProgress } from '../../src/store/progress';
import { useSettings } from '../../src/store/settings';

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const bundle = useBundle();
  const examDate = useSettings((s) => s.examDate);
  const lessonsRead = useProgress((s) => s.lessonsRead);
  const quizResults = useProgress((s) => s.quizResults);
  const attempts = useProgress((s) => s.attempts);
  const cards = useProgress((s) => s.cards);
  const streak = useProgress((s) => s.streak);
  const lastRoute = useProgress((s) => s.lastRoute);
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, []),
  );

  const quizzes = Object.values(quizResults);
  const total = quizzes.reduce((sum, q) => sum + q.total, 0);
  const right = quizzes.reduce((sum, q) => sum + q.correct, 0);
  const score = readiness({
    lessonsRead: Object.keys(lessonsRead).length,
    totalLessons: bundle.lessons.length,
    quizAccuracy: total > 0 ? right / total : 0,
    examAvg: recentExamAverage(attempts, 3),
  });
  const dueCount = dueCards(Object.values(cards), now).length;
  const left = examDate ? daysUntil(examDate, now) : null;
  let countdown = t('home.noDate');
  if (left !== null) {
    if (left < 0) countdown = t('home.testPassed');
    else if (left === 0) countdown = t('home.testToday');
    else countdown = t('home.daysLeft', { count: left });
  }

  return (
    <Screen>
      {bundle.sample ? <Text style={{ color: theme.colors.error }}>{t('common.sampleBanner')}</Text> : null}
      <Text variant='headlineSmall'>{t('home.greeting')}</Text>
      <View style={styles.center}>
        <ScoreRing value={score} />
        <Text variant='labelLarge'>{t('home.readiness')}</Text>
      </View>
      <Text variant='titleMedium'>{`🔥 ${t('home.streak', { count: currentStreak(streak, now) })}`}</Text>
      <Text variant='bodyLarge'>{countdown}</Text>
      <Text variant='bodyLarge'>{t('home.due', { count: dueCount })}</Text>
      <Button mode='contained' onPress={() => router.push(lastRoute ?? '/learn')}>
        {t('home.continueLearning')}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', gap: 8 } });
