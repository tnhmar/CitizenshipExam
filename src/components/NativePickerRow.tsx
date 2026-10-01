import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import Svg, { Path, Rect } from 'react-native-svg';
import { committedPickerValue, dateForPicker, serializePickerValue, type PickerMode } from '../logic/pickerValues';
import { isValidDay } from '../logic/date';
import { parseReminderTime } from '../logic/reminders';

interface Props { mode: PickerMode; value: string | null; label: string; onValueChange: (value: string) => void; disabled?: boolean; }
const stamp = (): number => Date.now();

export function NativePickerRow({ mode, value, label, onValueChange, disabled = false }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(() => new Date(0));
  const unavailable = disabled || Platform.OS === 'web';
  const valid = value && (mode === 'date' ? isValidDay(value) : Boolean(parseReminderTime(value)));
  const shown = valid ? mode === 'date' ? dateForPicker(mode, value, 0).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' }) : value : t(mode === 'date' ? 'settingsUx.chooseDate' : 'settingsUx.chooseTime');
  const open = () => {
    if (unavailable) return;
    const initial = dateForPicker(mode, value, stamp());
    if (Platform.OS === 'android') {
      try {
        DateTimePickerAndroid.open({
          value: initial, mode, display: mode === 'date' ? 'calendar' : 'clock', is24Hour: true,
          positiveButton: { label: t('common.confirm'), textColor: theme.colors.primary },
          negativeButton: { label: t('common.cancel') },
          onChange: (event, selected) => { const next = committedPickerValue(mode, event.type, selected); if (next !== null) onValueChange(next); },
          onError: (error) => Alert.alert(t('settingsUx.pickerError'), String(error)),
        });
      } catch (error) { Alert.alert(t('settingsUx.pickerError'), error instanceof Error ? error.message : String(error)); }
      return;
    }
    setDraft(initial);
    setVisible(true);
  };
  return <>
    <Pressable accessibilityRole='button' accessibilityLabel={`${label}: ${shown}`} accessibilityState={{ disabled: unavailable }} disabled={unavailable} onPress={open} style={[styles.row, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }, unavailable && styles.disabled]}>
      <Svg width={24} height={24} viewBox='0 0 24 24' fill='none' stroke={theme.colors.secondary} strokeWidth={1.8} strokeLinecap='round' strokeLinejoin='round'>
        {mode === 'date' ? <><Rect x={3} y={5} width={18} height={16} rx={2} /><Path d='M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3M7 18h3' /></> : <><Path d='M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2' /></>}
      </Svg>
      <View style={styles.grow}><Text variant='labelLarge' style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text><Text variant='bodyLarge' style={{ color: theme.colors.secondary }}>{shown}</Text></View>
      <Text style={{ color: theme.colors.secondary, fontSize: 24 }}>›</Text>
    </Pressable>
    {Platform.OS === 'web' ? <Text variant='bodySmall'>{t('settingsUx.mobilePicker')}</Text> : null}
    <Portal><Dialog visible={visible} onDismiss={() => setVisible(false)}>
      <Dialog.Title>{label}</Dialog.Title>
      <Dialog.Content><DateTimePicker value={draft} mode={mode} display='spinner' locale={i18n.language} themeVariant={theme.dark ? 'dark' : 'light'} textColor={theme.colors.onSurface} onChange={(_event, selected) => { if (selected) setDraft(selected); }} /></Dialog.Content>
      <Dialog.Actions><Button onPress={() => setVisible(false)}>{t('common.cancel')}</Button><Button onPress={() => { const next = serializePickerValue(mode, draft); setVisible(false); if (next !== null) onValueChange(next); }}>{t('common.confirm')}</Button></Dialog.Actions>
    </Dialog></Portal>
  </>;
}
const styles = StyleSheet.create({ row: { minHeight: 64, borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, grow: { flex: 1, gap: 4 }, disabled: { opacity: 0.5 } });
