import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { Bar } from '../../../../src/components/Bar';
import { Panel } from '../../../../src/components/Panel';
import { Screen } from '../../../../src/components/Screen';
import { ScoreRing } from '../../../../src/components/ScoreRing';
import { StatCard } from '../../../../src/components/StatCard';
import { useBundle } from '../../../../src/content/useBundle';
import { averageTimeMs, byChapter, summarize } from '../../../../src/logic/exam';
import { useProgress } from '../../../../src/store/progress';
import { palette } from '../../../../src/theme';

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
  const flaggedCount = (attempt.flags ?? []).length;
  const timeUp = attempt.finishedAt !== null && attempt.finishedAt - attempt.startedAt >= attempt.limitMs;
  const tint = s.passed ? palette.success : palette.danger;

  return (
    <Screen>
      <Panel tone={s.passed ? 'success' : 'danger'} style={styles.center}>
        <ScoreRing value={s.percent} size={170} color={tint} label={`${s.score}/${s.total}`} />
        <Text variant='headlineSmall' style={{ color: tint, fontWeight: '700' }}>
          {`${s.passed ? '🎉' : '💪'} ${s.passed ? t('exams.passed') : t('exams.failed')}`}
        </Text>
        <Text variant='bodyMedium'>{t('exams.needed', { required: s.required })}</Text>
        {timeUp ? <Text style={{ color: palette.danger }}>{t('exams.timeUp')}</Text> : null}
      </Panel>

      <View style={styles.row}>
        <StatCard icon='✓' value={String(s.score)} label={t('exams.correct')} tone='success' />
        <StatCard icon='✗' value={String(s.wrong)} label={t('exams.wrong')} tone={s.wrong ? 'danger' : 'default'} />
      </View>
      <View style={styles.row}>
        <StatCard icon='○' value={String(s.unanswered)} label={t('exams.unanswered')} />
        <StatCard icon='⚑' value={String(flaggedCount)} label={t('examUi.statFlagged')} tone={flaggedCount ? 'warning' : 'default'} />
      </View>

      <Panel>
        <Text variant='bodyMedium'>{`⏱ ${t('exams.avgTime', { seconds: Math.round(averageTimeMs(attempt.answers) / 1000) })}`}</Text>
      </Panel>

      <Text variant='titleMedium'>{t('exams.byChapter')}</Text>
      {Object.entries(chapters).map(([key, v]) => {
        const ratio = v.total > 0 ? v.correct / v.total : 0;
        return (
          <Panel key={key}>
            <View style={styles.between}>
              <Text variant='bodyMedium' style={styles.grow}>
                {bundle.chapters.find((c) => c.id === Number(key))?.title ?? t('exams.other')}
              </Text>
              <Text variant='labelLarge'>{`${v.correct} / ${v.total}`}</Text>
            </View>
            <Bar value={ratio} color={ratio >= 0.75 ? palette.success : ratio >= 0.5 ? palette.warning : palette.danger} />
          </Panel>
        );
      })}

      <Button mode='contained' onPress={() => router.push(`/exams/missed/${attempt.id}?filter=wrong`)}>
        {t('exams.reviewMistakes')}
      </Button>
      {flaggedCount > 0 ? (
        <Button mode='contained-tonal' onPress={() => router.push(`/exams/flagged/${attempt.id}`)}>
          {`⚑ ${t('examUi.reviewFlagged', { count: flaggedCount })}`}
        </Button>
      ) : null}
      <Button mode='outlined' onPress={() => router.replace(`/exams/${attempt.examId}`)}>
        {t('exams.retake')}
      </Button>
      <Button onPress={() => router.replace('/exams')}>{t('exams.backToList')}</Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 10 },
  row: { flexDirection: 'row', gap: 12 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  grow: { flex: 1 },
});
