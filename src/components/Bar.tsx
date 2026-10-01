import { View } from 'react-native';
import { useTheme } from 'react-native-paper';

interface Props {
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
}

export function Bar({ value, color, trackColor, height = 8 }: Props) {
  const theme = useTheme();
  const pct = Math.min(1, Math.max(0, value));
  return (
    <View
      accessibilityRole='progressbar'
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={{ height, borderRadius: height / 2, backgroundColor: trackColor ?? theme.colors.surfaceVariant, overflow: 'hidden' }}
    >
      <View style={{ width: `${pct * 100}%` as `${number}%`, height, borderRadius: height / 2, backgroundColor: color ?? theme.colors.primary }} />
    </View>
  );
}
