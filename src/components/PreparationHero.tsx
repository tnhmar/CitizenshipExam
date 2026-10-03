import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { usePreparationText } from '../i18n/preparation';
import type { DashboardSnapshot } from '../logic/dashboardStats';
import { MIN_PREPARATION_MOCKS, MIN_PREPARATION_PRACTICE_CONCEPTS, preparationEstimate } from '../logic/preparation';

export function PreparationHero({ data, now, onProgress }: { data: DashboardSnapshot; now: number; onProgress: () => void }) {
  const text = usePreparationText(); const { i18n } = useTranslation(); const [visible, setVisible] = useState(false); const model = preparationEstimate(data, now);
  const format = (value: number | null) => value === null ? text.notAssessed : `${Math.round(value)}%`; const title = model.state === 'courseOnly' ? text.courseOnlyTitle : text.title;
  const displayed = model.state === 'available' ? model.percent : model.state === 'courseOnly' ? model.coursePercent : null; const value = displayed === null ? '—' : `${Math.round(displayed)}%`; const hint = text.hints[model.state];
  const gate = text.gate.replace('{{concepts}}', String(MIN_PREPARATION_PRACTICE_CONCEPTS)).replace('{{mocks}}', String(MIN_PREPARATION_MOCKS)); const confidence = `${Math.round(model.confidence * 100)}%`;
  return <>
    <Pressable accessibilityRole='button' accessibilityLabel={[title, value, hint, text.explain].join('. ')} onPress={() => setVisible(true)} style={({ pressed }) => [styles.hero, pressed && styles.pressed]}>
      <Text variant='titleMedium' style={styles.white}>{title}</Text><Text style={styles.value}>{value}</Text><Text variant='bodySmall' style={styles.white}>{hint}</Text>
      {model.state === 'available' ? <Text variant='bodySmall' style={styles.white}>{text.confidence.replace('{{value}}', confidence).replace('{{concepts}}', String(model.practiceConcepts))}</Text> : null}
      {model.state === 'available' && model.confidence < 0.5 ? <Text variant='bodySmall' style={styles.warning}>{text.lowConfidence}</Text> : null}
      <Text variant='labelMedium' style={[styles.white, styles.link]}>{text.explain}</Text>
    </Pressable>
    <Portal><Dialog visible={visible} onDismiss={() => setVisible(false)}><Dialog.Title>{title}</Dialog.Title><Dialog.ScrollArea><ScrollView style={{ maxHeight: 400 }} contentContainerStyle={styles.explanation}>
      <Text>{text.method}</Text><Text>{text.weights[model.phase]}</Text><Text>{text.courseRule}</Text><Text>{text.coverageRule}</Text><Text>{text.capRule}</Text>
      <View style={styles.metrics}><Text variant='titleSmall'>{text.course} · {Math.round(model.weights.course * 100)}%: {format(model.coursePercent)}</Text><Text>{text.lessons}: {data.completion.lessonsCompleted}/{data.completion.lessonsTotal} · {format(model.lessonPercent)}</Text><Text>{text.chapters}: {data.completion.chaptersCompleted}/{data.completion.chaptersTotal} · {format(model.chapterPercent)}</Text><Text variant='titleSmall'>{text.practice} · {Math.round(model.weights.practice * 100)}%: {format(model.practicePercent)}</Text><Text>{text.accuracy}: {format(model.practiceAccuracyPercent)} · {text.coverage}: {format(model.coveragePercent)} ({model.practiceConcepts}/{model.assessableConcepts} {text.concepts})</Text><Text variant='titleSmall'>{text.mocks} · {Math.round(model.weights.mocks * 100)}%: {format(model.mockPercent)}</Text><Text>{model.mockCount} {text.attempts}</Text>{model.latestMockAt !== null ? <Text>{text.latest}: {new Date(model.latestMockAt).toLocaleDateString(i18n.language)}</Text> : null}<Text>{text.confidence.replace('{{value}}', confidence).replace('{{concepts}}', String(model.practiceConcepts))}</Text></View>
      <Text>{gate}</Text><Text>{text.missing}</Text><Text>{text.window}</Text><Text>{text.excluded}</Text>
    </ScrollView></Dialog.ScrollArea><Dialog.Actions><Button onPress={() => setVisible(false)}>{text.close}</Button><Button onPress={() => { setVisible(false); onProgress(); }}>{text.progress}</Button></Dialog.Actions></Dialog></Portal>
  </>;
}
const styles = StyleSheet.create({ hero: { gap: 4, paddingTop: 8, paddingBottom: 2, minHeight: 44 }, white: { color: '#FFFFFF' }, warning: { color: '#FFF3BF' }, value: { color: '#FFFFFF', fontSize: 42, fontWeight: '700' }, link: { textDecorationLine: 'underline', paddingTop: 4 }, pressed: { opacity: 0.8 }, explanation: { padding: 16, gap: 12 }, metrics: { gap: 6 } });
