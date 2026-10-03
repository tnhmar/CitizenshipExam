import { describe, expect, test } from '@jest/globals';
import { PREPARATION_HEADER_RED, preparationNavigationColors, preparationTodayLayout, preparationTodayRows } from './preparationLayout';
describe('preparation-first R1 layout and surfaces', () => {
  test('normal phone width produces three equal tile widths', () => { const layout = preparationTodayLayout(288, 1); expect(layout.columns).toBe(3); expect(layout.tileWidth).toBeCloseTo((288 - 20) / 3); expect(layout.minHeight).toBe(136); });
  test('large text changes the entire grid to two columns', () => { expect(preparationTodayLayout(320, 1.6).columns).toBe(2); });
  test('very narrow or unknown width uses one safe column', () => { expect(preparationTodayLayout(140, 1).columns).toBe(1); expect(preparationTodayLayout(0, NaN).tileWidth).toBe('100%'); });
  test('row grouping preserves order and does not widen the final tile', () => { const items = ['review', 'date', 'study']; expect(preparationTodayRows(items, 2)).toEqual([['review', 'date'], ['study']]); expect(items).toEqual(['review', 'date', 'study']); });
  test('navigation background/card/text colors match the Paper surfaces', () => { expect(preparationNavigationColors({ primary: 'red', background: 'dark', surface: 'surface', onSurface: 'text', outlineVariant: 'border', error: 'error' })).toEqual({ primary: 'red', background: 'dark', card: 'surface', text: 'text', border: 'border', notification: 'error' }); });
  test('header branding is explicit and invalid font scales are safe', () => { expect(PREPARATION_HEADER_RED).toBe('#C22020'); expect(preparationTodayLayout(288, -1)).toEqual(preparationTodayLayout(288, 1)); });
});
