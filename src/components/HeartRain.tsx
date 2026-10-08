import { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#D87891', '#EAA7B6', '#CE819C', '#F0C9CB'];
export function HeartRain() {
  const hearts = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    id: i, progress: new Animated.Value(0), left: `${4 + (i * 37) % 88}%` as `${number}%`,
    size: 16 + (i % 4) * 5, delay: (i % 8) * 240,
  })), []);
  useEffect(() => {
    const runs = hearts.map((heart) => Animated.sequence([
      Animated.delay(heart.delay),
      Animated.timing(heart.progress, { toValue: 1, duration: 3200 + (heart.id % 3) * 300, easing: Easing.linear, useNativeDriver: true }),
    ]));
    const animation = Animated.parallel(runs);
    animation.start();
    return () => { animation.stop(); hearts.forEach((heart) => heart.progress.stopAnimation()); };
  }, [hearts]);
  return <View pointerEvents='none' accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' style={styles.rain}>
    {hearts.map((heart) => <Animated.Text key={heart.id} style={[
      styles.heart, { left: heart.left, fontSize: heart.size, color: COLORS[heart.id % COLORS.length],
        opacity: heart.progress.interpolate({ inputRange: [0, 0.12, 0.8, 1], outputRange: [0, 0.9, 0.9, 0] }),
        transform: [
          { translateY: heart.progress.interpolate({ inputRange: [0, 1], outputRange: [-36, 200] }) },
          { translateX: heart.progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, heart.id % 2 ? 14 : -14, 0] }) },
          { rotate: heart.progress.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] }) },
        ],
      },
    ]}>♥</Animated.Text>)}
  </View>;
}
const styles = StyleSheet.create({ rain: { height: 180, overflow: 'hidden' }, heart: { position: 'absolute', top: 0 } });
