import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { tints } from '../theme';

export type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Panel({ children, onPress, tone = 'default', style, accessibilityLabel }: Props) {
  const theme = useTheme();
  const solid = theme.dark ? tints.dark : tints.light;
  const background = {
    default: theme.colors.surface,
    primary: theme.colors.primary,
    success: solid.success,
    warning: solid.warning,
    danger: solid.danger,
  }[tone];
  const look = [styles.panel, { backgroundColor: background, borderColor: tone === 'default' ? theme.colors.outlineVariant : background }, style];

  if (!onPress) return <View style={look}>{children}</View>;
  return (
    <Pressable accessibilityRole='button' accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [look, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    elevation: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
