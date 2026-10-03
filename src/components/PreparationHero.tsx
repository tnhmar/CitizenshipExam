import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { usePreparationText } from '../i18n/preparation';
import type { DashboardSnapshot } from '../logic/dashboardStats';
import { preparationEstimate } from '../logic/preparation';

export function PreparationHero({ data, now, onProgress }: { data: DashboardSnapshot; now: number; onProgress: () => void }) {
  const text = usePreparationText();
  const { i18n } = useTranslation();
  const model = preparationEstimate(data, now);
  const percent = model.state === 'available' ? model.percent : null;
  const value = percent === null ? '—' : `${Math.round(percent)}%`;
  const label = [text.title, value, model.state === 'available' && model.confidence < 0.5 ? text.lowConfidence : null, text.progress].filter(Boolean).join('. ');
  return <View style={styles.wrap}>
    <Pressable accessibilityRole='button' accessibilityLabel={label} accessibilityHint={text.progress} onPress={onProgress} style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
      <Text accessible={false} importantForAccessibility='no' style={styles.leaf}>🍁</Text>
      <Text accessible={false} importantForAccessibility='no' style={styles.value}>{value}</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 6, paddingBottom: 10 },
  control: { minWidth: 132, minHeight: 132, alignItems: 'center', justifyContent: 'center', borderRadius: 66 },
  leaf: { color: '#FFFFFF', fontSize: 104, lineHeight: 116, opacity: 0.94 },
  value: { position: 'absolute', color: '#C92020', fontSize: 30, lineHeight: 36, fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
