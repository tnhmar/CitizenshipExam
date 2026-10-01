import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import i18n from '../src/i18n';
import { useHydrated } from '../src/store/hydration';
import { useSettings } from '../src/store/settings';
import { darkTheme, lightTheme } from '../src/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const hydrated = useHydrated();
  const lang = useSettings((s) => s.lang);
  const { t } = useTranslation();

  useEffect(() => {
    if (lang) void i18n.changeLanguage(lang);
  }, [lang]);

  if (!hydrated) return null;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={scheme === 'dark' ? darkTheme : lightTheme}>
        <StatusBar style='auto' />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name='settings' options={{ headerShown: true, presentation: 'modal', title: t('settings.title') }} />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
