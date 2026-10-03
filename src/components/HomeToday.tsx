import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { useHomeTodayText } from '../i18n/homeToday';
import { useStudyDayText } from '../i18n/studyDays';
import { homeTodayLayout } from '../logic/homeLayout';
import { homeExamDate } from '../logic/homePresentation';
import type { Streak } from '../logic/progress';
import { studyDayStatus } from '../logic/studyDays';
import { HomeIcon, type HomeIconKind } from './HomeIcon';
import { Panel } from './Panel';

export function HomeToday({ due, examDate, streak, now, legacySaved, onReview, onDate }: { due: number; examDate: string | null; streak: Streak; now: number; legacySaved: boolean; onReview: () => void; onDate: () => void }) {
  const text = useHomeTodayText(); const studyText = useStudyDayText(); const theme = useTheme(); const { fontScale } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState(0); const [visible, setVisible] = useState(false);
  const layout = homeTodayLayout(rowWidth, fontScale); const date = homeExamDate(examDate, now); const status = studyDayStatus(streak, now);
  const dateValue = date.kind === 'unset' ? '—' : date.kind === 'today' ? text.today : date.kind === 'past' ? text.past : text.days.replace('{{days}}', String(date.days ?? 0));
  const dateHint = date.kind === 'unset' ? text.setDate : date.kind === 'past' ? text.updateDate : null;
  const streakHint = text.states[status.state];
  const tile = (kind: HomeIconKind, label: string, value: string, hint: string | null, onPress: () => void, accessibilityLabel?: string) => <Pressable accessibilityRole='button' accessibilityLabel={accessibilityLabel ?? [label, value, hint].filter(Boolean).join('. ')} onPress={onPress} style={({ pressed }) => [styles.tile, { width: layout.columnWidth, backgroundColor: theme.colors.surfaceVariant }, pressed && styles.pressed]}>
    <View style={styles.tileHeading}><HomeIcon kind={kind} color={theme.colors.primary} /><Text variant='labelMedium' style={styles.label}>{label}</Text></View>
    <Text variant='titleLarge' style={styles.value}>{value}</Text>
    {hint ? <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{hint}</Text> : null}
  </Pressable>;
  return <>
    <Panel style={styles.panel}>
      <Text variant='titleMedium'>{text.title}</Text>
      <View style={styles.row} onLayout={(event) => { const width = event.nativeEvent.layout.width; setRowWidth((previous) => Math.abs(previous - width) > 0.5 ? width : previous); }}>
        {tile('review', text.review, String(due), null, onReview)}
        {tile('calendar', text.date, dateValue, dateHint, onDate)}
        {tile('streak', text.streak, String(status.days), streakHint, () => setVisible(true), [studyText.title, String(status.days), studyText.states[status.state].replace('{{days}}', String(status.days)), studyText.explain].join('. '))}
      </View>
    </Panel>
    <Portal><Dialog visible={visible} onDismiss={() => setVisible(false)}>
      <Dialog.Title>{studyText.title}</Dialog.Title>
      <Dialog.ScrollArea><ScrollView style={{ maxHeight: 360 }} contentContainerStyle={styles.explanation}><Text>{studyText.definition}</Text><Text>{studyText.excluded}</Text><Text>{studyText.calendar}</Text>{legacySaved && streak.best === 0 ? <Text>{studyText.migration}</Text> : null}</ScrollView></Dialog.ScrollArea>
      <Dialog.Actions><Button onPress={() => setVisible(false)}>{studyText.close}</Button></Dialog.Actions>
    </Dialog></Portal>
  </>;
}
const styles = StyleSheet.create({ panel: { padding: 12, gap: 10 }, row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 10 }, tile: { padding: 10, borderRadius: 12, gap: 5, flexGrow: 0, flexShrink: 0, minHeight: 44 }, tileHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 }, label: { flex: 1 }, value: { fontWeight: '600' }, pressed: { opacity: 0.75 }, explanation: { padding: 16, gap: 12 } });
