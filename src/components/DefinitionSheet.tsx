import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../store/settings';
import type { GlossaryTerm } from '../types';

interface Props { term: GlossaryTerm | null; onClose: () => void; onOpen: (term: GlossaryTerm) => void; }

export function DefinitionSheet({ term, onClose, onOpen }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useSettings((s) => s.reduceMotion);
  if (!term) return null;
  return <Modal transparent visible animationType={reduce ? 'none' : 'slide'} onRequestClose={onClose}>
    <View style={styles.root}>
      <Pressable accessibilityRole='button' accessibilityLabel={t('glossaryUi.close')} onPress={onClose} style={[StyleSheet.absoluteFill, styles.backdrop]} />
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(16, insets.bottom) }]}>
        <View style={styles.header}>
          <Text variant='headlineSmall' accessibilityRole='header' style={styles.title}>{term.term}</Text>
          <Pressable accessibilityRole='button' accessibilityLabel={t('glossaryUi.close')} onPress={onClose} style={styles.close}><Text style={{ fontSize: 24 }}>✕</Text></Pressable>
        </View>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}><Text selectable variant='bodyLarge'>{term.definition}</Text></ScrollView>
        <Button mode='outlined' onPress={() => onOpen(term)}>{t('glossaryUi.openGlossary')}</Button>
        <Button mode='contained' buttonColor={theme.colors.secondary} textColor={theme.colors.onSecondary} onPress={onClose}>{t('glossaryUi.close')}</Button>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { maxHeight: '80%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontWeight: '700' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { flexShrink: 1 },
  bodyContent: { paddingBottom: 12 },
});
