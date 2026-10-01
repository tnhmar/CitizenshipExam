import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Switch, Text, useTheme } from 'react-native-paper';
import { feedbackHaptic } from '../hooks/useHaptics';
import { useSettings } from '../store/settings';
import { SettingsSection } from './SettingsSection';

export function SettingsPreferences() {
  const { t } = useTranslation(); const theme = useTheme(); const scale = useSettings((s) => s.textScale); const setScale = useSettings((s) => s.setTextScale); const mode = useSettings((s) => s.themeMode); const setMode = useSettings((s) => s.setThemeMode); const haptics = useSettings((s) => s.haptics); const setHaptics = useSettings((s) => s.setHaptics);
  const size = Math.round(17 * scale);
  return <>
    <SettingsSection title={t('settingsUx.preferences')}>
      <Text variant='titleSmall'>{t('settingsUx.textSize')}</Text>
      <View style={styles.between}><Text variant='bodySmall'>16</Text><Text variant='headlineSmall'>{size}</Text><Text variant='bodySmall'>26</Text></View>
      <Slider minimumValue={16 / 17} maximumValue={26 / 17} step={1 / 17} value={scale} onValueChange={setScale} minimumTrackTintColor={theme.colors.primary} maximumTrackTintColor={theme.colors.surfaceVariant} thumbTintColor={theme.colors.primary} accessibilityLabel={t('settingsUx.textSize')} />
      <Text variant='bodyMedium' style={{ fontSize: size, lineHeight: size * 1.5 }}>{t('settingsUx.preview')}</Text>
      <View style={styles.row}><Text style={styles.grow}>{t('settingsUx.automaticTheme')}</Text><Switch value={mode === 'system'} onValueChange={(value) => { setMode(value ? 'system' : theme.dark ? 'dark' : 'light'); void feedbackHaptic('toggle'); }} /></View>
      <View style={styles.row}><Text style={styles.grow}>{t('settingsUx.darkMode')}</Text><Switch value={mode === 'dark'} disabled={mode === 'system'} onValueChange={(value) => { setMode(value ? 'dark' : 'light'); void feedbackHaptic('toggle'); }} /></View>
      <View style={styles.row}><Text style={styles.grow}>{t('settingsUx.haptics')}</Text><Switch value={haptics} onValueChange={(value) => { setHaptics(value); if (value) void feedbackHaptic('toggle'); }} /></View>
    </SettingsSection>
  </>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, grow: { flex: 1 }, between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } });
