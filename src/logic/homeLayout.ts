const positive = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 0;
const scaleOf = (value: number): number => Number.isFinite(value) && value > 0 ? Math.max(1, value) : 1;
export function homeOverviewLayout(width: number, fontScale: number): { columns: 1 | 2; columnWidth: number | '100%'; plotHeight: number } {
  const available = positive(width); const columns = available >= 280 * scaleOf(fontScale) + 12 ? 2 : 1;
  const columnWidth = columns === 2 ? (available - 12) / 2 : '100%';
  return { columns, columnWidth, plotHeight: typeof columnWidth === 'number' ? Math.max(48, Math.min(84, columnWidth * 92 / 300)) : 72 };
}
export function homeTodayLayout(width: number, fontScale: number): { columns: 1 | 2 | 3; columnWidth: number | '100%' } {
  const available = positive(width); const minimum = 100 * scaleOf(fontScale);
  const columns = available >= minimum * 3 + 20 ? 3 : available >= minimum * 2 + 10 ? 2 : 1;
  return { columns, columnWidth: columns === 1 ? '100%' : (available - (columns - 1) * 10) / columns };
}
export function homeBottomPadding(tabBarHeight: number, safeBottom: number): number { return positive(tabBarHeight) + positive(safeBottom) + 12; }
