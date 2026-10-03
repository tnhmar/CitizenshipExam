import { describe, expect, test } from '@jest/globals';
import { homeBottomPadding, homeOverviewLayout, homeTodayLayout } from './homeLayout';
describe('balanced Home responsive layout policy', () => {
  test('unknown width starts in a single content-width column', () => {
    expect(homeOverviewLayout(0, 1)).toMatchObject({ columns: 1, columnWidth: '100%' });
    expect(homeTodayLayout(0, 1)).toEqual({ columns: 1, columnWidth: '100%' });
  });
  test('overview columns use the measured content width and exact gap', () => {
    expect(homeOverviewLayout(320, 1)).toMatchObject({ columns: 2, columnWidth: 154 });
  });
  test('larger text stacks charts instead of squeezing the labels', () => {
    expect(homeOverviewLayout(320, 1.6).columns).toBe(1);
  });
  test('today adapts between three, two and one intrinsic columns', () => {
    expect(homeTodayLayout(340, 1).columns).toBe(3);
    expect(homeTodayLayout(340, 1.6)).toEqual({ columns: 2, columnWidth: 165 });
    expect(homeTodayLayout(180, 1)).toEqual({ columns: 1, columnWidth: '100%' });
  });
  test('invalid measurements use safe single-column fallbacks', () => {
    expect(homeOverviewLayout(NaN, NaN).columns).toBe(1);
    expect(homeTodayLayout(-1, -1).columns).toBe(1);
  });
  test('bottom clearance includes measured tab height and safe inset without a huge fixed spacer', () => {
    expect(homeBottomPadding(80, 20)).toBe(112);
    expect(homeBottomPadding(NaN, -1)).toBe(12);
  });
});
