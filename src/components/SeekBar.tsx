import { useState } from 'react';
import { View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { useTheme } from 'react-native-paper';

interface Props {
  value: number;
  onSeek: (ratio: number) => void;
}

export function SeekBar({ value, onSeek }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(1);
  const [drag, setDrag] = useState<number | null>(null);
  const ratioOf = (e: GestureResponderEvent) => Math.min(1, Math.max(0, e.nativeEvent.locationX / width));
  const shown = drag ?? Math.min(1, Math.max(0, value));
  const percent = `${shown * 100}%` as `${number}%`;

  return (
    <View
      accessibilityRole='adjustable'
      accessibilityValue={{ min: 0, max: 100, now: Math.round(shown * 100) }}
      onLayout={(e: LayoutChangeEvent) => setWidth(Math.max(1, e.nativeEvent.layout.width))}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => setDrag(ratioOf(e))}
      onResponderMove={(e) => setDrag(ratioOf(e))}
      onResponderRelease={(e) => {
        const r = ratioOf(e);
        setDrag(null);
        onSeek(r);
      }}
      onResponderTerminate={() => setDrag(null)}
      style={{ flex: 1, height: 32, justifyContent: 'center' }}
    >
      <View pointerEvents='none' style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceVariant }}>
        <View style={{ width: percent, height: 6, borderRadius: 3, backgroundColor: theme.colors.secondary }} />
      </View>
      <View pointerEvents='none' style={{ position: 'absolute', left: percent, marginLeft: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: theme.colors.secondary }} />
    </View>
  );
}
