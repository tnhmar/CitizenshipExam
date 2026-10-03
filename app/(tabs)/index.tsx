import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeIcon } from '../../src/components/HomeIcon';
import { HomeOverview } from '../../src/components/HomeOverview';
import { HomeRecommendation } from '../../src/components/HomeRecommendation';
import { HomeToday } from '../../src/components/HomeToday';
import { Panel } from '../../src/components/Panel';
import { useBundle } from '../../src/content/useBundle';
import { snapshot } from '../../src/logic/dashboardStats';
import { homeBottomPadding } from '../../src/logic/homeLayout';
import { PREPARATION_HEADER_RED } from '../../src/logic/preparationLayout';
import { tabBarGeometry } from '../../src/navigation/tabGeometry';
import { needsTabAnchor } from '../../src/navigation/tabRoots';
import { useProgress } from '../../src/store/progress';
import { useSettings } from '../../src/store/settings';

const stamp = (): number => Date.now();
export default function Home() {
  const { t } = useTranslation(); const router = useRouter(); const theme = useTheme();
  const insets = useSafeAreaInsets(); const geometry = tabBarGeometry(insets.bottom);
  const bundle = useBundle(); const progress = useProgress(); const examDate = useSettings((s) => s.examDate);
  const [now, setNow] = useState(stamp);
  useFocusEffect(useCallback(() => {
    setStatusBarStyle('light');
    const refresh = () => setNow(stamp()); const initial = setTimeout(refresh, 0); const timer = setInterval(refresh, 60000);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearTimeout(initial); clearInterval(timer); listener.remove(); };
  }, []));
  const data = useMemo(() => snapshot(bundle, progress, now), [bundle, progress, now]);
  const open = (route: string) => router.push(route, { withAnchor: needsTabAnchor(route) });
  return <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ paddingBottom: homeBottomPadding(geometry.height + geometry.marginBottom, 0) }}>
    <View style={[styles.headerBand, { paddingTop: insets.top + 12 }]}>
      <View style={styles.headerInner}>
        <Text variant='headlineSmall' style={styles.headerTitle}>{t('home.greeting')}</Text>
        <Pressable accessibilityRole='button' accessibilityLabel={t('settings.title')} onPress={() => open('/settings')} style={({ pressed }) => [styles.settings, pressed && styles.pressed]}><HomeIcon kind='settings' size={22} color='#FFFFFF' /></Pressable>
      </View>
    </View>
    <View style={styles.body}>
      {bundle.sample ? <Panel tone='warning'><Text>{t('common.sampleBanner')}</Text></Panel> : null}
      <HomeOverview data={data} onProgress={() => open('/progress')} onExams={() => open('/exams')} />
      <HomeRecommendation data={data} bundle={bundle} onOpen={open} />
      <HomeToday due={data.review.due} examDate={examDate} streak={progress.streak} now={now} legacySaved={progress.legacyActivityStreak !== null} onReview={() => open('/review')} onDate={() => open('/settings')} />
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({ headerBand: { backgroundColor: PREPARATION_HEADER_RED, paddingBottom: 14 }, headerInner: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }, headerTitle: { flex: 1, fontWeight: '600', color: '#FFFFFF' }, settings: { minWidth: 44, minHeight: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.12)' }, body: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 14, gap: 14 }, pressed: { opacity: 0.75 } });
