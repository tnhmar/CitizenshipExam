import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, ProgressBar, Text } from 'react-native-paper';
import { Screen } from '../../../src/components/Screen';
import { useBundle } from '../../../src/content/useBundle';
import { useProgress } from '../../../src/store/progress';
import { useSettings } from '../../../src/store/settings';

export default function LearnIndex() {
  const { t } = useTranslation();
  const router = useRouter();
  const bundle = useBundle();
  const lessonsRead = useProgress((s) => s.lessonsRead);
  const lock = useSettings((s) => s.lockChapters);

  return (
    <Screen>
      {bundle.chapters.map((c, i) => {
        const total = c.lessonIds.length;
        const done = c.lessonIds.filter((id) => lessonsRead[id]).length;
        const complete = total > 0 && done === total;
        const prev = i > 0 ? bundle.chapters[i - 1] : null;
        const prevDone = !prev || prev.lessonIds.every((id) => lessonsRead[id]);
        const locked = lock && !prevDone;
        let status = t('learn.notStarted');
        if (locked) status = `🔒 ${t('learn.locked')}`;
        else if (complete) status = `✓ ${t('learn.completed')}`;
        else if (done > 0) status = t('learn.inProgress');
        return (
          <Card key={c.id} disabled={locked} onPress={() => router.push(`/learn/${c.id}`)} style={{ opacity: locked ? 0.5 : 1 }}>
            <Card.Content style={{ gap: 8 }}>
              <Text variant='titleMedium'>{c.title}</Text>
              <ProgressBar progress={total > 0 ? done / total : 0} />
              <Text variant='bodySmall'>{`${t('learn.chapterProgress', { done, total })} · ${status}`}</Text>
            </Card.Content>
          </Card>
        );
      })}
    </Screen>
  );
}
