import { describe, expect, test } from '@jest/globals';
import { HOME_STATUS_ITEM, HOME_STATUS_ROW, statCardSizing } from './homeStatusLayout';
describe('Home status-card sizing policy', () => {
  test('the default preserves existing fill sizing outside Home', () => { expect(statCardSizing()).toEqual({ flex: 1 }); });
  test('intrinsic cards explicitly disable vertical growth and shrink', () => { expect(statCardSizing(false)).toEqual({ flexGrow: 0, flexShrink: 0, alignSelf: 'stretch' }); });
  test('the status row wraps and does not stretch card heights', () => { expect(HOME_STATUS_ROW.flexDirection).toBe('row'); expect(HOME_STATUS_ROW.flexWrap).toBe('wrap'); expect(HOME_STATUS_ROW.alignItems).toBe('flex-start'); });
  test('status columns size horizontally without a vertical flex shorthand', () => { expect(HOME_STATUS_ITEM.flexBasis).toBe('46%'); expect(HOME_STATUS_ITEM.alignSelf).toBe('flex-start'); expect(HOME_STATUS_ITEM).not.toHaveProperty('flex'); expect(HOME_STATUS_ITEM).not.toHaveProperty('height'); });
});
