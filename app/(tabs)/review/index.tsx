import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { Panel } from '../../../src/components/Panel';
import { Screen } from '../../../src/components/Screen';
import { useBundle } from '../../../src/content/useBundle';
import { bookmarkQuestions } from '../../../src/logic/bookmarks';
import { countDue, countMissed } from '../../../src/logic/review';
import { useProgress } from '../../../src/store/progress';
import { palette, tints } from '../../../src/theme';

const stamp = (): number => Date.now();
export default function ReviewIndex() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const bundle = useBundle();
  const cards = useProgress((s) => s.cards);
  const bookmarks = useProgress((s) => s.bookmarks);
  const [now, setNow] = useState(stamp);
  useFocusEffect(useCallback(() => { setNow(stamp()); const timer = setInterval(() => setNow(stamp()), 60000); return () => clearInterval(timer); }, []));
  const due = countDue(Object.values(cards), now);
  const missed = countMissed(Object.values(cards));
  const saved = bookmarkQuestions(bundle, bookmarks).length;
  const success = theme.dark ? '#8DCB91' : palette.success;
  const solid = theme.dark ? tints.dark : tints.light;
  const deck = (key: string, icon: string, title: string, hint: string, count: number, disabled: boolean, route = `/review/session?deck=${key}`) => <Panel key={key} onPress={disabled ? undefined : () => router.push(route)} style={{ opacity: disabled ? 0.6 : 1 }}><View style={styles.row}><View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer }]}><Text style={styles.icon}>{icon}</Text></View><View style={styles.grow}><Text variant='titleMedium'>{title}</Text><Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{hint}</Text></View><View style={[styles.pill, { backgroundColor: disabled ? theme.colors.surfaceVariant : solid.success }]}><Text variant='labelLarge' style={{ color: disabled ? theme.colors.onSurfaceVariant : success }}>{count}</Text></View></View></Panel>;
  return <Screen>
    <Panel tone='primary'><Text variant='headlineSmall' style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>{due > 0 ? t('reviewUi.heroDue', { count: due }) : t('reviewUi.heroNone')}</Text><Text variant='bodyMedium' style={{ color: theme.colors.onPrimary }}>{due > 0 ? t('homeUi.reviewDueHint') : t('reviewUi.heroNoneHint')}</Text><Button mode='contained' buttonColor='#FFFFFF' textColor={theme.colors.primary} onPress={() => router.push(`/review/session?deck=${due > 0 ? 'due' : 'random'}`)}>{due > 0 ? t('reviewUi.startNow') : t('reviewUi.practiceNow')}</Button></Panel>
    {deck('bookmarks', '🔖', t('bookmarksUi.title'), t('bookmarksUi.hint'), saved, false, '/review/bookmarks')}
    {deck('due', '🔄', t('review.dueToday'), t('review.dueHint', { count: due }), due, due === 0)}
    {deck('missed', '🎯', t('review.missedDeck'), t('review.missedHint', { count: missed }), missed, missed === 0)}
    {deck('random', '🎲', t('review.random'), t('review.randomHint'), 20, false)}
    {deck('flashcards', '🃏', t('review.flashcards'), t('review.flashHint', { count: bundle.glossary.length }), bundle.glossary.length, bundle.glossary.length === 0)}
  </Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 14 }, badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, icon: { fontSize: 24 }, grow: { flex: 1, gap: 2 }, pill: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 } });
