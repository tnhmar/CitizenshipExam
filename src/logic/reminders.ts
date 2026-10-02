import { isValidDay } from './date';
import type { SrsCard } from '../types';

export const REMINDER_OWNER = 'citizenship-local-v1';
export const REMINDER_PREFIX = 'citizenship-reminder-';
export const REMINDER_DAYS = 30;
export const TEST_SUFFIX = 'test';
export const TEST_DATE_SUFFIX = 'test-date';
export interface ReminderPrefs { enabled: boolean; study: boolean; review: boolean; exam: boolean; time: string; }
export type ReminderKind = 'study' | 'review' | 'exam';
export interface PlannedReminder { id: string; at: number; kinds: ReminderKind[]; daysBefore?: number; }
export interface RegisteredReminder { id: string; at: number; title: string; route: string | null; kinds: ReminderKind[]; }

export function parseReminderTime(time: string): { hour: number; minute: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

function firstReminder(time: string, now: number): Date | null {
  const clock = parseReminderTime(time);
  if (!clock) return null;
  const date = new Date(now);
  date.setHours(clock.hour, clock.minute, 0, 0);
  if (date.getTime() <= now) date.setDate(date.getDate() + 1);
  return date;
}

export function reminderWindowEnd(time: string, now: number): number | null {
  const date = firstReminder(time, now);
  if (!date) return null;
  date.setDate(date.getDate() + REMINDER_DAYS - 1);
  return date.getTime();
}

export function planReminders(prefs: ReminderPrefs, cards: SrsCard[], examDate: string | null, now: number): PlannedReminder[] {
  const start = firstReminder(prefs.time, now);
  const clock = parseReminderTime(prefs.time);
  if (!prefs.enabled || !start || !clock) return [];
  const out = new Map<number, PlannedReminder>();
  const add = (at: number, kind: ReminderKind, daysBefore?: number) => {
    if (at <= now) return;
    const item = out.get(at) ?? { id: `${REMINDER_PREFIX}${at}`, at, kinds: [] };
    if (!item.kinds.includes(kind)) item.kinds.push(kind);
    if (daysBefore !== undefined) item.daysBefore = daysBefore;
    out.set(at, item);
  };
  for (let i = 0; i < REMINDER_DAYS; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const at = date.getTime();
    if (prefs.study) add(at, 'study');
    if (prefs.review && cards.some((c) => c.due <= at)) add(at, 'review');
  }
  if (prefs.exam && examDate && isValidDay(examDate)) {
    const [year, month, day] = examDate.split('-').map(Number);
    for (const before of [7, 3, 1]) {
      const date = new Date(year, month - 1, day, clock.hour, clock.minute);
      date.setDate(date.getDate() - before);
      add(date.getTime(), 'exam', before);
    }
  }
  return [...out.values()].sort((a, b) => a.at - b.at);
}

export function reminderDestination(data: unknown): '/' | '/learn' | '/review' | '/exams' | null {
  const value = data as { owner?: unknown; route?: unknown } | null;
  if (!value || value.owner !== REMINDER_OWNER) return null;
  const route = value.route;
  return route === '/' || route === '/learn' || route === '/review' || route === '/exams' ? route : null;
}

export function reminderIdTimestamp(id: string): number | null {
  if (!id.startsWith(REMINDER_PREFIX)) return null;
  const suffix = id.slice(REMINDER_PREFIX.length);
  if (!/^[1-9]\d*$/.test(suffix)) return null;
  const at = Number(suffix);
  return Number.isSafeInteger(at) && at <= 8640000000000000 ? at : null;
}

export function upcomingReminders<T extends { at: number }>(items: T[], now: number, limit: number): T[] {
  if (!Number.isFinite(limit) || limit <= 0) return [];
  return items.filter((item) => Number.isFinite(item.at) && item.at > now).sort((a, b) => a.at - b.at).slice(0, Math.floor(limit));
}

export function registeredReminder(request: { identifier: string; content: { title?: string | null; data?: unknown } }): RegisteredReminder | null {
  const route = reminderDestination(request.content.data);
  const at = reminderIdTimestamp(request.identifier);
  if (route === null || at === null) return null;
  const data = request.content.data as { kinds?: unknown };
  const kinds = Array.isArray(data.kinds) ? [...new Set(data.kinds.filter((kind): kind is ReminderKind => kind === 'study' || kind === 'review' || kind === 'exam'))] : [];
  return { id: request.identifier, at, title: request.content.title ?? '', route, kinds };
}
