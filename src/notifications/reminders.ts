import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { getBundle } from '../content/loader';
import i18n, { deviceLang } from '../i18n';
import { reminderCopy } from '../i18n/reminderCopy';
import { contextualReminderTask, reminderVariant, type ReminderTask } from '../logic/contextualReminders';
import { assessmentIds } from '../logic/completion';
import { conceptPool, reviewWorkload } from '../logic/learningStats';
import { parseReminderTime, registeredReminder, reminderDestination, upcomingReminders, REMINDER_OWNER, REMINDER_PREFIX, TEST_DATE_SUFFIX, TEST_SUFFIX, type PlannedReminder, type RegisteredReminder, type ReminderKind } from '../logic/reminders';
import { DAILY_REMINDER_ID, hybridReminderPlan } from '../logic/hybridReminders';
import { useProgress } from '../store/progress';
import { useReminderSettings } from '../store/reminders';
import { useSettings } from '../store/settings';

const CHANNEL = 'study-reminders';
const TEST_ID = `${REMINDER_PREFIX}${TEST_SUFFIX}`;
const TEST_DATE_ID = `${REMINDER_PREFIX}${TEST_DATE_SUFFIX}`;
const VERSION = 'contextual-v2';
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(action: () => Promise<T>): Promise<T> {
  const task = queue.catch(() => undefined).then(action);
  queue = task;
  return task;
}
if (Platform.OS !== 'web') Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
const allowed = (p: Notifications.NotificationPermissionsStatus) => p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
const message = (error: unknown): string => error instanceof Error ? error.message : String(error);
const fill = (text: string, values: Record<string, string | number | undefined>) => text.replace(/{{(\w+)}}/g, (_match, key: string) => String(values[key] ?? ''));
function selectTask(kinds: ReminderKind[], at: number, daysBefore?: number): ReminderTask | null {
  const settings = useSettings.getState(); const prefs = useReminderSettings.getState().prefs;
  if (!prefs.enabled || !settings.onboarded) return null;
  const study = prefs.study && kinds.includes('study'); const review = prefs.review && kinds.includes('review'); const exam = prefs.exam && kinds.includes('exam');
  if (!study && !review && !exam) return null;
  const bundle = getBundle(settings.lang ?? deviceLang()); const progress = useProgress.getState(); const active = progress.active;
  if ((study || exam) && active && active.finishedAt === null && active.startedAt + active.limitMs > at && bundle.exams.some((e) => e.id === active.examId)) return { kind: 'exam', route: `/exams/${active.examId}` };
  if (exam && daysBefore !== undefined) return { kind: 'exam', route: '/exams', daysBefore };
  const due = reviewWorkload(bundle, Object.values(progress.cards), at).due;
  if (review && due > 0) return { kind: 'review', route: '/review', dueCount: due };
  if (!study) return null;
  const task = contextualReminderTask({ bundle: { ...bundle, chapters: bundle.chapters.filter((c) => assessmentIds(bundle, `chapter:${c.id}`).length > 0) }, progress: { ...progress, active: null, cards: {} }, now: at, examDate: null });
  if (task.kind === 'lesson' || task.kind === 'chapter') return task;
  return bundle.exams.some((e) => e.kind === 'mock') ? { kind: 'study', route: '/exams' } : null;
}
export function resolveReminderDestination(data: unknown): string | null {
  const legacy = reminderDestination(data); if (!legacy) return null;
  const value = data as { version?: unknown; kinds?: unknown; intent?: unknown };
  if (value.version !== VERSION) return legacy;
  const settings = useSettings.getState(); const prefs = useReminderSettings.getState().prefs;
  if (!prefs.enabled || !settings.onboarded) return '/';
  const active = useProgress.getState().active;
  if (active && active.finishedAt === null && active.startedAt + active.limitMs > Date.now() && getBundle(active.lang).exams.some((e) => e.id === active.examId)) return `/exams/${active.examId}`;
  if (value.intent === 'countdown' && prefs.exam) return '/exams';
  if (value.intent === 'daily') return selectTask(prefs.review ? ['study', 'review'] : ['study'], Date.now())?.route ?? '/';
  const kinds = Array.isArray(value.kinds) ? value.kinds.filter((kind): kind is ReminderKind => kind === 'study' || kind === 'review' || kind === 'exam') : [];
  return selectTask(kinds, Date.now())?.route ?? '/';
}
async function channel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const lang = useSettings.getState().lang ?? deviceLang();
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: i18n.getFixedT(lang)('remindersUi.title'), importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' });
}
export async function requestReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await channel(); let permission = await Notifications.getPermissionsAsync();
  if (!allowed(permission) && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  if (!allowed(permission)) useReminderSettings.getState().setReport({ status: 'blocked', count: 0, nextAt: null, until: null, error: null });
  return allowed(permission);
}
export interface ReminderDiagnostics {
  notificationsAllowed: boolean | null;
  channelEnabled: boolean | null;
  exactAlarmDeclared: boolean;
  exactAlarmAccess: 'unverified' | 'notApplicable';
}
export async function getReminderDiagnostics(): Promise<ReminderDiagnostics> {
  const androidAlarms = Platform.OS === 'android' && Number(Platform.Version) >= 31;
  const permissions = Constants.expoConfig?.android?.permissions ?? [];
  const diagnostics: ReminderDiagnostics = {
    notificationsAllowed: null, channelEnabled: null,
    exactAlarmDeclared: permissions.some((permission) => permission === 'android.permission.SCHEDULE_EXACT_ALARM' || permission === 'SCHEDULE_EXACT_ALARM'),
    exactAlarmAccess: androidAlarms ? 'unverified' : 'notApplicable',
  };
  if (Platform.OS === 'web') return diagnostics;
  diagnostics.notificationsAllowed = allowed(await Notifications.getPermissionsAsync());
  if (Platform.OS === 'android' && Number(Platform.Version) >= 26) {
    const value = await Notifications.getNotificationChannelAsync(CHANNEL);
    diagnostics.channelEnabled = value === null ? null : value.importance !== Notifications.AndroidImportance.NONE;
  }
  // Expo's notification permission response does not expose AlarmManager.canScheduleExactAlarms().
  return diagnostics;
}
export async function openReminderAlarmSettings(): Promise<void> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 31) { await Linking.openSettings(); return; }
  const packageName = Constants.expoConfig?.android?.package;
  try {
    await Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM', packageName ? [{ key: 'android.provider.extra.APP_PACKAGE', value: packageName }] : []);
  } catch { await Linking.openSettings(); }
}
function dailyTrigger(time: string): Notifications.DailyTriggerInput {
  const clock = parseReminderTime(time);
  if (!clock) throw new Error('Invalid daily reminder time');
  return { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...clock, channelId: CHANNEL };
}
export async function readScheduledReminders(): Promise<RegisteredReminder[]> {
  if (Platform.OS === 'web') return [];
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  const rows: RegisteredReminder[] = [];
  for (const request of requests) {
    if (request.identifier === DAILY_REMINDER_ID && reminderDestination(request.content.data) !== null) {
      const data = request.content.data as { dailyTime?: unknown; kinds?: unknown };
      if (typeof data.dailyTime !== 'string' || !parseReminderTime(data.dailyTime)) continue;
      const at = await Notifications.getNextTriggerDateAsync(dailyTrigger(data.dailyTime));
      if (at === null) throw new Error('Could not resolve the next recurring reminder');
      const kinds: ReminderKind[] = Array.isArray(data.kinds) && data.kinds.includes('review') ? ['study', 'review'] : ['study'];
      rows.push({ id: request.identifier, at, title: request.content.title ?? '', route: '/learn', kinds });
    } else {
      const row = registeredReminder(request);
      if (row) rows.push(row);
    }
  }
  return upcomingReminders(rows, Date.now(), rows.length);
}
async function scheduleDatedReminder(identifier: string, content: Notifications.NotificationContentInput, at: number): Promise<string> {
  if (!Number.isFinite(at) || at <= Date.now()) throw new Error('Reminder time must be in the future');
  const trigger = { type: Notifications.SchedulableTriggerInputTypes.DATE as const, date: new Date(at), channelId: CHANNEL };
  const nextAt = await Notifications.getNextTriggerDateAsync(trigger);
  if (nextAt === null || Math.abs(nextAt - at) > 1000) throw new Error('The device could not resolve the requested reminder time');
  return Notifications.scheduleNotificationAsync({ identifier, content, trigger });
}
async function reconcile(): Promise<void> {
  const report = useReminderSettings.getState().setReport;
  if (Platform.OS === 'web') { report({ status: 'unsupported', count: 0, nextAt: null, until: null, error: null }); return; }
  try {
    const settings = useSettings.getState(); const prefs = useReminderSettings.getState().prefs;
    const lang = settings.lang ?? deviceLang();
    const existing = (await Notifications.getAllScheduledNotificationsAsync()).filter((n) => n.identifier.startsWith(REMINDER_PREFIX));
    if (!prefs.enabled || !settings.onboarded || !allowed(await Notifications.getPermissionsAsync())) {
      for (const n of existing) await Notifications.cancelScheduledNotificationAsync(n.identifier);
      report({ status: !prefs.enabled || !settings.onboarded ? 'off' : 'blocked', count: 0, nextAt: null, until: null, error: null, cancelled: existing.length, created: 0, failed: 0, upcoming: [], verifiedAt: Date.now() });
      return;
    }
    if (!parseReminderTime(prefs.time)) throw new Error('Invalid reminder time');
    await channel(); const now = Date.now(); const bundle = getBundle(lang); const pool = conceptPool(bundle);
    const cards = Object.values(useProgress.getState().cards).filter((c) => pool.has(c.conceptId));
    const plan = hybridReminderPlan(prefs, cards, settings.examDate, now);
    const notices: { item: PlannedReminder; task: ReminderTask }[] = [];
    for (const item of plan.dated) { const task = selectTask(item.kinds, item.at, item.daysBefore); if (task) notices.push({ item, task }); }
    const ids = new Set(notices.map((n) => n.item.id));
    if (plan.daily) ids.add(DAILY_REMINDER_ID);
    let created = 0; let cancelled = 0; const failures = new Set<string>(); const errors: string[] = [];
    for (const n of existing) {
      if (n.identifier === TEST_ID || n.identifier === TEST_DATE_ID || ids.has(n.identifier)) continue;
      try { await Notifications.cancelScheduledNotificationAsync(n.identifier); cancelled += 1; }
      catch (error) { errors.push(`Cancel ${n.identifier}: ${message(error)}`); }
    }
    const copy = reminderCopy(lang);
    if (plan.daily) {
      const t = i18n.getFixedT(lang);
      const title = t('remindersUi.dailyTitle');
      const body = t(prefs.review ? 'remindersUi.dailyReviewBody' : 'remindersUi.dailyBody', { minutes: settings.dailyGoalMin });
      const data = { owner: REMINDER_OWNER, route: '/learn', version: VERSION, intent: 'daily', kinds: plan.daily.kinds, dailyTime: prefs.time };
      const previous = existing.find((n) => n.identifier === DAILY_REMINDER_ID);
      const unchanged = previous && previous.content.title === title && previous.content.body === body && previous.content.data?.version === VERSION && previous.content.data?.intent === 'daily' && previous.content.data?.dailyTime === prefs.time && JSON.stringify(previous.content.data?.kinds) === JSON.stringify(plan.daily.kinds);
      if (!unchanged) {
        try {
          const trigger = dailyTrigger(prefs.time);
          const nextAt = await Notifications.getNextTriggerDateAsync(trigger);
          if (nextAt === null || nextAt <= Date.now()) throw new Error('Daily trigger has no future occurrence');
          await Notifications.scheduleNotificationAsync({ identifier: DAILY_REMINDER_ID, content: { title, body, sound: 'default', data }, trigger });
          created += 1;
        } catch (error) { failures.add(DAILY_REMINDER_ID); errors.push(`Daily study: ${message(error)}`); }
      }
    }
    for (const { item, task } of notices) {
      const index = reminderVariant(Math.floor(item.at / 86400000), task.kind); const countdown = task.daysBefore !== undefined;
      const title = (countdown ? copy.examSoonTitles[index] : copy.taskTitles[task.kind][index]) ?? copy.title;
      const template = (countdown ? copy.examSoonBodies[index] : copy.taskBodies[task.kind][index]) ?? '';
      const body = fill(template, { days: task.daysBefore, chapter: task.chapterTitle, lesson: task.lessonTitle, minutes: settings.dailyGoalMin });
      const route = task.route.startsWith('/exams') ? '/exams' : task.kind === 'review' ? '/review' : '/learn';
      const data = { owner: REMINDER_OWNER, route, version: VERSION, kinds: item.kinds, intent: countdown ? 'countdown' : task.kind, scheduledAt: item.at };
      const old = existing.find((n) => n.identifier === item.id);
      if (old && old.content.title === title && old.content.body === body && old.content.data?.route === route && old.content.data?.version === VERSION && old.content.data?.scheduledAt === item.at && JSON.stringify(old.content.data?.kinds) === JSON.stringify(item.kinds) && old.content.data?.intent === data.intent) continue;
      try {
        await scheduleDatedReminder(item.id, { title, body, sound: 'default', data }, item.at);
        created += 1;
      } catch (error) { failures.add(item.id); errors.push(`Schedule ${item.id}: ${message(error)}`); }
    }
    const accepted = await readScheduledReminders();
    const verifiedAt = Date.now();
    const planned = notices.filter((n) => n.item.at > verifiedAt);
    const acceptedIds = new Set(accepted.map((n) => n.id));
    for (const { item } of planned) if (!acceptedIds.has(item.id) && !failures.has(item.id)) { failures.add(item.id); errors.push(`Not registered on device: ${item.id}`); }
    if (plan.daily && !acceptedIds.has(DAILY_REMINDER_ID) && !failures.has(DAILY_REMINDER_ID)) { failures.add(DAILY_REMINDER_ID); errors.push('Daily study reminder is not registered'); }
    const registered = accepted.filter((n) => ids.has(n.id));
    const stale = accepted.filter((n) => !ids.has(n.id));
    if (stale.length) errors.push(`${stale.length} obsolete reminder(s) remain registered`);
    report({
      status: errors.length ? 'error' : 'ready', count: registered.length, nextAt: registered[0]?.at ?? null,
      until: plan.daily ? null : registered.find((n) => n.kinds.includes('review'))?.at ?? null,
      error: errors.length ? errors.slice(0, 5).join('\n') : null,
      upcoming: upcomingReminders(registered, verifiedAt, 3), created, cancelled, failed: failures.size, planned: planned.length + (plan.daily ? 1 : 0), verifiedAt,
    });
  } catch (error) {
    report({ status: 'error', count: 0, nextAt: null, until: null, error: message(error) });
    throw error;
  }
}
export function syncReminders(): Promise<void> { return exclusive(reconcile); }
export function scheduledTestReminder(): Promise<number> {
  return exclusive(async () => {
    if (!await requestReminderPermission()) throw new Error('Notification permission denied');
    const lang = useSettings.getState().lang ?? deviceLang(); const t = i18n.getFixedT(lang);
    const at = Date.now() + 60000;
    await scheduleDatedReminder(TEST_DATE_ID, { title: t('remindersUi.notificationTitle'), body: t('remindersUi.testDateBody'), sound: 'default', data: { owner: REMINDER_OWNER, route: '/', scheduledAt: at } }, at);
    const registered = await Notifications.getAllScheduledNotificationsAsync();
    if (!registered.some((n) => n.identifier === TEST_DATE_ID)) throw new Error('Scheduled test was not registered on the device');
    return at;
  });
}
export function testReminder(): Promise<void> {
  return exclusive(async () => {
    if (!await requestReminderPermission()) throw new Error('Notification permission denied');
    const lang = useSettings.getState().lang ?? deviceLang(); const t = i18n.getFixedT(lang);
    await Notifications.scheduleNotificationAsync({ identifier: TEST_ID, content: { title: t('remindersUi.notificationTitle'), body: t('remindersUi.testBody'), sound: 'default', data: { owner: REMINDER_OWNER, route: '/' } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL } });
  });
}
