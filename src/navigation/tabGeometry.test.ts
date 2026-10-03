import { describe, expect, test } from '@jest/globals';
import { homeBottomPadding } from '../logic/homeLayout';
import { tabBarGeometry } from './tabGeometry';
describe('shared configured tab-bar geometry', () => {
  test('preserves the existing minimum bottom padding and bar height', () => { expect(tabBarGeometry(0)).toEqual({ bottom: 8, height: 76, marginBottom: 8 }); });
  test('includes the safe inset once inside the configured height', () => { expect(tabBarGeometry(24)).toEqual({ bottom: 24, height: 92, marginBottom: 8 }); });
  test('invalid insets cannot produce invalid tab styles', () => { expect(tabBarGeometry(NaN)).toEqual(tabBarGeometry(0)); expect(tabBarGeometry(-1)).toEqual(tabBarGeometry(0)); });
  test('Home clearance uses the same bar height and margin without double-counting the inset', () => { const geometry = tabBarGeometry(24); expect(homeBottomPadding(geometry.height + geometry.marginBottom, 0)).toBe(112); });
});
