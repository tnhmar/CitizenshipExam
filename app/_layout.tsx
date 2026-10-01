import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import i18n from '../src/i18n';
import { useHydrated } from '../src/store/hydration';
import { useSettings } from '../src/store/settings';
import { darkTheme, headerOptions, lightTheme } from '../src/theme';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <ScrollView style={{ backgroundColor: '#FFFFFF' }} contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#000000' }}>Something went wrong</Text>
      <Text selectable style={{ color: '#000000' }}>
        {error.message}
      </Text>
      <Text selectable style={{ fontSize: 11, color: '#444444' }}>
        {error.stack ?? ''}
      </Text>
      <Pressable accessibilityRole='button' onPress={retry}>
        <Text style={{ fontSize: 16, color: '#C22020' }}>Try again</Text>
      </Pressable>
    </ScrollView>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const hydrated = useHydrated();
  const lang = useSettings((s) => s.lang);
  const mode = useSettings((s) => s.themeMode);
  const { t } = useTranslation();
  const dark = mode === 'system' ? scheme === 'dark' : mode === 'dark';
  const theme = dark ? darkTheme : lightTheme;

  useEffect(() => {
    if (lang) void i18n.changeLanguage(lang);
  }, [lang]);

  if (!hydrated) return null;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style='light' />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name='settings' options={{ headerShown: true, presentation: 'modal', title: t('settings.title'), ...headerOptions(theme) }} />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
