import { describe, expect, test } from '@jest/globals';
import { daysUntil, isValidDay } from './date';

describe('isValidDay', () => {
  test('accepts real calendar dates only', () => {
    expect(isValidDay('2026-10-01')).toBe(true);
    expect(isValidDay('2026-02-30')).toBe(false);
    expect(isValidDay('2026-1-1')).toBe(false);
    expect(isValidDay('')).toBe(false);
  });
});

describe('daysUntil', () => {
  const now = new Date(2026, 9, 1, 15).getTime();

  test('counts calendar days', () => {
    expect(daysUntil('2026-10-11', now)).toBe(10);
    expect(daysUntil('2026-10-01', now)).toBe(0);
    expect(daysUntil('2026-09-29', now)).toBe(-2);
  });
});
