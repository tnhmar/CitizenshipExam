import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ReviewLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name='index' options={{ title: t('tabs.review') }} />
      <Stack.Screen name='session' options={{ title: t('tabs.review'), animation: 'slide_from_bottom', gestureEnabled: false }} />
    </Stack>
  );
}
