import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getBundle } from '../content/loader';
import i18n, { deviceLang } from '../i18n';
import { reminderCopy } from '../i18n/reminderCopy';
import { contextualReminderTask, reminderVariant, type ReminderTask } from '../logic/contextualReminders';
import { assessmentIds } from '../logic/completion';
import { conceptPool, reviewWorkload } from '../logic/learningStats';
import { planReminders, parseReminderTime, reminderDestination, reminderWindowEnd, REMINDER_OWNER, REMINDER_PREFIX, type PlannedReminder, type ReminderKind } from '../logic/reminders';
import { useProgress } from '../store/progress';
import { useReminderSettings } from '../store/reminders';
import { useSettings } from '../store/settings';

const CHANNEL = 'study-reminders'; const TEST_ID = `${REMINDER_PREFIX}test`; const VERSION = 'contextual-v2';
let queue: Promise<void> = Promise.resolve();
if (Platform.OS !== 'web') Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
const allowed = (p: Notifications.NotificationPermissionsStatus) => p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
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
async function reconcile(): Promise<void> {
  const report = useReminderSettings.getState().setReport;
  if (Platform.OS === 'web') { report({ status: 'unsupported', count: 0, nextAt: null, until: null, error: null }); return; }
  try {
    const settings = useSettings.getState(); const prefs = useReminderSettings.getState().prefs;
    const lang = settings.lang ?? deviceLang(); const existing = (await Notifications.getAllScheduledNotificationsAsync()).filter((n) => n.identifier.startsWith(REMINDER_PREFIX));
    if (!prefs.enabled || !settings.onboarded) { for (const n of existing) await Notifications.cancelScheduledNotificationAsync(n.identifier); report({ status: 'off', count: 0, nextAt: null, until: null, error: null }); return; }
    if (!allowed(await Notifications.getPermissionsAsync())) { for (const n of existing) await Notifications.cancelScheduledNotificationAsync(n.identifier); report({ status: 'blocked', count: 0, nextAt: null, until: null, error: null }); return; }
    if (!parseReminderTime(prefs.time)) throw new Error('Invalid reminder time');
    await channel(); const now = Date.now(); const bundle = getBundle(lang); const pool = conceptPool(bundle);
    const cards = Object.values(useProgress.getState().cards).filter((c) => pool.has(c.conceptId));
    const notices: { item: PlannedReminder; task: ReminderTask }[] = [];
    for (const item of planReminders(prefs, cards, settings.examDate, now)) { const task = selectTask(item.kinds, item.at, item.daysBefore); if (task) notices.push({ item, task }); }
    const ids = new Set(notices.map((n) => n.item.id));
    for (const n of existing) if (n.identifier !== TEST_ID && !ids.has(n.identifier)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    const copy = reminderCopy(lang);
    for (const { item, task } of notices) {
      const index = reminderVariant(Math.floor(item.at / 86400000), task.kind); const countdown = task.daysBefore !== undefined;
      const title = (countdown ? copy.examSoonTitles[index] : copy.taskTitles[task.kind][index]) ?? copy.title;
      const template = (countdown ? copy.examSoonBodies[index] : copy.taskBodies[task.kind][index]) ?? '';
      const body = fill(template, { days: task.daysBefore, chapter: task.chapterTitle, lesson: task.lessonTitle, minutes: settings.dailyGoalMin });
      const route = task.route.startsWith('/exams') ? '/exams' : task.kind === 'review' ? '/review' : '/learn';
      const data = { owner: REMINDER_OWNER, route, version: VERSION, kinds: item.kinds, intent: countdown ? 'countdown' : task.kind };
      const content = { title, body, sound: 'default', data };
      const old = existing.find((n) => n.identifier === item.id);
      if (old && old.content.title === title && old.content.body === body && old.content.data?.route === route && old.content.data?.version === VERSION && JSON.stringify(old.content.data?.kinds) === JSON.stringify(item.kinds) && old.content.data?.intent === data.intent) continue;
      if (old) await Notifications.cancelScheduledNotificationAsync(old.identifier);
      await Notifications.scheduleNotificationAsync({ identifier: item.id, content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(item.at), channelId: CHANNEL } });
    }
    report({ status: 'ready', count: notices.length, nextAt: notices[0]?.item.at ?? null, until: prefs.study || prefs.review ? reminderWindowEnd(prefs.time, now) : null, error: null });
  } catch (error) { report({ status: 'error', count: 0, nextAt: null, until: null, error: error instanceof Error ? error.message : String(error) }); throw error; }
}
export function syncReminders(): Promise<void> { const task = queue.catch(() => undefined).then(reconcile); queue = task; return task; }
export async function testReminder(): Promise<void> {
  if (!await requestReminderPermission()) throw new Error('Notification permission denied');
  const lang = useSettings.getState().lang ?? deviceLang(); const t = i18n.getFixedT(lang);
  await Notifications.cancelScheduledNotificationAsync(TEST_ID);
  await Notifications.scheduleNotificationAsync({ identifier: TEST_ID, content: { title: t('remindersUi.notificationTitle'), body: t('remindersUi.testBody'), sound: 'default', data: { owner: REMINDER_OWNER, route: '/' } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL } });
}
