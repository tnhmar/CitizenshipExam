import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { headerOptions } from '../../../src/theme';

export default function ExamsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Stack screenOptions={headerOptions(theme)}>
      <Stack.Screen name='index' options={{ title: t('tabs.exams') }} />
      <Stack.Screen name='[examId]' options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name='summary' options={{ title: t('examUi.summaryTitle') }} />
      <Stack.Screen name='result/[attemptId]' options={{ title: t('exams.resultTitle'), headerBackVisible: false }} />
      <Stack.Screen name='missed/[attemptId]' options={{ title: t('exams.missedTitle') }} />
      <Stack.Screen name='flagged/[attemptId]' options={{ title: t('examUi.flaggedTitle') }} />
    </Stack>
  );
}
