import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, Text } from 'react-native-paper';
import { Screen } from '../../../src/components/Screen';
import { useBundle } from '../../../src/content/useBundle';
import { countDue, countMissed } from '../../../src/logic/review';
import { useProgress } from '../../../src/store/progress';

export default function ReviewIndex() {
  const { t } = useTranslation();
  const router = useRouter();
  const bundle = useBundle();
  const cardsMap = useProgress((s) => s.cards);
  const cards = Object.values(cardsMap);
  const due = countDue(cards, Date.now());
  const missed = countMissed(cards);

  const deck = (key: string, title: string, hint: string, disabled: boolean) => (
    <Card key={key} disabled={disabled} onPress={() => router.push(`/review/session?deck=${key}`)} style={{ opacity: disabled ? 0.5 : 1 }}>
      <Card.Content style={{ gap: 4 }}>
        <Text variant='titleMedium'>{title}</Text>
        <Text variant='bodySmall'>{hint}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <Screen>
      {due === 0 ? <Text variant='bodyMedium'>{t('review.nothingDue')}</Text> : null}
      {deck('due', t('review.dueToday'), t('review.dueHint', { count: due }), due === 0)}
      {deck('missed', t('review.missedDeck'), t('review.missedHint', { count: missed }), missed === 0)}
      {deck('random', t('review.random'), t('review.randomHint'), false)}
      {deck('flashcards', t('review.flashcards'), t('review.flashHint', { count: bundle.glossary.length }), bundle.glossary.length === 0)}
    </Screen>
  );
}
