import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { usePreparationText } from '../i18n/preparation';
import type { DashboardSnapshot } from '../logic/dashboardStats';
import { preparationEstimate } from '../logic/preparation';

export function PreparationHero({
  data,
  now,
  onProgress,
}: {
  data: DashboardSnapshot;
  now: number;
  onProgress: () => void;
}) {
  const text = usePreparationText();
  const { i18n } = useTranslation();
  const model = preparationEstimate(data, now);

  const shownPercent = model.state === 'available' ? model.percent : null;
  const percent =
    shownPercent === null || !Number.isFinite(shownPercent)
      ? null
      : Math.max(0, Math.min(100, shownPercent));

  const value = percent === null ? '—' : `${Math.round(percent)}%`;
  const visibleLabel = i18n.language.startsWith('fr')
    ? 'Votre préparation'
    : 'Your preparation';

  const accessibilityLabel = [
    visibleLabel,
    value,
    model.state === 'available' && model.confidence < 0.5
      ? text.lowConfidence
      : null,
    text.progress,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={text.progress}
        onPress={onProgress}
        style={({ pressed }) => [styles.control, pressed && styles.pressed]}
      >
        <Text style={styles.label}>{visibleLabel}</Text>
        <Text style={styles.percentage}>{value}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  control: {
    width: '100%',
    minHeight: 116,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  percentage: {
    color: '#FFFFFF',
    fontSize: 64,
    lineHeight: 76,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});