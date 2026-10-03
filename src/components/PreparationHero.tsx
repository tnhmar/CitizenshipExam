import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';
import { usePreparationText } from '../i18n/preparation';
import type { DashboardSnapshot } from '../logic/dashboardStats';
import { preparationEstimate } from '../logic/preparation';

const SIZE = 124;
const VIEWBOX = 120;
const MAPLE_LEAF_PATH =
  'M60 4 L68 26 L87 13 L82 38 L107 33 L90 52 L116 61 L90 70 L101 94 L78 84 L75 116 L60 95 L45 116 L42 84 L19 94 L30 70 L4 61 L30 52 L13 33 L38 38 L33 13 L52 26 Z';

export function PreparationHero({ data, now, onProgress }: { data: DashboardSnapshot; now: number; onProgress: () => void }) {
  const text = usePreparationText();
  const { i18n } = useTranslation();
  const model = preparationEstimate(data, now);
  const shownPercent = model.state === 'available' ? model.percent : null;
  const percent = shownPercent === null || !Number.isFinite(shownPercent) ? 0 : Math.max(0, Math.min(100, shownPercent));
  const value = shownPercent === null ? '—' : `${Math.round(percent)}%`;
  const fillHeight = (percent / 100) * VIEWBOX;
  const accessibilityLabel = [text.title, value, model.state === 'available' && model.confidence < 0.5 ? text.lowConfidence : null, text.progress].filter(Boolean).join('. ');
  return <View style={styles.wrap}>
    <Pressable accessibilityRole='button' accessibilityLabel={accessibilityLabel} accessibilityHint={text.progress} onPress={onProgress} style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} accessible={false} importantForAccessibility='no-hide-descendants'>
        <Defs><ClipPath id='preparation-maple-leaf'><Path d={MAPLE_LEAF_PATH} /></ClipPath></Defs>
        <Path d={MAPLE_LEAF_PATH} fill='rgba(255,255,255,0.12)' stroke='rgba(255,255,255,0.94)' strokeWidth={3} strokeLinejoin='round' />
        {shownPercent !== null ? <Rect x={0} y={VIEWBOX - fillHeight} width={VIEWBOX} height={fillHeight} fill='#FFFFFF' clipPath='url(#preparation-maple-leaf)' /> : null}
        <Path d={MAPLE_LEAF_PATH} fill='transparent' stroke='rgba(255,255,255,0.94)' strokeWidth={3} strokeLinejoin='round' />
      </Svg>
      <Text accessible={false} importantForAccessibility='no' style={[styles.value, { color: percent >= 48 ? '#C92020' : '#FFFFFF' }]}>{value}</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 6, paddingBottom: 10 },
  control: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', borderRadius: 70 },
  value: { position: 'absolute', fontSize: 30, lineHeight: 36, fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
