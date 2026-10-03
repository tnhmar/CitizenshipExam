import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useStudyDayText } from '../i18n/studyDays';
import type { Streak } from '../logic/progress';
import { studyDayStatus } from '../logic/studyDays';
import { StatCard } from './StatCard';

export function StudyStreakCard({ streak, now, legacySaved }: { streak: Streak; now: number; legacySaved: boolean }) {
  const text = useStudyDayText(); const [visible, setVisible] = useState(false);
  const status = studyDayStatus(streak, now);
  const message = text.states[status.state].replace('{{days}}', String(status.days));
  return <>
    <View style={{ gap: 6 }}>
      <StatCard fill={false} icon='🔥' value={String(status.days)} label={text.title} tone={status.state === 'doneToday' ? 'warning' : 'default'} onPress={() => setVisible(true)} />
      <Text variant='bodySmall' accessibilityLiveRegion='polite'>{message}</Text>
      <Button compact mode='text' onPress={() => setVisible(true)}>{text.explain}</Button>
    </View>
    <Portal><Dialog visible={visible} onDismiss={() => setVisible(false)}>
      <Dialog.Title>{text.title}</Dialog.Title>
      <Dialog.ScrollArea><ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ padding: 16, gap: 12 }}><Text>{text.definition}</Text><Text>{text.excluded}</Text><Text>{text.calendar}</Text>{legacySaved && streak.best === 0 ? <Text>{text.migration}</Text> : null}</ScrollView></Dialog.ScrollArea>
      <Dialog.Actions><Button onPress={() => setVisible(false)}>{text.close}</Button></Dialog.Actions>
    </Dialog></Portal>
  </>;
}
