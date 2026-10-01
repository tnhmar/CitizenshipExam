import { useTranslation } from 'react-i18next';
import { Text } from 'react-native-paper';
import { Screen } from '../../../src/components/Screen';
import { useBundle } from '../../../src/content/useBundle';

export default function ExamsHome() {
  const { t } = useTranslation();
  const bundle = useBundle();
  return (
    <Screen>
      <Text variant='bodyLarge'>{t('stubs.exams', { exams: bundle.exams.length })}</Text>
    </Screen>
  );
}
