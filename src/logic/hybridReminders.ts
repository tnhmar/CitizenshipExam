import type { SrsCard } from '../types';
import { parseReminderTime, planReminders, REMINDER_PREFIX, type PlannedReminder, type ReminderKind, type ReminderPrefs } from './reminders';

export const DAILY_REMINDER_ID = `${REMINDER_PREFIX}daily-study`;
export interface HybridPlan {
  daily: { id: string; hour: number; minute: number; kinds: ReminderKind[] } | null;
  dated: PlannedReminder[];
}
export function hybridReminderPlan(prefs: ReminderPrefs, cards: SrsCard[], examDate: string | null, now: number): HybridPlan {
  const clock = parseReminderTime(prefs.time);
  if (!prefs.enabled || !clock) return { daily: null, dated: [] };
  const daily: HybridPlan['daily'] = prefs.study ? {
    id: DAILY_REMINDER_ID, ...clock, kinds: prefs.review ? ['study', 'review'] : ['study'],
  } : null;
  const finiteCards = cards.filter((card) => Number.isFinite(card.due));
  const upcoming = planReminders({ ...prefs, study: false, review: !daily && prefs.review }, finiteCards, examDate, now);
  let nextReview = upcoming.find((item) => item.kinds.includes('review'));
  if (!daily && prefs.review && !nextReview && finiteCards.length) {
    const firstDue = Math.min(...finiteCards.map((card) => card.due));
    const date = new Date(Math.max(now, firstDue));
    date.setHours(clock.hour, clock.minute, 0, 0);
    if (date.getTime() <= now || date.getTime() < firstDue) date.setDate(date.getDate() + 1);
    const at = date.getTime();
    if (Number.isFinite(at)) nextReview = { id: `${REMINDER_PREFIX}${at}`, at, kinds: ['review'] };
  }
  const merged = new Map<number, PlannedReminder>();
  for (const item of upcoming.filter((entry) => entry.kinds.includes('exam'))) {
    merged.set(item.at, { ...item, kinds: ['exam'] });
  }
  if (nextReview) {
    const existing = merged.get(nextReview.at);
    merged.set(nextReview.at, existing ? { ...existing, kinds: ['review', 'exam'] } : { ...nextReview, kinds: ['review'] });
  }
  return { daily, dated: [...merged.values()].sort((a, b) => a.at - b.at) };
}
