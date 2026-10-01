import { Redirect, Tabs, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, type ColorValue } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSettings } from '../../src/store/settings';

function TabIcon({ emoji, color }: { emoji: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

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
          tabBarIcon: ({ color }) => <TabIcon emoji='🏠' color={color} />,
          headerRight: () => (
            <Pressable accessibilityRole='button' accessibilityLabel={t('settings.title')} onPress={() => router.push('/settings')} style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name='learn' options={{ title: t('tabs.learn'), headerShown: false, tabBarIcon: ({ color }) => <TabIcon emoji='📚' color={color} /> }} />
      <Tabs.Screen name='exams' options={{ title: t('tabs.exams'), headerShown: false, tabBarIcon: ({ color }) => <TabIcon emoji='📝' color={color} /> }} />
      <Tabs.Screen name='progress' options={{ title: t('tabs.progress'), tabBarIcon: ({ color }) => <TabIcon emoji='📊' color={color} /> }} />
      <Tabs.Screen name='review' options={{ title: t('tabs.review'), headerShown: false, tabBarIcon: ({ color }) => <TabIcon emoji='🔄' color={color} /> }} />
    </Tabs>
  );
}
