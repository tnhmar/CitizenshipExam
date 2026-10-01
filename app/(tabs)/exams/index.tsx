import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Portal, Text } from 'react-native-paper';
import { Screen } from '../../../src/components/Screen';
import { useBundle } from '../../../src/content/useBundle';
import { useProgress } from '../../../src/store/progress';

export default function ExamsIndex() {
  const { t } = useTranslation();
  const router = useRouter();
  const bundle = useBundle();
  const attempts = useProgress((s) => s.attempts);
  const active = useProgress((s) => s.active);
  const setActive = useProgress((s) => s.setActive);
  const [pending, setPending] = useState<number | null>(null);

  const last = (examId: number) =>
    attempts
      .filter((a) => a.examId === examId && a.finishedAt !== null)
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))[0];

  const open = (examId: number) => {
    if (active && active.examId !== examId) setPending(examId);
    else router.push(`/exams/${examId}`);
  };

  const group = (kind: 'mock' | 'practice', title: string) => (
    <View style={styles.group}>
      <Text variant='titleMedium'>{title}</Text>
      {bundle.exams
        .filter((e) => e.kind === kind)
        .map((e) => {
          const l = last(e.id);
          return (
            <Card key={e.id} onPress={() => open(e.id)}>
              <Card.Content style={styles.card}>
                <Text variant='titleSmall'>{e.title}</Text>
                <Text variant='bodySmall'>{t('exams.meta', { count: e.questionIds.length, min: e.durationMin })}</Text>
                <Text variant='bodySmall'>
                  {l ? t('exams.last', { score: l.answers.filter((a) => a.correct).length, total: l.questionIds.length }) : t('exams.neverTaken')}
                </Text>
              </Card.Content>
            </Card>
          );
        })}
    </View>
  );

  return (
    <Screen>
      {active ? (
        <Card mode='outlined'>
          <Card.Content style={styles.card}>
            <Text variant='titleMedium'>{t('exams.resume')}</Text>
            <Text variant='bodySmall'>{t('exams.resumeHint', { title: bundle.exams.find((e) => e.id === active.examId)?.title ?? '' })}</Text>
            <Button mode='contained' onPress={() => router.push(`/exams/${active.examId}`)}>
              {t('common.continue')}
            </Button>
          </Card.Content>
        </Card>
      ) : null}
      {group('mock', t('exams.mock'))}
      {group('practice', t('exams.practice'))}
      <Portal>
        <Dialog visible={pending !== null} onDismiss={() => setPending(null)}>
          <Dialog.Title>{t('exams.abandonTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('exams.abandonBody')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPending(null)}>{t('common.cancel')}</Button>
            <Button
              onPress={() => {
                const id = pending;
                setPending(null);
                setActive(null);
                if (id !== null) router.push(`/exams/${id}`);
              }}
            >
              {t('common.confirm')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 12 },
  card: { gap: 4 },
});
