import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { GlossaryLanguagePicker } from '../../../src/components/GlossaryLanguagePicker';
import { getGlossaryTranslation } from '../../../src/content/glossaryTranslations';
import { useBundle } from '../../../src/content/useBundle';
import { matchesGlossaryDisplay } from '../../../src/logic/glossaryLanguages';
import { useGlossaryLanguage } from '../../../src/store/glossaryLanguage';
import { useSettings } from '../../../src/store/settings';
import type { ContentBundle } from '../../../src/types';

export default function GlossaryScreen() {
  const bundle = useBundle();
  const { termId } = useLocalSearchParams<{ termId?: string }>();
  return <GlossaryContent key={`${bundle.lang}-${termId ?? ''}`} bundle={bundle} termId={Number(termId)} />;
}
function GlossaryContent({ bundle, termId }: { bundle: ContentBundle; termId: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useGlossaryLanguage((s) => s.language);
  const scale = useSettings((s) => s.textScale);
  const [query, setQuery] = useState(() => bundle.glossary.find((term) => term.id === termId)?.term ?? '');
  const results = useMemo(() => bundle.glossary.map((term) => getGlossaryTranslation(term, language)).filter((display) => matchesGlossaryDisplay(display, query)).sort((a, b) => a.source.term.localeCompare(b.source.term, bundle.lang, { sensitivity: 'base' })), [bundle, language, query]);
  const size = 17 * scale;
  return <View style={[styles.root, { backgroundColor: theme.colors.surface }]}>
    <Stack.Screen options={{ title: t('glossaryUi.title') }} />
    <View style={styles.search}>
      <TextInput accessibilityLabel={t('glossaryUi.search')} placeholder={t('glossaryUi.search')} value={query} onChangeText={setQuery} autoCapitalize='none' autoCorrect={false} mode='outlined' left={<TextInput.Icon icon='magnify' />} right={query ? <TextInput.Icon icon='close' accessibilityLabel={t('glossaryUi.clear')} onPress={() => setQuery('')} /> : undefined} />
      <GlossaryLanguagePicker />
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{t('glossaryUi.results', { count: results.length })}</Text>
    </View>
    <FlatList key={`${language}-${query}`} data={results} keyExtractor={(display) => String(display.source.id)} keyboardShouldPersistTaps='handled' contentContainerStyle={styles.list} ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant }} />} ListEmptyComponent={<Text variant='bodyLarge' style={styles.empty}>{t('glossaryUi.empty')}</Text>} renderItem={({ item }) => {
      const direction = { textAlign: item.rtl ? 'right' as const : 'left' as const, writingDirection: item.rtl ? 'rtl' as const : 'ltr' as const };
      return <View style={styles.entry}>
        <Text selectable accessibilityRole='header' variant='titleLarge' style={[styles.term, { fontSize: size + 3 }]}>{item.source.term}</Text>
        {item.missing ? <Text variant='bodySmall'>{t('glossaryUi.missingTranslation')}</Text> : null}
        {item.term !== item.source.term ? <Text selectable variant='titleMedium' style={[direction, { color: theme.colors.secondary, fontWeight: '700', fontSize: size + 1 }]}>{item.term}</Text> : null}
        <Text selectable variant='bodyLarge' style={[direction, { color: theme.colors.onSurfaceVariant, fontSize: size, lineHeight: size * 1.65 }]}>{item.definition}</Text>
      </View>;
    }} />
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, search: { padding: 16, gap: 10 }, list: { paddingBottom: 24 }, entry: { paddingHorizontal: 20, paddingVertical: 24, gap: 12 }, term: { fontWeight: '700' }, empty: { padding: 24, textAlign: 'center' } });
