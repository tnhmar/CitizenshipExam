import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { useBundle } from '../../../src/content/useBundle';
import { searchGlossary } from '../../../src/logic/glossary';
import type { ContentBundle } from '../../../src/types';

export default function GlossaryScreen() {
  const bundle = useBundle();
  const { termId } = useLocalSearchParams<{ termId?: string }>();
  return <GlossaryContent key={`${bundle.lang}-${termId ?? ''}`} bundle={bundle} termId={Number(termId)} />;
}

function GlossaryContent({ bundle, termId }: { bundle: ContentBundle; termId: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [query, setQuery] = useState(() => bundle.glossary.find((term) => term.id === termId)?.term ?? '');
  const results = useMemo(() => searchGlossary(bundle.glossary, query, bundle.lang), [bundle, query]);
  return <View style={[styles.root, { backgroundColor: theme.colors.surface }]}>
    <Stack.Screen options={{ title: t('glossaryUi.title') }} />
    <View style={styles.search}>
      <TextInput accessibilityLabel={t('glossaryUi.search')} placeholder={t('glossaryUi.search')} value={query} onChangeText={setQuery} autoCapitalize='none' autoCorrect={false} mode='outlined' left={<TextInput.Icon icon='magnify' />} right={query ? <TextInput.Icon icon='close' accessibilityLabel={t('glossaryUi.clear')} onPress={() => setQuery('')} /> : undefined} />
      <View style={styles.meta}><Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{t('glossaryUi.results', { count: results.length })}</Text><Text variant='labelMedium' style={{ color: theme.colors.secondary }}>{bundle.lang === 'fr' ? 'Français' : 'English'}</Text></View>
    </View>
    <FlatList key={query} data={results} keyExtractor={(term) => String(term.id)} keyboardShouldPersistTaps='handled' contentContainerStyle={styles.list} ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant }} />} ListEmptyComponent={<Text variant='bodyLarge' style={styles.empty}>{t('glossaryUi.empty')}</Text>} renderItem={({ item }) => <View style={styles.entry}><Text selectable accessibilityRole='header' variant='titleLarge' style={styles.term}>{item.term}</Text><Text selectable variant='bodyLarge' style={{ color: theme.colors.onSurfaceVariant, lineHeight: 28 }}>{item.definition}</Text></View>} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: { padding: 16, gap: 10 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  list: { paddingBottom: 24 },
  entry: { paddingHorizontal: 20, paddingVertical: 24, gap: 12 },
  term: { fontWeight: '700' },
  empty: { padding: 24, textAlign: 'center' },
});
