import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ExamsLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name='index' options={{ title: t('tabs.exams') }} />
      <Stack.Screen name='[examId]' options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name='result/[attemptId]' options={{ title: t('exams.resultTitle'), headerBackVisible: false }} />
      <Stack.Screen name='missed/[attemptId]' options={{ title: t('exams.missedTitle') }} />
    </Stack>
  );
}
