import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useHomeRecommendationText } from '../i18n/homeRecommendation';
import type { DashboardSnapshot } from '../logic/dashboardStats';
import { homeRecommendationModel } from '../logic/homeRecommendation';
import type { ContentBundle } from '../types';
import { Panel } from './Panel';

export function HomeRecommendation({ data, bundle, onOpen }: { data: Pick<DashboardSnapshot, 'nextAction' | 'nextAlternative'>; bundle: ContentBundle; onOpen: (route: string) => void }) {
  const text = useHomeRecommendationText(); const theme = useTheme();
  const model = homeRecommendationModel(data.nextAction, data.nextAlternative, bundle);
  const primary = model.primary; const secondary = model.secondary;
  const label = text.labels[primary.label];
  const primaryAccessibility = [label, primary.context, primary.subject].filter(Boolean).join('. ');
  return <Panel style={styles.card}>
    <Text variant='labelLarge' style={{ color: theme.colors.onSurfaceVariant }}>{text.title}</Text>
    {primary.context ? <Text variant='labelSmall' style={{ color: theme.colors.onSurfaceVariant }}>{primary.context}</Text> : null}
    {primary.subject ? <Text variant='titleMedium' style={styles.subject}>{primary.subject}</Text> : null}
    <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.reasons[primary.reason]}</Text>
    <Pressable accessibilityRole='button' accessibilityLabel={primaryAccessibility} onPress={() => onOpen(primary.route)} style={({ pressed }) => [styles.primary, { backgroundColor: theme.colors.primary }, pressed && styles.pressed]}><Text variant='labelLarge' style={[styles.actionLabel, { color: theme.colors.onPrimary }]}>{label}</Text></Pressable>
    {secondary ? <View style={styles.alternative}>
      {model.showExamWarning ? <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{text.examWarning}</Text> : null}
      <Pressable accessibilityRole='button' accessibilityLabel={[text.labels[secondary.label], secondary.subject].filter(Boolean).join('. ')} onPress={() => onOpen(secondary.route)} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text variant='labelLarge' style={[styles.actionLabel, { color: theme.colors.primary }]}>{text.labels[secondary.label]}</Text></Pressable>
      {secondary.subject && secondary.subject !== primary.subject ? <Text variant='labelSmall' style={styles.preview}>{secondary.subject}</Text> : null}
    </View> : null}
  </Panel>;
}
const styles = StyleSheet.create({ card: { gap: 6 }, subject: { fontWeight: '600' }, primary: { minHeight: 44, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, alternative: { gap: 2 }, secondary: { minHeight: 44, paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }, actionLabel: { textAlign: 'center', fontWeight: '600' }, pressed: { opacity: 0.75 }, preview: { textAlign: 'center' } });
