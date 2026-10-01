import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View, type ColorValue } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSettings } from '../../src/store/settings';
import { headerOptions } from '../../src/theme';

function TabIcon({ emoji, color, focused }: { emoji: string; color: ColorValue; focused: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: focused ? theme.colors.primaryContainer : 'transparent', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 2 }}>
      <Text style={{ fontSize: 20, color, opacity: focused ? 1 : 0.65 }}>{emoji}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const onboarded = useSettings((s) => s.onboarded);

  if (!onboarded) return <Redirect href='/onboarding' />;

  return (
    <Tabs
      screenOptions={{
        ...headerOptions(theme),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          marginHorizontal: 12,
          marginBottom: 8,
          borderRadius: 28,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000000',
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen name='index' options={{ title: t('tabs.home'), headerShown: false, tabBarIcon: ({ color, focused }) => <TabIcon emoji='🏠' color={color} focused={focused} /> }} />
      <Tabs.Screen name='learn' options={{ title: t('tabs.learn'), headerShown: false, tabBarIcon: ({ color, focused }) => <TabIcon emoji='📚' color={color} focused={focused} /> }} />
      <Tabs.Screen name='exams' options={{ title: t('tabs.exams'), headerShown: false, tabBarIcon: ({ color, focused }) => <TabIcon emoji='📝' color={color} focused={focused} /> }} />
      <Tabs.Screen name='progress' options={{ title: t('tabs.progress'), tabBarIcon: ({ color, focused }) => <TabIcon emoji='📊' color={color} focused={focused} /> }} />
      <Tabs.Screen name='review' options={{ title: t('tabs.review'), headerShown: false, tabBarIcon: ({ color, focused }) => <TabIcon emoji='🔄' color={color} focused={focused} /> }} />
    </Tabs>
  );
}
