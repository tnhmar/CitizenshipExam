import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Switch, Text, useTheme } from 'react-native-paper';
import { NativePickerRow } from '../src/components/NativePickerRow';
import { Panel } from '../src/components/Panel';
import { ReminderSettings } from '../src/components/ReminderSettings';
import { Screen } from '../src/components/Screen';
import { deviceLang } from '../src/i18n';
import { syncReminders } from '../src/notifications/reminders';
import { useProgress } from '../src/store/progress';
import { useReminderSettings } from '../src/store/reminders';
import { useSettings } from '../src/store/settings';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const s = useSettings();
  const resetAll = useProgress((p) => p.resetAll);
  const [confirm, setConfirm] = useState(false);
  const current = s.lang ?? deviceLang();
  return <Screen>
    <Stack.Screen options={{ headerRight: () => <Button compact textColor={theme.colors.onPrimary} onPress={() => router.back()}>{t('settingsUx.close')}</Button> }} />
    <Panel><Text variant='titleMedium'>{t('settings.language')}</Text><View style={styles.row}><Button mode={current === 'fr' ? 'contained' : 'outlined'} onPress={() => s.setLang('fr')}>Français</Button><Button mode={current === 'en' ? 'contained' : 'outlined'} onPress={() => s.setLang('en')}>English</Button></View></Panel>
    <Panel>
      <Text variant='titleMedium'>{t('settingsUx.examDetails')}</Text>
      <NativePickerRow mode='date' value={s.examDate} label={t('settingsUx.examDate')} onValueChange={s.setExamDate} />
      {s.examDate ? <Button mode='text' onPress={() => s.setExamDate(null)}>{t('settingsUx.clearDate')}</Button> : null}
      <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{t('settingsUx.dateHint')}</Text>
    </Panel>
    <ReminderSettings />
    <Panel><View style={styles.switchRow}><Text style={styles.grow}>{t('settings.reduceMotion')}</Text><Switch value={s.reduceMotion} onValueChange={s.setReduceMotion} /></View></Panel>
    <Button mode='outlined' textColor='#C62828' onPress={() => setConfirm(true)}>{t('settings.reset')}</Button>
    <Text variant='bodySmall'>{t('settings.version')} {Constants.expoConfig?.version ?? ''}</Text>
    <Portal><Dialog visible={confirm} onDismiss={() => setConfirm(false)}>
      <Dialog.Title>{t('settings.resetTitle')}</Dialog.Title><Dialog.Content><Text>{t('settings.resetBody')}</Text></Dialog.Content>
      <Dialog.Actions><Button onPress={() => setConfirm(false)}>{t('common.cancel')}</Button><Button onPress={async () => {
        useReminderSettings.getState().setPrefs({ enabled: false });
        resetAll(); setConfirm(false);
        try { await syncReminders(); } catch (error) { Alert.alert(t('remindersUi.error'), error instanceof Error ? error.message : String(error)); }
      }}>{t('common.confirm')}</Button></Dialog.Actions>
    </Dialog></Portal>
  </Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, grow: { flex: 1 } });
