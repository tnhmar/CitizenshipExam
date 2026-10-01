import { Redirect, Tabs, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSettings } from '../../src/store/settings';

const icon =
  (emoji: string) =>
  ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>{emoji}</Text>;

export default function TabsLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const onboarded = useSettings((s) => s.onboarded);

  if (!onboarded) return <Redirect href='/onboarding' />;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: theme.colors.primary }}>
      <Tabs.Screen
        name='index'
        options={{
          title: t('tabs.home'),
          tabBarIcon: icon('🏠'),
          headerRight: () => (
            <Pressable accessibilityRole='button' accessibilityLabel={t('settings.title')} onPress={() => router.push('/settings')} style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name='learn' options={{ title: t('tabs.learn'), headerShown: false, tabBarIcon: icon('📚') }} />
      <Tabs.Screen name='exams' options={{ title: t('tabs.exams'), headerShown: false, tabBarIcon: icon('📝') }} />
      <Tabs.Screen name='progress' options={{ title: t('tabs.progress'), tabBarIcon: icon('📊') }} />
      <Tabs.Screen name='review' options={{ title: t('tabs.review'), headerShown: false, tabBarIcon: icon('🔄') }} />
    </Tabs>
  );
}
