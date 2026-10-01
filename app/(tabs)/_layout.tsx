import { Redirect, Tabs, usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIcon } from '../../src/components/TabIcon';
import { isFocusedExamPath } from '../../src/logic/examLayout';
import { returnToTabRoot } from '../../src/navigation/tabRoots';
import { useSettings } from '../../src/store/settings';
import { headerOptions } from '../../src/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const router = useRouter();
  const onboarded = useSettings((s) => s.onboarded);
  const bottom = Math.max(insets.bottom, 8);
  if (!onboarded) return <Redirect href='/onboarding' />;
  return <Tabs screenOptions={{
    ...headerOptions(theme), tabBarActiveTintColor: theme.colors.primary, tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
    tabBarLabelPosition: 'below-icon', tabBarLabelStyle: { fontWeight: '600', fontSize: 11, marginBottom: 2 },
    tabBarIconStyle: { width: 48, height: 34, marginBottom: 2 }, tabBarItemStyle: { paddingTop: 4, paddingBottom: 4 }, tabBarHideOnKeyboard: true,
    tabBarStyle: isFocusedExamPath(path) ? { display: 'none' } : { height: 68 + bottom, marginHorizontal: 12, marginBottom: 8, borderRadius: 28, backgroundColor: theme.colors.surface, borderTopWidth: 0, elevation: 10, shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, paddingTop: 6, paddingBottom: bottom },
  }}>
    <Tabs.Screen name='index' options={{ title: t('tabs.home'), headerShown: false, tabBarAccessibilityLabel: t('tabs.home'), tabBarIcon: ({ focused }) => <TabIcon name='home' focused={focused} /> }} />
    <Tabs.Screen name='learn' listeners={({ navigation }) => ({ tabPress: (event) => returnToTabRoot('learn', navigation, event, (href) => router.navigate(href)) })} options={{ title: t('tabs.learn'), headerShown: false, tabBarAccessibilityLabel: t('tabs.learn'), tabBarIcon: ({ focused }) => <TabIcon name='learn' focused={focused} /> }} />
    <Tabs.Screen name='exams' options={{ title: t('tabs.exams'), headerShown: false, tabBarAccessibilityLabel: t('tabs.exams'), tabBarIcon: ({ focused }) => <TabIcon name='exams' focused={focused} /> }} />
    <Tabs.Screen name='progress' options={{ title: t('tabs.progress'), tabBarAccessibilityLabel: t('tabs.progress'), tabBarIcon: ({ focused }) => <TabIcon name='progress' focused={focused} /> }} />
    <Tabs.Screen name='review' listeners={({ navigation }) => ({ tabPress: (event) => returnToTabRoot('review', navigation, event, (href) => router.navigate(href)) })} options={{ title: t('tabs.review'), headerShown: false, tabBarAccessibilityLabel: t('tabs.review'), tabBarIcon: ({ focused }) => <TabIcon name='review' focused={focused} /> }} />
  </Tabs>;
}
