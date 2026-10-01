import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { Accordion } from '../../src/components/Accordion';
import { Bar } from '../../src/components/Bar';
import { Panel } from '../../src/components/Panel';
import { Screen } from '../../src/components/Screen';
import { ScoreRing } from '../../src/components/ScoreRing';
import { StatCard } from '../../src/components/StatCard';
import { useBundle } from '../../src/content/useBundle';
import { requiredToPass } from '../../src/logic/exam';
import { computeReadiness, examChapterStats, formatDuration, mostMissed, overallAccuracy } from '../../src/logic/stats';
import { useProgress } from '../../src/store/progress';
import { palette } from '../../src/theme';
import type { ExamAttempt } from '../../src/types';

const scoreOf = (a: ExamAttempt) => a.answers.filter((x) => x.correct).length;
const pill = (r: number) =>
  r >= 0.75 ? { bg: palette.successBg, fg: palette.success } : r >= 0.5 ? { bg: palette.warningBg, fg: palette.warning } : { bg: palette.dangerBg, fg: palette.danger };

export default function ProgressScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const bundle = useBundle();
  const lessonsRead = useProgress((s) => s.lessonsRead);
  const quizResults = useProgress((s) => s.quizResults);
  const attempts = useProgress((s) => s.attempts);
  const cards = useProgress((s) => s.cards);
  const studyMs = useProgress((s) => s.studyMs);
  const streak = useProgress((s) => s.streak);

  const finished = attempts.filter((a) => a.finishedAt !== null).sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0));
  const recent = finished.slice(-8);
  const required = requiredToPass(bundle.examSize, bundle.passMark, bundle.examSize);
  const best = finished.reduce((m, a) => Math.max(m, scoreOf(a)), 0);
  const hasData = finished.length > 0 || Object.keys(quizResults).length > 0;
  const accuracy = overallAccuracy(quizResults, attempts);
  const examStats = examChapterStats(bundle, attempts);
  const cardList = Object.values(cards);
  const readCount = Object.keys(lessonsRead).length;
  const weak = bundle.chapters
    .map((c) => ({ c, s: examStats[c.id] }))
    .filter((x) => x.s && x.s.total >= 3 && x.s.correct / x.s.total < 0.75)
    .sort((a, b) => a.s.correct / a.s.total - b.s.correct / b.s.total)
    .slice(0, 3);

  return (
    <Screen>
      <Panel tone='primary'>
        <View style={styles.hero}>
          <ScoreRing
            value={computeReadiness(bundle, lessonsRead, quizResults, attempts)}
            size={120}
            color='#FFFFFF'
            trackColor='rgba(255,255,255,0.3)'
            textColor='#FFFFFF'
          />
          <View style={styles.heroText}>
            <Text variant='titleMedium' style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
              {t('progress.successRate')}
            </Text>
            <Text variant='displaySmall' style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
              {hasData ? `${Math.round(accuracy * 100)}%` : t('progress.none')}
            </Text>
          </View>
        </View>
      </Panel>

      <View style={styles.row}>
        <StatCard icon='⏱' value={formatDuration(studyMs)} label={t('progress.studyTime')} />
        <StatCard icon='📝' value={String(finished.length)} label={t('progress.examsTaken')} />
        <StatCard
          icon='🏆'
          value={finished.length ? `${best}/${bundle.examSize}` : t('progress.none')}
          label={t('progress.bestExam')}
          tone={finished.length && best >= required ? 'success' : 'default'}
        />
      </View>
      <View style={styles.row}>
        <StatCard icon='📖' value={`${readCount}/${bundle.lessons.length}`} label={t('homeUi.lessonsRead')} />
        <StatCard icon='🔥' value={String(streak.best)} label={t('progressUi.bestStreak')} tone={streak.best > 0 ? 'warning' : 'default'} />
      </View>

      <Text variant='titleMedium'>{t('progressUi.history')}</Text>
      <Panel>
        {recent.length === 0 ? (
          <Text variant='bodyMedium'>{t('progressUi.historyEmpty')}</Text>
        ) : (
          <>
            <View style={styles.chart}>
              {recent.map((a) => {
                const s = scoreOf(a);
                const ratio = a.questionIds.length ? s / a.questionIds.length : 0;
                return (
                  <Pressable key={a.id} accessibilityRole='button' accessibilityLabel={`${s}/${a.questionIds.length}`} onPress={() => router.push(`/exams/result/${a.id}`)} style={styles.barCol}>
                    <Text variant='labelSmall'>{s}</Text>
                    <View style={[styles.bar, { height: Math.max(6, ratio * 90), backgroundColor: s >= required ? palette.success : palette.danger }]} />
                  </Pressable>
                );
              })}
            </View>
            <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
              {t('progressUi.passMarkLine', { required, total: bundle.examSize })}
            </Text>
          </>
        )}
      </Panel>

      <Text variant='titleMedium'>{t('progressUi.focus')}</Text>
      {weak.length === 0 ? (
        <Panel>
          <Text variant='bodyMedium'>{t('progressUi.focusEmpty')}</Text>
        </Panel>
      ) : (
        <>
          <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
            {t('progressUi.focusHint')}
          </Text>
          {weak.map(({ c, s }) => {
            const ratio = s.correct / s.total;
            return (
              <Panel key={c.id} tone={ratio < 0.5 ? 'danger' : 'warning'} onPress={() => router.push(`/learn/${c.id}`)}>
                <View style={styles.between}>
                  <Text variant='titleSmall' style={styles.grow}>
                    {c.title}
                  </Text>
                  <Text variant='labelLarge'>{`${Math.round(ratio * 100)}%`}</Text>
                </View>
                <Bar value={ratio} color={ratio < 0.5 ? palette.danger : palette.warning} />
              </Panel>
            );
          })}
        </>
      )}

      <Text variant='titleMedium'>{t('progressUi.chapters')}</Text>
      {bundle.chapters.map((c) => {
        const count = c.lessonIds.length;
        const read = c.lessonIds.filter((id) => lessonsRead[id]).length;
        const chapterQuiz = quizResults[`chapter:${c.id}`];
        const exam = examStats[c.id];
        const missed = mostMissed(bundle, cardList, c.id, 3);
        return (
          <Accordion key={c.id} title={c.title} subtitle={t('progress.lessonsRead', { done: read, total: count })}>
            <Bar value={count > 0 ? read / count : 0} color={read === count && count > 0 ? palette.success : undefined} height={10} />
            {c.lessonIds.map((id) => {
              const lesson = bundle.lessons.find((l) => l.id === id);
              const r = quizResults[`lesson:${id}`];
              const p = r && r.total > 0 ? pill(r.correct / r.total) : null;
              return (
                <Pressable key={id} accessibilityRole='button' onPress={() => router.push(`/learn/lesson/${id}`)} style={styles.lessonRow}>
                  <Text style={{ color: lessonsRead[id] ? palette.success : theme.colors.outline, fontSize: 18 }}>{lessonsRead[id] ? '✓' : '○'}</Text>
                  <Text variant='bodyMedium' style={styles.grow}>
                    {lesson?.title ?? id}
                  </Text>
                  {p && r ? (
                    <View style={[styles.chip, { backgroundColor: p.bg }]}>
                      <Text variant='labelSmall' style={{ color: p.fg }}>{`${r.correct}/${r.total}`}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
            {chapterQuiz ? (
              <Text variant='bodyMedium'>{`🏆 ${t('learn.chapterQuiz')}: ${chapterQuiz.correct} / ${chapterQuiz.total}`}</Text>
            ) : null}
            {exam ? (
              <View style={styles.prep}>
                <Text variant='bodyMedium'>{t('progress.examAccuracy', { correct: exam.correct, total: exam.total })}</Text>
                <Bar value={exam.total > 0 ? exam.correct / exam.total : 0} color={pill(exam.total > 0 ? exam.correct / exam.total : 0).fg} />
              </View>
            ) : null}
            <Text variant='titleSmall'>{t('progress.mostMissed')}</Text>
            {missed.length === 0 ? (
              <Text variant='bodySmall'>{t('progress.noMissed')}</Text>
            ) : (
              missed.map((q) => (
                <Text key={q.id} variant='bodySmall'>{`• ${q.text}`}</Text>
              ))
            )}
            <Button mode='outlined' onPress={() => router.push(`/learn/${c.id}`)}>
              {t('progressUi.openChapter')}
            </Button>
          </Accordion>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroText: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', gap: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: 120 },
  bar: { width: '70%', borderRadius: 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  grow: { flex: 1 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  chip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  prep: { gap: 6 },
});
