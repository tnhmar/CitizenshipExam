import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import Svg, { Path, Rect } from 'react-native-svg';

export type TabIconName = 'home' | 'learn' | 'exams' | 'progress' | 'review';

interface Props { name: TabIconName; focused: boolean; }

export function TabIcon({ name, focused }: Props) {
  const theme = useTheme();
  const color = focused ? theme.colors.primary : theme.colors.onSurfaceVariant;
  return (
    <View accessible={false} pointerEvents='none' style={[styles.slot, { backgroundColor: focused ? theme.colors.primaryContainer : 'transparent' }]}>
      <Svg width={28} height={28} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth={1.9} strokeLinecap='round' strokeLinejoin='round'>
        {name === 'home' ? <Path d='M3 10.5 12 3l9 7.5M5 9v12h5v-7h4v7h5V9' /> : null}
        {name === 'learn' ? <Path d='M12 6v15M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3V4Z' /> : null}
        {name === 'exams' ? <><Rect x={5} y={4} width={14} height={17} rx={2} /><Path d='M9 4V2h6v2M9 9h6M9 13h6M9 17h4' /></> : null}
        {name === 'progress' ? <Path d='M4 19V11M12 19V4M20 19v-6M2 22h20' /> : null}
        {name === 'review' ? <Path d='M20 7v5h-5M4 17v-5h5M19.5 12A7.5 7.5 0 0 0 6.4 6.7L4 9M4.5 12a7.5 7.5 0 0 0 13.1 5.3L20 15' /> : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { width: 48, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
