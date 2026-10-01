import { DAY_MS, startOfDay } from './progress';

export function isValidDay(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

export function daysUntil(day: string, now: number): number {
  const [y, m, d] = day.split('-').map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - startOfDay(now)) / DAY_MS);
}
