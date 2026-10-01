import { describe, expect, test } from '@jest/globals';
import { committedPickerValue, dateForPicker, serializePickerValue } from './pickerValues';

const now = new Date(2026, 9, 1, 17, 45).getTime();
describe('native picker values', () => {
  test('opens a saved exam date on the same local calendar day', () => {
    const date = dateForPicker('date', '2026-11-10', now);
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 10, 10, 12]);
    expect(serializePickerValue('date', date)).toBe('2026-11-10');
  });
  test('uses the supplied current date when no valid saved date exists', () => {
    expect(dateForPicker('date', null, now).getTime()).toBe(now);
    expect(dateForPicker('date', '2026-02-30', now).getTime()).toBe(now);
  });
  test('opens the saved 24-hour reminder time with seconds cleared', () => {
    const date = dateForPicker('time', '20:05', now);
    expect([date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()]).toEqual([20, 5, 0, 0]);
    expect(serializePickerValue('time', date)).toBe('20:05');
  });
  test('does not serialize dates through UTC, including near local midnight', () => {
    expect(serializePickerValue('date', new Date(2026, 10, 10, 23, 59))).toBe('2026-11-10');
    expect(serializePickerValue('time', new Date(2026, 10, 10, 0, 5))).toBe('00:05');
  });
  test('commits confirmed selections only', () => {
    const date = new Date(2026, 10, 10, 20, 5);
    expect(committedPickerValue('date', 'set', date)).toBe('2026-11-10');
    expect(committedPickerValue('time', 'set', date)).toBe('20:05');
    expect(committedPickerValue('date', 'dismissed', date)).toBeNull();
    expect(committedPickerValue('time', 'neutralButtonPressed', date)).toBeNull();
    expect(committedPickerValue('date', 'set')).toBeNull();
  });
  test('rejects invalid native dates', () => {
    expect(serializePickerValue('date', new Date(NaN))).toBeNull();
    expect(committedPickerValue('time', 'set', new Date(NaN))).toBeNull();
  });
});
