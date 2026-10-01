import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n, { deviceLang } from '../i18n';
import { planReminders, parseReminderTime, reminderWindowEnd, REMINDER_OWNER, REMINDER_PREFIX } from '../logic/reminders';
import { useProgress } from '../store/progress';
import { useReminderSettings } from '../store/reminders';
import { useSettings } from '../store/settings';

const CHANNEL = 'study-reminders';
const TEST_ID = `${REMINDER_PREFIX}test`;
let queue: Promise<void> = Promise.resolve();

if (Platform.OS !== 'web') Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

const allowed = (p: Notifications.NotificationPermissionsStatus) => p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

async function channel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const lang = useSettings.getState().lang ?? deviceLang();
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: i18n.getFixedT(lang)('remindersUi.title'), importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' });
}

export async function requestReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await channel();
  let permission = await Notifications.getPermissionsAsync();
  if (!allowed(permission) && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  if (!allowed(permission)) useReminderSettings.getState().setReport({ status: 'blocked', count: 0, nextAt: null, until: null, error: null });
  return allowed(permission);
}

async function reconcile(): Promise<void> {
  const report = useReminderSettings.getState().setReport;
  if (Platform.OS === 'web') { report({ status: 'unsupported', count: 0, nextAt: null, until: null, error: null }); return; }
  try {
    const settings = useSettings.getState();
    const prefs = useReminderSettings.getState().prefs;
    const lang = settings.lang ?? deviceLang();
    const t = i18n.getFixedT(lang);
    const existing = (await Notifications.getAllScheduledNotificationsAsync()).filter((n) => n.identifier.startsWith(REMINDER_PREFIX));
    if (!prefs.enabled || !settings.onboarded) {
      for (const n of existing) await Notifications.cancelScheduledNotificationAsync(n.identifier);
      report({ status: 'off', count: 0, nextAt: null, until: null, error: null });
      return;
    }
    if (!allowed(await Notifications.getPermissionsAsync())) {
      for (const n of existing) await Notifications.cancelScheduledNotificationAsync(n.identifier);
      report({ status: 'blocked', count: 0, nextAt: null, until: null, error: null });
      return;
    }
    if (!parseReminderTime(prefs.time)) throw new Error('Invalid reminder time');
    await channel();
    const now = Date.now();
    const plan = planReminders(prefs, Object.values(useProgress.getState().cards), settings.examDate, now);
    const ids = new Set(plan.map((p) => p.id));
    for (const n of existing) if (n.identifier !== TEST_ID && !ids.has(n.identifier)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    for (const item of plan) {
      const route = item.kinds.includes('exam') ? '/exams' : item.kinds.includes('review') ? '/review' : '/learn';
      const body = [item.kinds.includes('exam') ? t('remindersUi.examBody', { days: item.daysBefore }) : '', item.kinds.includes('review') ? t('remindersUi.reviewBody') : '', item.kinds.includes('study') ? t('remindersUi.studyBody', { minutes: settings.dailyGoalMin }) : ''].filter(Boolean).join(' ');
      const content = { title: t('remindersUi.notificationTitle'), body, sound: 'default', data: { owner: REMINDER_OWNER, route } };
      const old = existing.find((n) => n.identifier === item.id);
      if (old && old.content.title === content.title && old.content.body === body && old.content.data?.route === route) continue;
      if (old) await Notifications.cancelScheduledNotificationAsync(old.identifier);
      await Notifications.scheduleNotificationAsync({ identifier: item.id, content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(item.at), channelId: CHANNEL } });
    }
    report({ status: 'ready', count: plan.length, nextAt: plan[0]?.at ?? null, until: prefs.study || prefs.review ? reminderWindowEnd(prefs.time, now) : null, error: null });
  } catch (error) {
    report({ status: 'error', count: 0, nextAt: null, until: null, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export function syncReminders(): Promise<void> {
  const task = queue.catch(() => undefined).then(reconcile);
  queue = task;
  return task;
}

export async function testReminder(): Promise<void> {
  if (!await requestReminderPermission()) throw new Error('Notification permission denied');
  const lang = useSettings.getState().lang ?? deviceLang();
  const t = i18n.getFixedT(lang);
  await Notifications.cancelScheduledNotificationAsync(TEST_ID);
  await Notifications.scheduleNotificationAsync({ identifier: TEST_ID, content: { title: t('remindersUi.notificationTitle'), body: t('remindersUi.testBody'), sound: 'default', data: { owner: REMINDER_OWNER, route: '/' } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL } });
}
