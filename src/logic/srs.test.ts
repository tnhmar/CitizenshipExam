import { describe, expect, test } from '@jest/globals';
import { DAY_MS, startOfDay } from './progress';
import { dueCards, gradeFrom, isDue, newCard, schedule } from './srs';

const now = new Date(2026, 9, 1, 10, 0, 0).getTime();

describe('schedule', () => {
  test('known answers space out 1, 3, then by ease', () => {
    const c1 = schedule(newCard(1, 'c1', now), 'know', now);
    expect(c1).toMatchObject({ interval: 1, reps: 1 });
    const c2 = schedule(c1, 'know', now);
    expect(c2).toMatchObject({ interval: 3, reps: 2 });
    const c3 = schedule(c2, 'know', now);
    expect(c3.interval).toBe(8);
    expect(c3.due).toBe(startOfDay(now) + 8 * DAY_MS);
  });

  test('a miss resets to one day and counts a lapse', () => {
    const strong = schedule(schedule(schedule(newCard(1, 'c1', now), 'know', now), 'know', now), 'know', now);
    const missed = schedule(strong, 'unknown', now);
    expect(missed).toMatchObject({ interval: 1, reps: 0, lapses: 1 });
    expect(missed.ease).toBeLessThan(strong.ease);
  });

  test('a guess grows slowly', () => {
    const g = schedule(newCard(1, 'c1', now), 'guess', now);
    expect(g.interval).toBe(1);
    const long = { ...g, interval: 10 };
    expect(schedule(long, 'guess', now).interval).toBe(12);
  });
});

describe('grading and due cards', () => {
  test('wrong answers are always unknown', () => {
    expect(gradeFrom(false, 'know')).toBe('unknown');
    expect(gradeFrom(true, 'unknown')).toBe('unknown');
    expect(gradeFrom(true, 'guess')).toBe('guess');
    expect(gradeFrom(true, 'know')).toBe('know');
  });

  test('dueCards returns only due cards, oldest first', () => {
    const a = { ...newCard(1, 'c1', now), due: now - 5 };
    const b = { ...newCard(2, 'c2', now), due: now - 10 };
    const c = { ...newCard(3, 'c3', now), due: now + DAY_MS };
    expect(dueCards([a, b, c], now).map((x) => x.questionId)).toEqual([2, 1]);
    expect(isDue(c, now)).toBe(false);
    expect(isDue(c, now + DAY_MS)).toBe(true);
  });
});
