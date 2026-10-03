import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeOverview } from '../../src/components/HomeOverview';
import { HomeRecommendation } from '../../src/components/HomeRecommendation';
import { Panel } from '../../src/components/Panel';
import { StatCard } from '../../src/components/StatCard';
import { StudyStreakCard } from '../../src/components/StudyStreakCard';
import { useBundle } from '../../src/content/useBundle';
import { useHomeFocusText } from '../../src/i18n/homeFocus';
import { snapshot } from '../../src/logic/dashboardStats';
import { homeExamDate } from '../../src/logic/homePresentation';
import { HOME_STATUS_ITEM, HOME_STATUS_ROW } from '../../src/logic/homeStatusLayout';
import { needsTabAnchor } from '../../src/navigation/tabRoots';
import { useProgress } from '../../src/store/progress';
import { useSettings } from '../../src/store/settings';

const stamp = (): number => Date.now();
export default function Home() {
  const { t } = useTranslation(); const focusText = useHomeFocusText();
  const router = useRouter(); const theme = useTheme(); const insets = useSafeAreaInsets();
  const bundle = useBundle(); const progress = useProgress(); const examDate = useSettings((s) => s.examDate);
  const [now, setNow] = useState(stamp);
  useFocusEffect(useCallback(() => {
    const refresh = () => setNow(stamp());
    const initial = setTimeout(refresh, 0);
    const timer = setInterval(refresh, 60000);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearTimeout(initial); clearInterval(timer); listener.remove(); };
  }, []));
  const data = useMemo(() => snapshot(bundle, progress, now), [bundle, progress, now]);
  const date = homeExamDate(examDate, now);
  const dateLabel = date.kind === 'unset' ? t('homeUi.setDate') : date.kind === 'past' ? t('homeUi.testPassed') : date.kind === 'today' ? t('homeUi.testToday') : t('homeUi.testIn', { count: date.days ?? 0 });
  const open = (route: string) => router.push(route, { withAnchor: needsTabAnchor(route) });
  const tile = (icon: string, label: string, route: string) => <Panel onPress={() => open(route)} accessibilityLabel={label} style={styles.tile}><Text style={styles.tileIcon}>{icon}</Text><Text variant='titleSmall' style={styles.center}>{label}</Text></Panel>;
  return <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
    <View style={styles.header}>
      <Text variant='headlineSmall' style={styles.grow}>{t('home.greeting')}</Text>
      <Button mode='text' compact accessibilityLabel={t('settings.title')} onPress={() => open('/settings')}>{t('settings.title')}</Button>
    </View>
    {bundle.sample ? <Panel tone='warning'><Text>{t('common.sampleBanner')}</Text></Panel> : null}
    <HomeOverview data={data} onProgress={() => open('/progress')} onExams={() => open('/exams')} />
    <HomeRecommendation data={data} bundle={bundle} onOpen={open} />
    <View style={styles.section}>
      <Text variant='titleMedium'>{focusText.today}</Text>
      <View style={styles.today}>
        <View style={styles.todayItem}><StatCard fill={false} icon='🔄' value={String(data.review.due)} label={t('homeUi.dueLabel')} onPress={() => open('/review')} /></View>
        <View style={styles.todayItem}><StatCard fill={false} icon='📅' value={date.value} label={dateLabel} onPress={() => open('/settings')} /></View>
        <View style={styles.todayItem}><StudyStreakCard streak={progress.streak} now={now} legacySaved={progress.legacyActivityStreak !== null} /></View>
      </View>
    </View>
    <View style={styles.section}>
      <Text variant='titleMedium'>{focusText.shortcuts}</Text>
      <View style={styles.tiles}>
        {tile('📚', t('tabs.learn'), '/learn')}
        {tile('🔄', t('tabs.review'), '/review')}
        {tile('📝', t('tabs.exams'), '/exams')}
        {tile('📊', t('tabs.progress'), '/progress')}
      </View>
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grow: { flex: 1 },
  center: { textAlign: 'center' },
  section: { gap: 10 },
  today: HOME_STATUS_ROW,
  todayItem: HOME_STATUS_ITEM,
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { flexBasis: '46%', flexGrow: 1, minWidth: 120, alignItems: 'center', paddingVertical: 16, gap: 6 },
  tileIcon: { fontSize: 24 },
});
