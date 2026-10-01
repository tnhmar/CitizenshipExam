import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';
import { useSettings } from '../store/settings';

interface Props {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  color?: string;
}

export function ScoreRing({ value, size = 140, stroke = 12, label, color }: Props) {
  const theme = useTheme();
  const reduce = useSettings((s) => s.reduceMotion);
  const target = Math.min(100, Math.max(0, value));
  const [shown, setShown] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce) {
      setShown(target);
      return;
    }
    const v = new Animated.Value(0);
    const id = v.addListener(({ value: x }) => setShown(x));
    Animated.timing(v, { toValue: target, duration: 700, useNativeDriver: false }).start();
    return () => {
      v.removeListener(id);
      v.stopAnimation();
    };
  }, [target, reduce]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  return (
    <View style={{ width: size, height: size }} accessibilityRole='progressbar' accessibilityValue={{ min: 0, max: 100, now: Math.round(target) }}>
      <Svg width={size} height={size}>
        <Circle cx={mid} cy={mid} r={r} stroke={theme.colors.surfaceVariant} strokeWidth={stroke} fill='none' />
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          stroke={color ?? theme.colors.primary}
          strokeWidth={stroke}
          strokeLinecap='round'
          fill='none'
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - shown / 100)}
          rotation={-90}
          origin={`${mid}, ${mid}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text variant='headlineMedium'>{label ?? `${Math.round(target)}%`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
