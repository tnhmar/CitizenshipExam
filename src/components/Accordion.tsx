import { useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSettings } from '../store/settings';

interface Props {
  title: string;
  subtitle?: string;
  initiallyOpen?: boolean;
  children: ReactNode;
}

export function Accordion({ title, subtitle, initiallyOpen = false, children }: Props) {
  const theme = useTheme();
  const reduce = useSettings((s) => s.reduceMotion);
  const [open, setOpen] = useState(initiallyOpen);
  const [rot] = useState(() => new Animated.Value(initiallyOpen ? 1 : 0));

  const toggle = () => {
    const next = !open;
    setOpen(next);
    Animated.timing(rot, { toValue: next ? 1 : 0, duration: reduce ? 0 : 200, useNativeDriver: true }).start();
  };
  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View style={[styles.box, { borderColor: theme.colors.outlineVariant }]}>
      <Pressable onPress={toggle} accessibilityRole='button' accessibilityState={{ expanded: open }} style={styles.header}>
        <View style={styles.titles}>
          <Text variant='titleMedium'>{title}</Text>
          {subtitle ? <Text variant='bodySmall'>{subtitle}</Text> : null}
        </View>
        <Animated.Text style={[styles.chevron, { color: theme.colors.onSurface, transform: [{ rotate }] }]}>{'›'}</Animated.Text>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  titles: { flex: 1 },
  chevron: { fontSize: 26 },
  body: { padding: 14, paddingTop: 0, gap: 8 },
});
