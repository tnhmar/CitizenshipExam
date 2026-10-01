import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Accordion } from '../../src/components/Accordion';
import { Screen } from '../../src/components/Screen';
import { ScoreRing } from '../../src/components/ScoreRing';
import { useBundle } from '../../src/content/useBundle';
import { computeReadiness, examChapterStats, formatDuration, mostMissed, overallAccuracy } from '../../src/logic/stats';
import { useProgress } from '../../src/store/progress';

export default function ProgressScreen() {
  const { t } = useTranslation();
  const bundle = useBundle();
  const lessonsRead = useProgress((s) => s.lessonsRead);
  const quizResults = useProgress((s) => s.quizResults);
  const attempts = useProgress((s) => s.attempts);
  const cards = useProgress((s) => s.cards);
  const studyMs = useProgress((s) => s.studyMs);

  const finished = attempts.filter((a) => a.finishedAt !== null);
  const best = finished.reduce((m, a) => Math.max(m, a.answers.filter((x) => x.correct).length), 0);
  const examStats = examChapterStats(bundle, attempts);
  const cardList = Object.values(cards);

  return (
    <Screen>
      <View style={styles.center}>
        <ScoreRing value={computeReadiness(bundle, lessonsRead, quizResults, attempts)} />
      </View>
      <Text variant='bodyLarge'>{`${t('progress.successRate')}: ${Math.round(overallAccuracy(quizResults, attempts) * 100)} %`}</Text>
      <Text variant='bodyLarge'>{`${t('progress.studyTime')}: ${formatDuration(studyMs)}`}</Text>
      <Text variant='bodyLarge'>{`${t('progress.examsTaken')}: ${finished.length}`}</Text>
      <Text variant='bodyLarge'>{`${t('progress.bestExam')}: ${finished.length ? `${best} / ${bundle.examSize}` : t('progress.none')}`}</Text>

      {bundle.chapters.map((c) => {
        const done = c.lessonIds.filter((id) => lessonsRead[id]).length;
        const chapterQuiz = quizResults[`chapter:${c.id}`];
        const exam = examStats[c.id];
        const missed = mostMissed(bundle, cardList, c.id, 3);
        return (
          <Accordion key={c.id} title={c.title} subtitle={t('progress.lessonsRead', { done, total: c.lessonIds.length })}>
            {c.lessonIds.map((id) => {
              const lesson = bundle.lessons.find((l) => l.id === id);
              const r = quizResults[`lesson:${id}`];
              return (
                <Text key={id} variant='bodyMedium'>{`${lessonsRead[id] ? '✓' : '○'} ${lesson?.title ?? id}${r ? ` · ${r.correct}/${r.total}` : ''}`}</Text>
              );
            })}
            {chapterQuiz ? <Text variant='bodyMedium'>{`${t('learn.chapterQuiz')}: ${chapterQuiz.correct} / ${chapterQuiz.total}`}</Text> : null}
            {exam ? <Text variant='bodyMedium'>{t('progress.examAccuracy', { correct: exam.correct, total: exam.total })}</Text> : null}
            <Text variant='titleSmall'>{t('progress.mostMissed')}</Text>
            {missed.length === 0 ? <Text variant='bodySmall'>{t('progress.noMissed')}</Text> : missed.map((q) => <Text key={q.id} variant='bodySmall'>{`• ${q.text}`}</Text>)}
          </Accordion>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center' } });
