export const TAB_BAR_BASE_HEIGHT = 68;
export const TAB_BAR_BOTTOM_MARGIN = 8;
export function tabBarGeometry(safeBottom: number) {
  const bottom = Math.max(Number.isFinite(safeBottom) ? Math.max(0, safeBottom) : 0, 8);
  return { bottom, height: TAB_BAR_BASE_HEIGHT + bottom, marginBottom: TAB_BAR_BOTTOM_MARGIN };
}
