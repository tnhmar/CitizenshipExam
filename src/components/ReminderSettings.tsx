import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AppState, Linking, Platform, StyleSheet, View } from 'react-native';
import { Button, Switch, Text } from 'react-native-paper';
import { useSettingsResetText } from '../i18n/settingsReset';
import type { RegisteredReminder } from '../logic/reminders';
import { getReminderDiagnostics, openReminderAlarmSettings, readScheduledReminders, requestReminderPermission, scheduledTestReminder, syncReminders, testReminder, type ReminderDiagnostics } from '../notifications/reminders';
import { useReminderSettings } from '../store/reminders';
import { useSettings } from '../store/settings';
import { NativePickerRow } from './NativePickerRow';
import { Panel } from './Panel';
const DURATIONS = [10, 20, 30, 45];
export function ReminderSettings({ technical = false, onTechnicalDetails }: { technical?: boolean; onTechnicalDetails?: () => void }) {
  const { t, i18n } = useTranslation(); const text = useSettingsResetText();
  const prefs = useReminderSettings((s) => s.prefs); const report = useReminderSettings((s) => s.report); const setPrefs = useReminderSettings((s) => s.setPrefs);
  const minutes = useSettings((s) => s.dailyGoalMin); const setMinutes = useSettings((s) => s.setDailyGoal);
  const [busy, setBusy] = useState(false); const busyRef = useRef(false); const mounted = useRef(false); const readVersion = useRef(0);
  const [schedule, setSchedule] = useState<RegisteredReminder[] | null>(null); const [diagnostics, setDiagnostics] = useState<ReminderDiagnostics | null>(null); const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [durationVisible, setDurationVisible] = useState(false); const noNative = Platform.OS === 'web';
  const load = useCallback(async () => {
    if (noNative) return;
    const version = ++readVersion.current;
    try { const [rows, status] = await Promise.all([readScheduledReminders(), getReminderDiagnostics()]); if (!mounted.current || version !== readVersion.current) return; setSchedule(rows); setDiagnostics(status); setInspectionError(null); }
    catch (error) { if (!mounted.current || version !== readVersion.current) return; setSchedule(null); setDiagnostics(null); setInspectionError(error instanceof Error ? error.message : String(error)); }
  }, [noNative]);
  useEffect(() => { mounted.current = true; const listener = AppState.addEventListener('change', (state) => { if (state === 'active') void load(); }); return () => { mounted.current = false; readVersion.current += 1; listener.remove(); }; }, [load]);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => { clearTimeout(timer); readVersion.current += 1; }; }, [load, report]);
  const run = async (action: () => Promise<void>) => { if (busyRef.current) return; busyRef.current = true; setBusy(true); try { await action(); } catch (error) { Alert.alert(t('remindersUi.error'), error instanceof Error ? error.message : String(error)); } finally { await load(); busyRef.current = false; if (mounted.current) setBusy(false); } };
  const formatAt = (at: number) => new Date(at).toLocaleString(i18n.language);
  const permissionKey = diagnostics?.notificationsAllowed === true ? 'notificationsAllowed' : diagnostics?.notificationsAllowed === false ? 'notificationsBlocked' : 'notificationsUnknown';
  const channelKey = diagnostics?.channelEnabled === true ? 'channelEnabled' : diagnostics?.channelEnabled === false ? 'channelBlocked' : 'channelUnknown';
  const androidAlarms = Platform.OS === 'android' && Number(Platform.Version) >= 31;
  return <Panel>
    {!technical ? <>
      <View style={styles.row}><Text style={styles.grow}>{t('remindersUi.enabled')}</Text><Switch accessibilityLabel={t('remindersUi.enabled')} value={prefs.enabled} disabled={busy || noNative} onValueChange={(value) => void run(async () => { if (value && !await requestReminderPermission()) { Alert.alert(t('remindersUi.blocked'), t('remindersUi.permissionHint')); return; } setPrefs({ enabled: value }); await syncReminders(); })} /></View>
      <NativePickerRow mode='time' label={t('settingsUx.reminderTime')} value={prefs.time} disabled={busy} onValueChange={(time) => void run(async () => { setPrefs({ time }); await syncReminders(); })} />
      {(['study', 'review', 'exam'] as const).map((kind) => <View key={kind} style={styles.row}><Text style={styles.grow}>{t(`remindersUi.${kind}`)}</Text><Switch accessibilityLabel={t(`remindersUi.${kind}`)} value={prefs[kind]} disabled={!prefs.enabled || busy || noNative} onValueChange={(value) => void run(async () => { setPrefs({ [kind]: value }); await syncReminders(); })} /></View>)}
      <Text variant='titleSmall'>{text.status}</Text>
      <Text variant='bodySmall' accessibilityLiveRegion='polite'>{noNative ? t('remindersUi.unsupported') : !prefs.enabled ? t('remindersUi.off') : diagnostics?.notificationsAllowed === false ? t('remindersUi.blocked') : report.status === 'error' || inspectionError ? text.unavailable : schedule === null ? text.checking : t('remindersUi.scheduled', { count: schedule.length })}</Text>
      <Button mode='outlined' disabled={busy || noNative} onPress={() => void run(async () => { await testReminder(); Alert.alert(t('remindersUi.test'), t('remindersUi.testScheduled')); })}>{t('remindersUi.test')}</Button>
      <Button disabled={busy} onPress={() => setDurationVisible((value) => !value)}>{text.duration} · {t('onboarding.minutes', { count: minutes })}</Button>
      {durationVisible ? <><Text variant='bodySmall'>{t('settingsUx.durationHint')}</Text><View style={styles.buttons}>{DURATIONS.map((duration) => <Button key={duration} mode={minutes === duration ? 'contained' : 'outlined'} disabled={busy} accessibilityState={{ selected: minutes === duration }} onPress={() => setMinutes(duration)}>{t('onboarding.minutes', { count: duration })}</Button>)}</View></> : null}
      {onTechnicalDetails ? <Button mode='text' onPress={onTechnicalDetails}>{text.technical} ›</Button> : null}
    </> : <>
      <Text variant='bodySmall'>{t('remindersUi.privacy')}</Text><Text variant='bodySmall'>{t('remindersUi.window')}</Text><Text variant='bodySmall'>{t('remindersUi.bestEffort')}</Text><Text variant='bodySmall'>{t('remindersUi.localZone')}</Text>
      {!noNative ? <><Text variant='titleSmall'>{t('remindersUi.diagnostics')}</Text><Text variant='bodySmall'>{t(`remindersUi.${permissionKey}`)}</Text>{Platform.OS === 'android' && Number(Platform.Version) >= 26 ? <Text variant='bodySmall'>{t(`remindersUi.${channelKey}`)}</Text> : null}{androidAlarms ? <><Text variant='bodySmall'>{t('remindersUi.exactUnverified')}</Text>{diagnostics && !diagnostics.exactAlarmDeclared ? <Text variant='bodySmall'>{t('remindersUi.exactMissing')}</Text> : null}<Text variant='bodySmall'>{t('remindersUi.alarmHint')}</Text><Button mode='outlined' disabled={busy} onPress={() => void run(openReminderAlarmSettings)}>{t('remindersUi.alarmSettings')}</Button></> : null}</> : null}
      <Text variant='bodyMedium' accessibilityLiveRegion='polite'>{t(`remindersUi.${report.status}`)}</Text>
      {schedule !== null ? <Text variant='bodySmall'>{t('remindersUi.scheduled', { count: schedule.length })}</Text> : null}
      {report.created !== undefined ? <Text variant='bodySmall'>{`${t('remindersUi.createdCount', { count: report.created })} · ${t('remindersUi.cancelledCount', { count: report.cancelled ?? 0 })} · ${t('remindersUi.failedCount', { count: report.failed ?? 0 })}`}</Text> : null}
      {report.verifiedAt ? <Text variant='bodySmall'>{t('remindersUi.verified', { date: formatAt(report.verifiedAt) })}</Text> : null}
      {report.until ? <Text variant='bodySmall'>{t('remindersUi.until', { date: new Date(report.until).toLocaleDateString(i18n.language) })}</Text> : null}
      {schedule && schedule.length > 0 ? <><Text variant='titleSmall'>{t('remindersUi.upcomingTitle')}</Text><Text variant='bodySmall'>{t('remindersUi.plannedTimes')}</Text>{schedule.slice(0, 3).map((item) => <View key={item.id} style={styles.preview}><Text variant='bodySmall'>{formatAt(item.at)}</Text><Text variant='bodySmall'>{item.title}</Text>{item.kinds.length ? <Text variant='bodySmall'>{item.kinds.map((kind) => t(`remindersUi.${kind}`)).join(', ')}</Text> : null}{item.route ? <Text variant='bodySmall'>{item.route}</Text> : null}</View>)}</> : schedule !== null && prefs.enabled ? <Text variant='bodySmall'>{t('remindersUi.noneScheduled')}</Text> : null}
      {report.status === 'ready' && report.planned === 0 ? <Text variant='bodySmall'>{t('remindersUi.noTask')}</Text> : null}
      {inspectionError ? <Text selectable variant='bodySmall'>{`${t('remindersUi.inspectError')} ${inspectionError}`}</Text> : null}{report.error ? <Text selectable variant='bodySmall'>{report.error}</Text> : null}
      <View style={styles.buttons}><Button mode='outlined' disabled={busy || noNative} onPress={() => void run(async () => { const at = await scheduledTestReminder(); Alert.alert(t('remindersUi.testDate'), t('remindersUi.testDateScheduled', { time: formatAt(at) })); })}>{t('remindersUi.testDate')}</Button><Button disabled={busy || noNative} onPress={() => void run(syncReminders)}>{t('remindersUi.refresh')}</Button><Button disabled={busy || noNative} onPress={() => void run(async () => { await Linking.openSettings(); })}>{t('remindersUi.systemSettings')}</Button></View>
    </>}
  </Panel>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }, grow: { flex: 1 }, buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, preview: { gap: 2, paddingVertical: 6 } });
