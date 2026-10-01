export type RootTab = 'learn' | 'review';
export const TAB_ROOTS = { learn: '/(tabs)/learn', review: '/(tabs)/review' } as const;
export type RootHref = typeof TAB_ROOTS[RootTab];

export interface TabSnapshot {
  routes: ReadonlyArray<{ name: string; state?: { key?: string } }>;
}
export interface TabRootResetAction {
  type: 'RESET';
  target: string;
  payload: { index: number; routes: { name: string }[] };
}
interface NavigatorLike { getState: () => TabSnapshot; dispatch: (action: TabRootResetAction) => void; }
interface TabPressEvent { preventDefault: () => void; }

export function tabRootResetAction(state: TabSnapshot, tab: RootTab): TabRootResetAction | null {
  const key = state.routes.find((route) => route.name === tab)?.state?.key;
  return key ? { type: 'RESET', target: key, payload: { index: 0, routes: [{ name: 'index' }] } } : null;
}

export function returnToTabRoot(tab: RootTab, navigation: NavigatorLike, event: TabPressEvent, openRoot: (href: RootHref) => void): void {
  event.preventDefault();
  const action = tabRootResetAction(navigation.getState(), tab);
  if (action) navigation.dispatch(action);
  openRoot(TAB_ROOTS[tab]);
}

export function needsTabAnchor(href: string): boolean {
  const path = href.split(/[?#]/)[0].replace(/^\/\(tabs\)/, '');
  return /^\/(?:learn|review)\/.+/.test(path);
}
