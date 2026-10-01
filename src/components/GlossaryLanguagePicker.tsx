import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { GLOSSARY_LANGUAGES } from '../logic/glossaryLanguages';
import { useGlossaryLanguage } from '../store/glossaryLanguage';

const labels = { ar: 'العربية', fr: 'Français', en: 'English' };
export function GlossaryLanguagePicker() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useGlossaryLanguage((s) => s.language);
  const setLanguage = useGlossaryLanguage((s) => s.setLanguage);
  return <View style={styles.row}>{GLOSSARY_LANGUAGES.map((code) => {
    const selected = code === language;
    return <Pressable key={code} accessibilityRole='button' accessibilityLabel={`${t('glossaryUi.language')}: ${labels[code]}`} accessibilityState={{ selected }} onPress={() => setLanguage(code)} style={[styles.button, { backgroundColor: selected ? theme.colors.secondary : theme.colors.surface, borderColor: theme.colors.secondary }]}><Text variant='labelLarge' style={{ color: selected ? theme.colors.onSecondary : theme.colors.secondary, textAlign: 'center', writingDirection: code === 'ar' ? 'rtl' : 'ltr' }}>{labels[code]}</Text></Pressable>;
  })}</View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, button: { flex: 1, minWidth: 90, minHeight: 44, borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' } });
