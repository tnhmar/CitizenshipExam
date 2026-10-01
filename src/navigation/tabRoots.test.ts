import { describe, expect, test } from '@jest/globals';
import { needsTabAnchor, returnToTabRoot, tabRootResetAction } from './tabRoots';

describe('tab root recovery', () => {
  test('repairs a glossary-only Learn stack without resetting the tabs navigator', () => {
    const state = { routes: [{ name: 'index' }, { name: 'learn', state: { key: 'learn-stack', routes: [{ name: 'glossary' }] } }, { name: 'review', state: { key: 'review-stack' } }] };
    expect(tabRootResetAction(state, 'learn')).toEqual({ type: 'RESET', target: 'learn-stack', payload: { index: 0, routes: [{ name: 'index' }] } });
    expect(state.routes[1].state?.routes).toEqual([{ name: 'glossary' }]);
  });
  test('repairs a bookmarks-only Review stack and leaves Learn untouched', () => {
    const state = { routes: [{ name: 'learn', state: { key: 'learn-stack' } }, { name: 'review', state: { key: 'review-stack', routes: [{ name: 'bookmarks' }] } }] };
    expect(tabRootResetAction(state, 'review')?.target).toBe('review-stack');
    expect(tabRootResetAction(state, 'review')?.payload.routes).toEqual([{ name: 'index' }]);
    expect(state.routes[0].state?.key).toBe('learn-stack');
  });
  test('also returns a correctly anchored stack to index', () => {
    const state = { routes: [{ name: 'learn', state: { key: 'learn-stack', routes: [{ name: 'index' }, { name: 'glossary' }] } }] };
    expect(tabRootResetAction(state, 'learn')?.payload).toEqual({ index: 0, routes: [{ name: 'index' }] });
  });
  test('handles a tab that has not mounted yet', () => {
    expect(tabRootResetAction({ routes: [{ name: 'learn' }] }, 'learn')).toBeNull();
    expect(tabRootResetAction({ routes: [] }, 'review')).toBeNull();
  });
  test('prevents the default pop-to-first behaviour before resetting and focusing the intended root', () => {
    const calls: string[] = [];
    returnToTabRoot('review', { getState: () => ({ routes: [{ name: 'review', state: { key: 'review-stack' } }] }), dispatch: (action) => { calls.push(`reset:${action.target}`); } }, { preventDefault: () => { calls.push('prevent'); } }, (href) => { calls.push(href); });
    expect(calls).toEqual(['prevent', 'reset:review-stack', '/(tabs)/review']);
  });
  test('still focuses an unmounted tab without dispatching an invalid reset', () => {
    const calls: string[] = [];
    returnToTabRoot('learn', { getState: () => ({ routes: [{ name: 'learn' }] }), dispatch: () => { calls.push('unexpected reset'); } }, { preventDefault: () => { calls.push('prevent'); } }, (href) => { calls.push(href); });
    expect(calls).toEqual(['prevent', '/(tabs)/learn']);
  });
});

describe('cross-tab stack anchors', () => {
  test('anchors direct links to glossary, bookmarks, bookmark practice and lessons', () => {
    for (const href of ['/learn/glossary', '/review/bookmarks', '/review/bookmarks-practice?concept=one', '/learn/lesson/22', '/(tabs)/learn/glossary?termId=146']) expect(needsTabAnchor(href)).toBe(true);
  });
  test('does not change index routes, settings, or exam navigation', () => {
    for (const href of ['/', '/learn', '/review', '/settings', '/exams', '/exams/42', '/exams/summary']) expect(needsTabAnchor(href)).toBe(false);
  });
});
