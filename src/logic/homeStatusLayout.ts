export const HOME_STATUS_ROW = { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 10 } as const;
export const HOME_STATUS_ITEM = { flexBasis: '46%', flexGrow: 1, flexShrink: 1, minWidth: 130, alignSelf: 'flex-start' } as const;
export function statCardSizing(fill = true) {
  return fill ? { flex: 1 } as const : { flexGrow: 0, flexShrink: 0, alignSelf: 'stretch' } as const;
}
