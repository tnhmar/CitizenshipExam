import { describe, expect, test } from '@jest/globals';
import type { SrsCard } from '../types';
import { DAILY_REMINDER_ID, hybridReminderPlan } from './hybridReminders';
import type { ReminderPrefs } from './reminders';
const now = new Date(2026, 9, 1, 12).getTime();
const prefs: ReminderPrefs = { enabled: true, study: true, review: true, exam: true, time: '20:00' };
const card = (due: number): SrsCard => ({ questionId: 1, conceptId: 'one', interval: 1, ease: 2.5, reps: 0, lapses: 0, due, lastReviewed: 0 });
describe('hybrid reminder plan', () => {
  test('creates a stable recurring daily reminder instead of 30 dated study notices', () => {
    const plan = hybridReminderPlan(prefs, [], null, now);
    expect(plan.daily).toEqual({ id: DAILY_REMINDER_ID, hour: 20, minute: 0, kinds: ['study', 'review'] });
    expect(plan.dated).toEqual([]);
  });
  test('combines study and review intent in the daily notification', () => {
    expect(hybridReminderPlan(prefs, [card(now)], null, now).dated).toEqual([]);
    expect(hybridReminderPlan({ ...prefs, review: false }, [], null, now).daily?.kinds).toEqual(['study']);
  });
  test('review-only mode maintains just the next due reminder', () => {
    const plan = hybridReminderPlan({ ...prefs, study: false, exam: false }, [card(now)], null, now);
    expect(plan.daily).toBeNull(); expect(plan.dated).toHaveLength(1);
    expect(new Date(plan.dated[0].at).getHours()).toBe(20);
  });
  test('a review due after the selected time waits for the following local day', () => {
    const due = new Date(2026, 9, 3, 21).getTime();
    const plan = hybridReminderPlan({ ...prefs, study: false, exam: false }, [card(due)], null, now);
    expect(new Date(plan.dated[0].at).getDate()).toBe(4);
  });
  test('review dates beyond the old rolling window still get one future notice', () => {
    const due = new Date(2026, 11, 1, 8).getTime();
    const plan = hybridReminderPlan({ ...prefs, study: false, exam: false }, [card(due)], null, now);
    expect(plan.dated).toHaveLength(1); expect(new Date(plan.dated[0].at).getMonth()).toBe(11);
  });
  test('does not schedule review-only reminders without eligible cards', () => {
    expect(hybridReminderPlan({ ...prefs, study: false, exam: false }, [], null, now).dated).toEqual([]);
    expect(hybridReminderPlan({ ...prefs, study: false, exam: false }, [card(NaN)], null, now).dated).toEqual([]);
  });
  test('retains 7, 3 and 1 day exam milestones alongside the recurring reminder', () => {
    const plan = hybridReminderPlan(prefs, [], '2026-10-08', now);
    expect(plan.daily).not.toBeNull();
    expect(plan.dated.map((entry) => entry.daysBefore)).toEqual([7, 3, 1]);
  });
  test('coalesces an exam milestone and the next review-only notice', () => {
    const plan = hybridReminderPlan({ ...prefs, study: false }, [card(now)], '2026-10-08', now);
    expect(plan.dated).toHaveLength(3); expect(plan.dated[0].kinds).toEqual(['review', 'exam']);
  });
  test('disabled categories, invalid times and past exams produce no queue', () => {
    expect(hybridReminderPlan({ ...prefs, enabled: false }, [card(now)], '2026-10-08', now)).toEqual({ daily: null, dated: [] });
    expect(hybridReminderPlan({ ...prefs, time: 'bad' }, [], null, now).daily).toBeNull();
    expect(hybridReminderPlan({ ...prefs, study: false, review: false }, [], '2026-09-30', now).dated).toEqual([]);
  });
});
