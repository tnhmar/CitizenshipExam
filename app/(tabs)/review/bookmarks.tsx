import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { Panel } from '../../../src/components/Panel';
import { useBundle } from '../../../src/content/useBundle';
import { bookmarkQuestions } from '../../../src/logic/bookmarks';
import { normalizeSearch } from '../../../src/logic/glossary';
import { useProgress } from '../../../src/store/progress';

export default function BookmarksScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const bundle = useBundle();
  const bookmarks = useProgress((s) => s.bookmarks);
  const remove = useProgress((s) => s.removeBookmark);
  const [query, setQuery] = useState('');
  const items = useMemo(() => bookmarkQuestions(bundle, bookmarks), [bundle, bookmarks]);
  const shown = items.filter((item) => normalizeSearch(item.question.text).includes(normalizeSearch(query)));
  return <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
    <Stack.Screen options={{ title: t('bookmarksUi.title') }} />
    <View style={styles.header}><Text variant='bodySmall'>{t('bookmarksUi.hint')}</Text><TextInput mode='outlined' value={query} onChangeText={setQuery} placeholder={t('bookmarksUi.search')} accessibilityLabel={t('bookmarksUi.search')} autoCapitalize='none' autoCorrect={false} right={query ? <TextInput.Icon icon='close' onPress={() => setQuery('')} accessibilityLabel={t('glossaryUi.clear')} /> : undefined} /><Text variant='labelLarge'>{t('bookmarksUi.count', { count: shown.length })}</Text></View>
    <FlatList data={shown} keyExtractor={(item) => item.conceptId} keyboardShouldPersistTaps='handled' contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>{t(items.length ? 'glossaryUi.empty' : 'bookmarksUi.empty')}</Text>} renderItem={({ item }) => <Panel>
      <Text variant='labelMedium' style={{ color: theme.colors.onSurfaceVariant }}>{bundle.chapters.find((c) => c.id === item.question.chapterId)?.title ?? t('exams.other')}</Text>
      <Text variant='bodyLarge'>{item.question.text}</Text>
      <View style={styles.row}><Button mode='outlined' onPress={() => router.push(`/review/bookmarks-practice?concept=${encodeURIComponent(item.conceptId)}`)}>{t('bookmarksUi.practiceOne')}</Button><Button accessibilityLabel={t('bookmarksUi.remove')} onPress={() => remove(item.conceptId)}>{t('bookmarksUi.remove')}</Button></View>
    </Panel>} />
    <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}><Button mode='contained' buttonColor={theme.colors.secondary} textColor={theme.colors.onSecondary} disabled={shown.length === 0} onPress={() => router.push(`/review/bookmarks-practice?search=${encodeURIComponent(query)}`)}>{t('bookmarksUi.practice')}</Button></View>
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, header: { padding: 16, gap: 10 }, list: { padding: 16, paddingBottom: 24, gap: 12 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, empty: { padding: 20, textAlign: 'center' }, footer: { padding: 16 } });
