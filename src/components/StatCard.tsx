import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Panel, type Tone } from './Panel';

interface Props {
  icon: string;
  value: string;
  label: string;
  tone?: Tone;
  onPress?: () => void;
}

export function StatCard({ icon, value, label, tone = 'default', onPress }: Props) {
  const theme = useTheme();
  const color = tone === 'primary' ? theme.colors.onPrimary : undefined;
  return (
    <Panel tone={tone} onPress={onPress} style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <Text variant='headlineSmall' style={[styles.value, { color }]}>
        {value}
      </Text>
      <Text variant='labelMedium' style={[styles.label, { color: color ?? theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', gap: 2, padding: 12 },
  icon: { fontSize: 22 },
  value: { fontWeight: '700' },
  label: { textAlign: 'center' },
});
