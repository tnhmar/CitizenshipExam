import * as Haptics from 'expo-haptics';
import { useSettings } from '../store/settings';

export async function feedbackHaptic(kind: 'selection' | 'toggle' | 'success' | 'error'): Promise<void> {
  if (!useSettings.getState().haptics) return;
  if (kind === 'selection') return Haptics.selectionAsync();
  if (kind === 'toggle') return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  if (kind === 'success') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
