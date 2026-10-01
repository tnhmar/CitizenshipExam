import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform, StyleSheet, View } from 'react-native';
import { Button, Switch, Text } from 'react-native-paper';
import { requestReminderPermission, syncReminders, testReminder } from '../notifications/reminders';
import { useReminderSettings } from '../store/reminders';
import { useSettings } from '../store/settings';
import { NativePickerRow } from './NativePickerRow';
import { Panel } from './Panel';

const DURATIONS = [10, 20, 30, 45];
export function ReminderSettings() {
  const { t, i18n } = useTranslation();
  const prefs = useReminderSettings((s) => s.prefs);
  const report = useReminderSettings((s) => s.report);
  const setPrefs = useReminderSettings((s) => s.setPrefs);
  const minutes = useSettings((s) => s.dailyGoalMin);
  const setMinutes = useSettings((s) => s.setDailyGoal);
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); }
    catch (error) { Alert.alert(t('remindersUi.error'), error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  };
  return <Panel>
    <Text variant='titleMedium'>{t('remindersUi.title')}</Text>
    <Text variant='bodySmall'>{t('remindersUi.privacy')}</Text>
    <View style={styles.row}><Text style={styles.grow}>{t('remindersUi.enabled')}</Text><Switch value={prefs.enabled} disabled={busy || Platform.OS === 'web'} onValueChange={(value) => void run(async () => {
      if (value && !await requestReminderPermission()) { Alert.alert(t('remindersUi.blocked'), t('remindersUi.permissionHint')); return; }
      setPrefs({ enabled: value }); await syncReminders();
    })} /></View>
    {(['study', 'review', 'exam'] as const).map((kind) => <View key={kind} style={styles.row}><Text style={styles.grow}>{t(`remindersUi.${kind}`)}</Text><Switch value={prefs[kind]} disabled={!prefs.enabled || busy} onValueChange={(value) => void run(async () => { setPrefs({ [kind]: value }); await syncReminders(); })} /></View>)}
    <NativePickerRow mode='time' label={t('settingsUx.reminderTime')} value={prefs.time} disabled={busy} onValueChange={(time) => void run(async () => { setPrefs({ time }); await syncReminders(); })} />
    <Text variant='titleSmall'>{t('settingsUx.suggestedDuration')}</Text>
    <Text variant='bodySmall'>{t('settingsUx.durationHint')}</Text>
    <View style={styles.buttons}>{DURATIONS.map((duration) => <Button key={duration} mode={minutes === duration ? 'contained' : 'outlined'} disabled={busy} accessibilityState={{ selected: minutes === duration }} onPress={() => setMinutes(duration)}>{t('onboarding.minutes', { count: duration })}</Button>)}</View>
    <Text variant='bodySmall'>{t('remindersUi.window')}</Text>
    <Text variant='bodySmall'>{t('remindersUi.bestEffort')}</Text>
    <Text variant='bodyMedium'>{t(`remindersUi.${report.status}`)}</Text>
    {report.status === 'ready' ? <Text variant='bodySmall'>{t('remindersUi.scheduled', { count: report.count })}</Text> : null}
    {report.nextAt ? <Text variant='bodySmall'>{t('remindersUi.next', { date: new Date(report.nextAt).toLocaleString(i18n.language) })}</Text> : null}
    {report.until ? <Text variant='bodySmall'>{t('remindersUi.until', { date: new Date(report.until).toLocaleDateString(i18n.language) })}</Text> : null}
    {report.error ? <Text selectable variant='bodySmall'>{report.error}</Text> : null}
    <View style={styles.buttons}>
      <Button mode='outlined' disabled={busy || Platform.OS === 'web'} onPress={() => void run(async () => { await testReminder(); Alert.alert(t('remindersUi.test'), t('remindersUi.testScheduled')); })}>{t('remindersUi.test')}</Button>
      <Button disabled={busy || Platform.OS === 'web'} onPress={() => void run(syncReminders)}>{t('remindersUi.refresh')}</Button>
      <Button disabled={busy || Platform.OS === 'web'} onPress={() => void run(async () => { await Linking.openSettings(); })}>{t('remindersUi.systemSettings')}</Button>
    </View>
  </Panel>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, grow: { flex: 1 }, buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } });
