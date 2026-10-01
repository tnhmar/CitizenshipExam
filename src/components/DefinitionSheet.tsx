import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getGlossaryTranslation } from '../content/glossaryTranslations';
import { useGlossaryLanguage } from '../store/glossaryLanguage';
import { useSettings } from '../store/settings';
import type { GlossaryTerm } from '../types';
import { GlossaryLanguagePicker } from './GlossaryLanguagePicker';

interface Props { term: GlossaryTerm | null; onClose: () => void; onOpen: (term: GlossaryTerm) => void; }
export function DefinitionSheet({ term, onClose, onOpen }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useSettings((s) => s.reduceMotion);
  const scale = useSettings((s) => s.textScale);
  const language = useGlossaryLanguage((s) => s.language);
  if (!term) return null;
  const display = getGlossaryTranslation(term, language);
  const size = 17 * scale;
  const direction = { textAlign: display.rtl ? 'right' as const : 'left' as const, writingDirection: display.rtl ? 'rtl' as const : 'ltr' as const };
  return <Modal transparent visible animationType={reduce ? 'none' : 'slide'} onRequestClose={onClose}>
    <View style={styles.root}>
      <Pressable accessibilityRole='button' accessibilityLabel={t('glossaryUi.close')} onPress={onClose} style={[StyleSheet.absoluteFill, styles.backdrop]} />
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(16, insets.bottom) }]}>
        <View style={styles.header}><Text variant='headlineSmall' accessibilityRole='header' style={styles.title}>{term.term}</Text><Pressable accessibilityRole='button' accessibilityLabel={t('glossaryUi.close')} onPress={onClose} style={styles.close}><Text style={{ fontSize: 24 }}>✕</Text></Pressable></View>
        <GlossaryLanguagePicker />
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {display.missing ? <Text variant='bodySmall'>{t('glossaryUi.missingTranslation')}</Text> : null}
          {display.term !== term.term ? <Text selectable variant='titleLarge' style={[direction, { color: theme.colors.secondary, fontWeight: '700', fontSize: size + 3 }]}>{display.term}</Text> : null}
          <Text selectable variant='bodyLarge' style={[direction, { fontSize: size, lineHeight: size * 1.65 }]}>{display.definition}</Text>
        </ScrollView>
        <Button mode='outlined' onPress={() => onOpen(term)}>{t('glossaryUi.openGlossary')}</Button>
        <Button mode='contained' buttonColor={theme.colors.secondary} textColor={theme.colors.onSecondary} onPress={onClose}>{t('glossaryUi.close')}</Button>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({ root: { flex: 1, justifyContent: 'flex-end' }, backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' }, sheet: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12 }, title: { flex: 1, fontWeight: '700' }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, body: { flexShrink: 1 }, bodyContent: { paddingBottom: 12, gap: 12 } });
