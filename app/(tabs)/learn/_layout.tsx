import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { headerOptions } from '../../../src/theme';

export default function LearnLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Stack screenOptions={headerOptions(theme)}>
      <Stack.Screen name='index' options={{ title: t('tabs.learn') }} />
      <Stack.Screen name='quiz' options={{ title: t('learn.quizTitle'), animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
