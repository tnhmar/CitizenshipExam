import { useTranslation } from 'react-i18next';
import { Text } from 'react-native-paper';
import { Screen } from '../../../src/components/Screen';

export default function ReviewHome() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text variant='bodyLarge'>{t('stubs.review')}</Text>
    </Screen>
  );
}
