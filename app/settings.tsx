import Slider from '@react-native-community/slider';
import Constants from 'expo-constants';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Switch, Text, useTheme } from 'react-native-paper';
import { LearningLevelSettings } from '../src/components/LearningLevelSettings';
import { NativePickerRow } from '../src/components/NativePickerRow';
import { Panel } from '../src/components/Panel';
import { ReminderSettings } from '../src/components/ReminderSettings';
import { Screen } from '../src/components/Screen';
import { SettingsSection } from '../src/components/SettingsSection';
import { feedbackHaptic } from '../src/hooks/useHaptics';
import { deviceLang } from '../src/i18n';
import { useLearningLevelText } from '../src/i18n/learningLevels';
import { useSettingsResetText } from '../src/i18n/settingsReset';
import { learningPassPercent } from '../src/logic/learningLevels';
import { dateForPicker } from '../src/logic/pickerValues';
import { isValidDay } from '../src/logic/date';
import { syncReminders } from '../src/notifications/reminders';
import { useProgress } from '../src/store/progress';
import { useReminderSettings } from '../src/store/reminders';
import { useSettings } from '../src/store/settings';

type Detail = 'language' | 'appearance' | 'text' | 'haptics' | 'motion' | 'quiz' | 'date' | 'reminders' | 'technical' | 'data';
export default function SettingsScreen() {
  const { t, i18n } = useTranslation(); const text = useSettingsResetText(); const quizText = useLearningLevelText(); const theme = useTheme(); const router = useRouter();
  const s = useSettings(); const prefs = useReminderSettings((r) => r.prefs); const resetAll = useProgress((p) => p.resetAll);
  const [detail, setDetail] = useState<Detail | null>(null); const [confirm, setConfirm] = useState(false);
  const current = s.lang ?? deviceLang(); const size = Math.round(17 * s.textScale);
  const back = useCallback(() => setDetail((value) => value === 'technical' ? 'reminders' : null), []);
  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (detail === null) return false;
      back(); return true;
    });
    return () => listener.remove();
  }, [detail, back]));
  const titles: Record<Detail, string> = { language: t('settings.language'), appearance: text.appearance, text: t('settingsUx.textSize'), haptics: t('settingsUx.haptics'), motion: t('settings.reduceMotion'), quiz: quizText.title, date: t('settingsUx.examDate'), reminders: text.reminders, technical: text.technical, data: text.dataProgress };
  const row = (key: Detail, summary?: string, destructive = false) => <Pressable key={key} accessibilityRole='button' accessibilityLabel={[titles[key], summary].filter(Boolean).join('. ')} onPress={() => setDetail(key)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={styles.grow}><Text variant='bodyLarge' style={destructive ? { color: theme.colors.error } : undefined}>{titles[key]}</Text>{summary ? <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{summary}</Text> : null}</View><Text accessible={false} style={{ color: theme.colors.onSurfaceVariant }}>›</Text></Pressable>;
  const toggle = (label: string, value: boolean, onChange: (value: boolean) => void) => <View style={styles.row}><Text style={styles.grow}>{label}</Text><Switch accessibilityLabel={label} value={value} onValueChange={onChange} /></View>;
  const dateSummary = s.examDate && isValidDay(s.examDate) ? dateForPicker('date', s.examDate, 0).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' }) : text.notSet;
  return <Screen>
    <Stack.Screen options={{ title: detail ? titles[detail] : t('settings.title'), headerLeft: detail ? () => <Button compact textColor={theme.colors.onPrimary} onPress={back}>{text.back}</Button> : undefined, headerRight: () => <Button compact textColor={theme.colors.onPrimary} onPress={() => router.back()}>{t('settingsUx.close')}</Button> }} />
    {detail === null ? <>
      <SettingsSection title={text.preferences}>
        {row('language', current === 'fr' ? 'Français' : 'English')}
        {row('quiz', `${quizText[s.quizLevel]} · ${learningPassPercent(s.quizLevel)} %`)}
        {row('appearance', text[s.themeMode])}
        {row('text', String(size))}
        {row('haptics', s.haptics ? text.on : text.off)}
        {row('motion', s.reduceMotion ? text.on : text.off)}
      </SettingsSection>
      <SettingsSection title={text.exam}>{row('date', dateSummary)}{row('reminders', prefs.enabled ? `${text.on} · ${prefs.time}` : text.off)}</SettingsSection>
      <SettingsSection title={text.data}>{row('data')}<Button mode='text' textColor={theme.colors.error} onPress={() => setConfirm(true)}>{t('settings.reset')}</Button></SettingsSection>
    </> : null}
    {detail === 'quiz' ? <LearningLevelSettings /> : null}
    {detail === 'language' ? <Panel><View style={styles.buttons}><Button mode={current === 'fr' ? 'contained' : 'outlined'} accessibilityState={{ selected: current === 'fr' }} onPress={() => s.setLang('fr')}>Français</Button><Button mode={current === 'en' ? 'contained' : 'outlined'} accessibilityState={{ selected: current === 'en' }} onPress={() => s.setLang('en')}>English</Button></View></Panel> : null}
    {detail === 'appearance' ? <Panel>{(['system', 'light', 'dark'] as const).map((mode) => <Button key={mode} mode={s.themeMode === mode ? 'contained' : 'outlined'} accessibilityState={{ selected: s.themeMode === mode }} onPress={() => { s.setThemeMode(mode); void feedbackHaptic('toggle'); }}>{text[mode]}</Button>)}</Panel> : null}
    {detail === 'text' ? <Panel><View style={styles.between}><Text>16</Text><Text variant='headlineSmall'>{size}</Text><Text>26</Text></View><Slider minimumValue={16 / 17} maximumValue={26 / 17} step={1 / 17} value={s.textScale} onValueChange={s.setTextScale} minimumTrackTintColor={theme.colors.primary} maximumTrackTintColor={theme.colors.surfaceVariant} thumbTintColor={theme.colors.primary} accessibilityLabel={t('settingsUx.textSize')} /><Text style={{ fontSize: size, lineHeight: size * 1.5 }}>{t('settingsUx.preview')}</Text></Panel> : null}
    {detail === 'haptics' ? <Panel>{toggle(t('settingsUx.haptics'), s.haptics, (value) => { s.setHaptics(value); if (value) void feedbackHaptic('toggle'); })}</Panel> : null}
    {detail === 'motion' ? <Panel>{toggle(t('settings.reduceMotion'), s.reduceMotion, s.setReduceMotion)}</Panel> : null}
    {detail === 'date' ? <Panel><NativePickerRow mode='date' value={s.examDate} label={t('settingsUx.examDate')} onValueChange={s.setExamDate} />{s.examDate ? <Button onPress={() => s.setExamDate(null)}>{t('settingsUx.clearDate')}</Button> : null}<Text variant='bodySmall'>{t('settingsUx.dateHint')}</Text></Panel> : null}
    {detail === 'reminders' || detail === 'technical' ? <ReminderSettings technical={detail === 'technical'} onTechnicalDetails={() => setDetail('technical')} /> : null}
    {detail === 'data' ? <Panel><Text variant='titleMedium'>{t('settings.privacy')}</Text><Text>{t('settings.privacyBody')}</Text><Button mode='outlined' onPress={() => router.push('/progress')}>{t('tabs.progress')}</Button><Text variant='bodySmall'>{t('settings.version')} {Constants.expoConfig?.version ?? ''}</Text></Panel> : null}
    <Portal><Dialog visible={confirm} onDismiss={() => setConfirm(false)}><Dialog.Title>{t('settings.resetTitle')}</Dialog.Title><Dialog.Content><Text>{t('settings.resetBody')}</Text></Dialog.Content><Dialog.Actions><Button onPress={() => setConfirm(false)}>{t('common.cancel')}</Button><Button textColor={theme.colors.error} onPress={async () => { useReminderSettings.getState().setPrefs({ enabled: false }); resetAll(); setConfirm(false); try { await syncReminders(); } catch (error) { Alert.alert(t('remindersUi.error'), error instanceof Error ? error.message : String(error)); } }}>{t('common.confirm')}</Button></Dialog.Actions></Dialog></Portal>
  </Screen>;
}
const styles = StyleSheet.create({ row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }, grow: { flex: 1, gap: 3 }, buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, pressed: { opacity: 0.75 } });
