import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { useHomeTodayText } from '../i18n/homeToday';
import { useStudyDayText } from '../i18n/studyDays';
import { homeExamDate } from '../logic/homePresentation';
import { preparationTodayLayout, preparationTodayRows } from '../logic/preparationLayout';
import type { Streak } from '../logic/progress';
import { studyDayStatus } from '../logic/studyDays';
import { HomeIcon, type HomeIconKind } from './HomeIcon';

interface TodayTile { key: HomeIconKind; label: string; value: string; hint: string | null; onPress: () => void; accessibilityLabel: string; }
export function HomeToday({ due, examDate, streak, now, legacySaved, onReview, onDate }: { due: number; examDate: string | null; streak: Streak; now: number; legacySaved: boolean; onReview: () => void; onDate: () => void }) {
  const text = useHomeTodayText(); const studyText = useStudyDayText(); const theme = useTheme(); const { fontScale } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState(0); const [visible, setVisible] = useState(false);
  const layout = preparationTodayLayout(rowWidth, fontScale); const date = homeExamDate(examDate, now); const status = studyDayStatus(streak, now);
  const dateValue = date.kind === 'upcoming' ? String(date.days ?? 0) : date.kind === 'today' ? '0' : '—';
  const dateHint = date.kind === 'unset' ? text.setDate : date.kind === 'today' ? text.today : date.kind === 'past' ? text.past : text.days.replace('{{days}}', String(date.days ?? 0));
  const items: TodayTile[] = [
    { key: 'review', label: text.review, value: String(due), hint: null, onPress: onReview, accessibilityLabel: `${text.review}. ${due}.` },
    { key: 'calendar', label: text.date, value: dateValue, hint: dateHint, onPress: onDate, accessibilityLabel: [text.date, dateValue, dateHint].join('. ') },
    { key: 'streak', label: text.streak, value: String(status.days), hint: text.states[status.state], onPress: () => setVisible(true), accessibilityLabel: [studyText.title, String(status.days), studyText.states[status.state].replace('{{days}}', String(status.days)), studyText.explain].join('. ') },
  ];
  const rows = preparationTodayRows(items, layout.columns);
  return <>
    <View style={styles.section}>
      <Text variant='titleMedium'>{text.title}</Text>
      <View style={styles.rows} onLayout={(event) => { const width = event.nativeEvent.layout.width; setRowWidth((previous) => Math.abs(previous - width) > 0.5 ? width : previous); }}>
        {rows.map((row, index) => <View key={index} style={styles.row}>
          {row.map((item) => <Pressable key={item.key} accessibilityRole='button' accessibilityLabel={item.accessibilityLabel} onPress={item.onPress} style={({ pressed }) => [styles.tile, { width: layout.tileWidth, minHeight: layout.minHeight, backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }, pressed && styles.pressed]}>
            <View style={[styles.labelSlot, { minHeight: layout.labelHeight }]}><HomeIcon kind={item.key} color={theme.colors.primary} /><Text variant='labelMedium' style={styles.label}>{item.label}</Text></View>
            <View style={[styles.valueSlot, { minHeight: layout.valueHeight }]}><Text variant='titleLarge' style={styles.value}>{item.value}</Text></View>
            <View style={[styles.hintSlot, { minHeight: layout.hintHeight }]}>{item.hint ? <Text variant='bodySmall' style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>{item.hint}</Text> : null}</View>
          </Pressable>)}
        </View>)}
      </View>
    </View>
    <Portal><Dialog visible={visible} onDismiss={() => setVisible(false)}>
      <Dialog.Title>{studyText.title}</Dialog.Title>
      <Dialog.ScrollArea><ScrollView style={{ maxHeight: 360 }} contentContainerStyle={styles.explanation}><Text>{studyText.definition}</Text><Text>{studyText.excluded}</Text><Text>{studyText.calendar}</Text>{legacySaved && streak.best === 0 ? <Text>{studyText.migration}</Text> : null}</ScrollView></Dialog.ScrollArea>
      <Dialog.Actions><Button onPress={() => setVisible(false)}>{studyText.close}</Button></Dialog.Actions>
    </Dialog></Portal>
  </>;
}
const styles = StyleSheet.create({ section: { gap: 10 }, rows: { gap: 10 }, row: { flexDirection: 'row', alignItems: 'stretch', gap: 10 }, tile: { padding: 10, borderRadius: 16, borderWidth: 1, gap: 5, flexGrow: 0, flexShrink: 0, alignSelf: 'stretch' }, labelSlot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, label: { flexShrink: 1, textAlign: 'center' }, valueSlot: { alignItems: 'center', justifyContent: 'center' }, value: { fontWeight: '600', textAlign: 'center' }, hintSlot: { flexGrow: 1, justifyContent: 'center' }, hint: { textAlign: 'center' }, pressed: { opacity: 0.75 }, explanation: { padding: 16, gap: 12 } });
