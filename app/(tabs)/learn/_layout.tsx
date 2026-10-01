import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function LearnLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name='index' options={{ title: t('tabs.learn') }} />
      <Stack.Screen name='quiz' options={{ title: t('learn.quizTitle'), animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
