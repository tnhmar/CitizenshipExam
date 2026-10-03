import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useReminderSync } from '../src/hooks/useReminderSync';
import i18n from '../src/i18n';
import { preparationNavigationColors } from '../src/logic/preparationLayout';
import { useHydrated } from '../src/store/hydration';
import { useSettings } from '../src/store/settings';
import { darkTheme, headerOptions, lightTheme } from '../src/theme';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ScrollView style={{ backgroundColor: '#FFFFFF' }} contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 12 }}>
    <Text style={{ fontSize: 20, fontWeight: '700', color: '#000000' }}>Something went wrong</Text>
    <Text selectable style={{ color: '#000000' }}>{error.message}</Text>
    <Text selectable style={{ fontSize: 11, color: '#444444' }}>{error.stack ?? ''}</Text>
    <Pressable accessibilityRole='button' onPress={retry}><Text style={{ fontSize: 16, color: '#C22020' }}>Try again</Text></Pressable>
  </ScrollView>;
}
export default function RootLayout() {
  const scheme = useColorScheme(); const hydrated = useHydrated();
  const lang = useSettings((s) => s.lang); const mode = useSettings((s) => s.themeMode); const { t } = useTranslation();
  useReminderSync(hydrated);
  const dark = mode === 'system' ? scheme === 'dark' : mode === 'dark'; const theme = dark ? darkTheme : lightTheme;
  const navigationTheme = useMemo(() => { const base = dark ? NavigationDarkTheme : NavigationDefaultTheme; return { ...base, colors: { ...base.colors, ...preparationNavigationColors(theme.colors) } }; }, [dark, theme]);
  useEffect(() => { if (lang) void i18n.changeLanguage(lang); }, [lang]);
  if (!hydrated) return null;
  return <SafeAreaProvider style={{ flex: 1, backgroundColor: theme.colors.background }}><ThemeProvider value={navigationTheme}><PaperProvider theme={theme}>
    <StatusBar style='light' />
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background }, navigationBarColor: theme.colors.background }}><Stack.Screen name='settings' options={{ headerShown: true, presentation: 'modal', title: t('settings.title'), ...headerOptions(theme) }} /></Stack>
    </View>
  </PaperProvider></ThemeProvider></SafeAreaProvider>;
}
