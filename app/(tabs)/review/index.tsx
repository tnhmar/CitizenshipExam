import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { Panel } from '../../../src/components/Panel';
import { Screen } from '../../../src/components/Screen';
import { REVIEW_SESSION_SIZE } from '../../../src/config';
import { useBundle } from '../../../src/content/useBundle';
import { useReviewQueueText } from '../../../src/i18n/reviewQueue';
import { bookmarkQuestions } from '../../../src/logic/bookmarks';
import { conceptPool } from '../../../src/logic/learningStats';
import { countDue, countMissed, countUnresolved } from '../../../src/logic/review';
import { useProgress } from '../../../src/store/progress';
import { palette, tints } from '../../../src/theme';

const stamp = (): number => Date.now();
export default function ReviewIndex() {
  const { t } = useTranslation(); const text = useReviewQueueText(); const router = useRouter(); const theme = useTheme();
  const bundle = useBundle(); const cards = useProgress((s) => s.cards); const bookmarks = useProgress((s) => s.bookmarks);
  const [now, setNow] = useState(stamp);
  useFocusEffect(useCallback(() => {
    const refresh = () => setNow(stamp()); const initial = setTimeout(refresh, 0); const timer = setInterval(refresh, 60000);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearTimeout(initial); clearInterval(timer); listener.remove(); };
  }, []));
  const rows = Object.values(cards);
  const due = countDue(rows, now, bundle); const pending = countUnresolved(bundle, rows); const historic = countMissed(rows, bundle);
  const saved = bookmarkQuestions(bundle, bookmarks).length;
  const success = theme.dark ? '#8DCB91' : palette.success; const solid = theme.dark ? tints.dark : tints.light;
  const poolHint = (count: number) => text.pool.replace('{count}', String(count)).replace('{size}', String(Math.min(count, REVIEW_SESSION_SIZE)));
  const deck = (key: string, icon: string, title: string, hint: string, count: number, route = `/review/session?deck=${key}`) => <Panel key={key} onPress={count ? () => router.push(route) : undefined} style={{ opacity: count ? 1 : 0.6 }}>
    <View style={styles.row}><View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer }]}><Text style={styles.icon}>{icon}</Text></View><View style={styles.grow}><Text variant='titleMedium'>{title}</Text><Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{hint}</Text>{key !== 'bookmarks' && key !== 'flashcards' ? <Text variant='labelSmall'>{poolHint(count)}</Text> : null}</View><View style={[styles.pill, { backgroundColor: count ? solid.success : theme.colors.surfaceVariant }]}><Text variant='labelLarge' style={{ color: count ? success : theme.colors.onSurfaceVariant }}>{count}</Text></View></View>
  </Panel>;
  return <Screen>
    <Panel tone='primary'><Text variant='headlineSmall' style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>{due > 0 ? t('reviewUi.heroDue', { count: due }) : t('reviewUi.heroNone')}</Text><Text variant='bodyMedium' style={{ color: theme.colors.onPrimary }}>{due > 0 ? t('homeUi.reviewDueHint') : t('reviewUi.heroNoneHint')}</Text><Button mode='contained' buttonColor='#FFFFFF' textColor={theme.colors.primary} onPress={() => router.push(`/review/session?deck=${due > 0 ? 'due' : 'random'}`)}>{due > 0 ? t('reviewUi.startNow') : t('reviewUi.practiceNow')}</Button></Panel>
    {deck('bookmarks', '🔖', t('bookmarksUi.title'), t('bookmarksUi.hint'), saved, '/review/bookmarks')}
    {deck('due', '🔄', t('review.dueToday'), t('review.dueHint', { count: due }), due)}
    {deck('missed', '🎯', text.unresolved, text.unresolvedHint, pending)}
    {deck('history', '◷', text.history, text.historyHint, historic)}
    {deck('random', '🎲', t('review.random'), t('review.randomHint'), conceptPool(bundle).size)}
    {deck('flashcards', '🃏', t('review.flashcards'), t('review.flashHint', { count: bundle.glossary.length }), bundle.glossary.length)}
  </Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 14 }, badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, icon: { fontSize: 24 }, grow: { flex: 1, gap: 4 }, pill: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 } });
