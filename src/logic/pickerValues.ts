import { isValidDay } from './date';
import { parseReminderTime } from './reminders';

export type PickerMode = 'date' | 'time';
const two = (value: number) => String(value).padStart(2, '0');

export function dateForPicker(mode: PickerMode, value: string | null, now: number): Date {
  const date = new Date(now);
  if (mode === 'date' && value && isValidDay(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }
  if (mode === 'time' && value) {
    const time = parseReminderTime(value);
    if (time) date.setHours(time.hour, time.minute, 0, 0);
  }
  return date;
}

export function serializePickerValue(mode: PickerMode, date: Date): string | null {
  if (!Number.isFinite(date.getTime())) return null;
  return mode === 'date' ? `${String(date.getFullYear()).padStart(4, '0')}-${two(date.getMonth() + 1)}-${two(date.getDate())}` : `${two(date.getHours())}:${two(date.getMinutes())}`;
}

export function committedPickerValue(mode: PickerMode, eventType: string, date?: Date): string | null {
  return eventType === 'set' && date ? serializePickerValue(mode, date) : null;
}
