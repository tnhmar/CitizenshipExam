import { describe, expect, test } from '@jest/globals';
import type { SrsCard } from '../types';
import { planReminders, parseReminderTime, reminderDestination, REMINDER_OWNER, type ReminderPrefs } from './reminders';

const now = new Date(2026, 9, 1, 12).getTime();
const prefs: ReminderPrefs = { enabled: true, study: true, review: true, exam: true, time: '20:00' };
const card = (due: number): SrsCard => ({ questionId: 1, conceptId: 'one', interval: 1, ease: 2.5, reps: 0, lapses: 0, due, lastReviewed: 0 });

describe('local reminder plan', () => {
  test('validates a 24-hour local time', () => {
    expect(parseReminderTime('20:05')).toEqual({ hour: 20, minute: 5 });
    for (const time of ['24:00', '20:60', '9:00', 'bad']) expect(parseReminderTime(time)).toBeNull();
  });
  test('disabled reminders and invalid times create no notifications', () => {
    expect(planReminders({ ...prefs, enabled: false }, [card(now)], '2026-10-08', now)).toEqual([]);
    expect(planReminders({ ...prefs, time: 'bad' }, [], null, now)).toEqual([]);
  });
  test('coalesces study, review and exam reminders at the same local time', () => {
    const plan = planReminders(prefs, [card(now)], '2026-10-08', now);
    expect(plan).toHaveLength(30);
    expect(new Set(plan.map((p) => p.at)).size).toBe(plan.length);
    expect(plan[0].kinds).toEqual(['study', 'review', 'exam']);
    expect(plan[0].daysBefore).toBe(7);
    expect(new Date(plan[0].at).getHours()).toBe(20);
  });
  test('does not schedule review-only alerts without due cards', () => {
    expect(planReminders({ ...prefs, study: false, exam: false }, [], null, now)).toEqual([]);
    const due = new Date(2026, 9, 3, 8).getTime();
    const plan = planReminders({ ...prefs, study: false, exam: false }, [card(due)], null, now);
    expect(new Date(plan[0].at).getDate()).toBe(3);
  });
  test('skips times already passed and ignores past or invalid exam dates', () => {
    const later = new Date(2026, 9, 1, 21).getTime();
    const plan = planReminders({ ...prefs, review: false }, [], '2026-09-30', later);
    expect(plan).toHaveLength(30);
    expect(new Date(plan[0].at).getDate()).toBe(2);
    expect(plan.every((p) => p.at > later)).toBe(true);
    expect(planReminders({ ...prefs, study: false, review: false }, [], '2026-02-30', now)).toEqual([]);
  });
  test('schedules distant exam reminders without filling an unbounded daily queue', () => {
    const plan = planReminders(prefs, [], '2026-12-01', now);
    expect(plan).toHaveLength(33);
    expect(plan.filter((p) => p.kinds.includes('exam')).map((p) => p.daysBefore)).toEqual([7, 3, 1]);
  });
  test('accepts only owned notifications and known internal destinations', () => {
    expect(reminderDestination({ owner: REMINDER_OWNER, route: '/review' })).toBe('/review');
    expect(reminderDestination({ owner: REMINDER_OWNER, route: 'https://example.com' })).toBeNull();
    expect(reminderDestination({ route: '/review' })).toBeNull();
    expect(reminderDestination(null)).toBeNull();
  });
});
