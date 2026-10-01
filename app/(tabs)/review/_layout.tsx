import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { headerOptions } from '../../../src/theme';

export const unstable_settings = { anchor: 'index' };

export default function ReviewLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Stack screenOptions={headerOptions(theme)}>
      <Stack.Screen name='index' options={{ title: t('tabs.review') }} />
      <Stack.Screen name='session' options={{ title: t('tabs.review'), animation: 'slide_from_bottom', gestureEnabled: false }} />
    </Stack>
  );
}
