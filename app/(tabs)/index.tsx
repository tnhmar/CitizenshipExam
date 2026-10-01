import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Bar } from '../../src/components/Bar';
import { Panel, type Tone } from '../../src/components/Panel';
import { Screen } from '../../src/components/Screen';
import { ScoreRing } from '../../src/components/ScoreRing';
import { StatCard } from '../../src/components/StatCard';
import { useBundle } from '../../src/content/useBundle';
import { daysUntil } from '../../src/logic/date';
import { currentStreak, recentExamAverage } from '../../src/logic/progress';
import { dueCards } from '../../src/logic/srs';
import { computeReadiness } from '../../src/logic/stats';
import { useProgress } from '../../src/store/progress';
import { useSettings } from '../../src/store/settings';
import { palette } from '../../src/theme';

interface Step {
  icon: string;
  title: string;
  hint: string;
  route: string;
  tone: Tone;
}

const accuracyColor = (v: number | null) => (v === null ? undefined : v >= 0.75 ? palette.success : v >= 0.5 ? palette.warning : palette.danger);

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
  const active = useProgress((s) => s.active);
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, []),
  );

  const readCount = Object.keys(lessonsRead).length;
  const totalLessons = bundle.lessons.length;
  const quizList = Object.values(quizResults);
  const quizTotal = quizList.reduce((sum, q) => sum + q.total, 0);
  const quizRight = quizList.reduce((sum, q) => sum + q.correct, 0);
  const quizAcc = quizTotal > 0 ? quizRight / quizTotal : null;
  const finished = attempts.filter((a) => a.finishedAt !== null);
  const examAvg = finished.length > 0 ? recentExamAverage(attempts, 3) : null;
  const score = computeReadiness(bundle, lessonsRead, quizResults, attempts);
  const dueCount = dueCards(Object.values(cards), now).length;
  const streakDays = currentStreak(streak, now);
  const left = examDate ? daysUntil(examDate, now) : null;
  const message = score >= 75 ? 'homeUi.readyHigh' : score >= 40 ? 'homeUi.readyMid' : 'homeUi.readyLow';

  const lessonMatch = /\/learn\/lesson\/(\d+)/.exec(lastRoute ?? '');
  const lastLesson = lessonMatch ? bundle.lessons.find((l) => l.id === Number(lessonMatch[1])) : undefined;
  let step: Step;
  if (active) {
    step = {
      icon: '⏱',
      title: t('homeUi.resumeExam'),
      hint: t('homeUi.resumeExamHint', { title: bundle.exams.find((e) => e.id === active.examId)?.title ?? '' }),
      route: `/exams/${active.examId}`,
      tone: 'warning',
    };
  } else if (dueCount > 0) {
    step = { icon: '🔄', title: t('homeUi.reviewDue', { count: dueCount }), hint: t('homeUi.reviewDueHint'), route: '/review', tone: 'default' };
  } else if (lastLesson) {
    step = { icon: '📖', title: t('homeUi.resumeLesson', { title: lastLesson.title }), hint: t('homeUi.resumeLessonHint'), route: `/learn/lesson/${lastLesson.id}`, tone: 'default' };
  } else {
    step = { icon: '🚀', title: t('homeUi.startLearning'), hint: t('homeUi.startLearningHint'), route: '/learn', tone: 'default' };
  }

  const testCard =
    left === null
      ? { value: '+', label: t('homeUi.setDate') }
      : left < 0
        ? { value: '—', label: t('homeUi.testPassed') }
        : left === 0
          ? { value: '🎯', label: t('homeUi.testToday') }
          : { value: String(left), label: t('homeUi.testIn', { count: left }) };

  const tile = (icon: string, label: string, route: string) => (
    <Panel onPress={() => router.push(route)} style={styles.tile}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text variant='titleSmall'>{label}</Text>
    </Panel>
  );

  const prep = (label: string, valueText: string, ratio: number, color?: string) => (
    <View style={styles.prep}>
      <View style={styles.between}>
        <Text variant='bodyMedium'>{label}</Text>
        <Text variant='labelLarge'>{valueText}</Text>
      </View>
      <Bar value={ratio} color={color} height={10} />
    </View>
  );

  return (
    <Screen>
      {bundle.sample ? (
        <Panel tone='warning'>
          <Text variant='bodyMedium'>{t('common.sampleBanner')}</Text>
        </Panel>
      ) : null}

      <View>
        <Text variant='headlineSmall' style={styles.strong}>
          {t('home.greeting')}
        </Text>
        <Text variant='bodyMedium' style={{ color: theme.colors.onSurfaceVariant }}>
          {t('homeUi.subtitle')}
        </Text>
      </View>

      <Panel tone='primary'>
        <View style={styles.hero}>
          <ScoreRing value={score} size={120} color='#FFFFFF' trackColor='rgba(255,255,255,0.3)' textColor='#FFFFFF' />
          <View style={styles.heroText}>
            <Text variant='titleMedium' style={[styles.strong, { color: theme.colors.onPrimary }]}>
              {t('home.readiness')}
            </Text>
            <Text variant='bodyMedium' style={{ color: theme.colors.onPrimary }}>
              {t(message)}
            </Text>
            <Text variant='labelMedium' style={{ color: theme.colors.onPrimary }}>
              {t('learn.chapterProgress', { done: readCount, total: totalLessons })}
            </Text>
          </View>
        </View>
      </Panel>

      <View style={styles.row}>
        <StatCard icon='🔥' value={String(streakDays)} label={t('homeUi.streakLabel', { count: streakDays })} tone={streakDays > 0 ? 'warning' : 'default'} />
        <StatCard icon='📅' value={testCard.value} label={testCard.label} onPress={() => router.push('/settings')} />
        <StatCard icon='🔄' value={String(dueCount)} label={t('homeUi.dueLabel')} onPress={() => router.push('/review')} />
      </View>

      <Text variant='titleMedium'>{t('homeUi.nextStep')}</Text>
      <Panel tone={step.tone} onPress={() => router.push(step.route)}>
        <View style={styles.step}>
          <Text style={styles.stepIcon}>{step.icon}</Text>
          <View style={styles.grow}>
            <Text variant='titleMedium'>{step.title}</Text>
            <Text variant='bodySmall'>{step.hint}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Panel>

      <Text variant='titleMedium'>{t('homeUi.shortcuts')}</Text>
      <View style={styles.row}>
        {tile('📚', t('tabs.learn'), '/learn')}
        {tile('📝', t('tabs.exams'), '/exams')}
      </View>
      <View style={styles.row}>
        {tile('🔄', t('tabs.review'), '/review')}
        {tile('📊', t('tabs.progress'), '/progress')}
      </View>

      <Text variant='titleMedium'>{t('homeUi.preparation')}</Text>
      <Panel>
        {prep(t('homeUi.lessonsRead'), `${readCount}/${totalLessons}`, totalLessons > 0 ? readCount / totalLessons : 0)}
        {prep(t('homeUi.quizAccuracy'), quizAcc === null ? '—' : `${Math.round(quizAcc * 100)}%`, quizAcc ?? 0, accuracyColor(quizAcc))}
        {prep(t('homeUi.examAverage'), examAvg === null ? '—' : `${Math.round(examAvg * 100)}%`, examAvg ?? 0, accuracyColor(examAvg))}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  strong: { fontWeight: '700' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroText: { flex: 1, gap: 6 },
  row: { flexDirection: 'row', gap: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIcon: { fontSize: 30 },
  grow: { flex: 1, gap: 2 },
  chevron: { fontSize: 28 },
  tile: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 20 },
  tileIcon: { fontSize: 30 },
  prep: { gap: 6, paddingVertical: 4 },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
});
