export const PREPARATION_HEADER_RED = '#C22020';
const scaleOf = (value: number): number => Number.isFinite(value) && value > 0 ? Math.max(1, value) : 1;
export function preparationTodayLayout(width: number, fontScale: number): { columns: 1 | 2 | 3; tileWidth: number | '100%'; minHeight: number; labelHeight: number; valueHeight: number; hintHeight: number } {
  const available = Number.isFinite(width) ? Math.max(0, width) : 0; const scale = scaleOf(fontScale); const minimum = 80 * scale;
  const columns = available >= minimum * 3 + 20 ? 3 : available >= minimum * 2 + 10 ? 2 : 1;
  return { columns, tileWidth: columns === 1 && available === 0 ? '100%' : (available - (columns - 1) * 10) / columns, minHeight: 136 * scale, labelHeight: 20 * scale, valueHeight: 40 * scale, hintHeight: 32 * scale };
}
export function preparationTodayRows<T>(items: T[], columns: number): T[][] {
  const count = Number.isSafeInteger(columns) && columns >= 1 && columns <= 3 ? columns : 1;
  return Array.from({ length: Math.ceil(items.length / count) }, (_, row) => items.slice(row * count, (row + 1) * count));
}
export function preparationNavigationColors(colors: { primary: string; background: string; surface: string; onSurface: string; outlineVariant: string; error: string }) {
  return { primary: colors.primary, background: colors.background, card: colors.surface, text: colors.onSurface, border: colors.outlineVariant, notification: colors.error };
}
