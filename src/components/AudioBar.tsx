import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { lessonAudio, useLessonAudio } from '../audio/lessonAudio';
import { trackKey, type LessonTrack } from '../audio/sharedLessonAudio';
import { useSharedAudioText } from '../i18n/sharedAudio';
import type { Lang } from '../types';
import { Panel } from './Panel';
import { SeekBar } from './SeekBar';

const RATES = [1, 1.25, 1.5, 1.75, 2];
const fmt = (seconds: number) => { const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0; return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; };
interface Props { source: number; lessonId: number; lang: Lang; title: string; chapterTitle: string; onTime: (ms: number) => void; follow: boolean; onToggleFollow: () => void; onJump: () => void; }
export function AudioBar({ source, lessonId, lang, title, chapterTitle, onTime, follow, onToggleFollow, onJump }: Props) {
  const { t } = useTranslation(); const text = useSharedAudioText(); const theme = useTheme();
  const session = useLessonAudio(); const [preferredRate, setPreferredRate] = useState(1);
  const track: LessonTrack = { source, lessonId, lang, title, chapterTitle }; const key = trackKey(track);
  const owned = session.track !== null && trackKey(session.track) === key;
  const position = owned ? session.position : 0; const duration = owned ? session.duration : 0;
  const playing = owned && session.phase === 'playing'; const rate = owned ? session.rate : preferredRate;
  useEffect(() => { const timer = setTimeout(() => onTime(Math.round(position * 1000)), 0); return () => clearTimeout(timer); }, [position, key, onTime]);
  const seekBy = (delta: number) => { if (owned) void lessonAudio.seek(position + delta, key); };
  const cycleRate = () => { const index = RATES.findIndex((value) => value >= rate); const next = RATES[(Math.max(0, index) + 1) % RATES.length]; setPreferredRate(next); if (owned) lessonAudio.setRate(next, key); };
  const playLabel = owned && session.phase === 'ended' ? text.replay : playing ? t('learn.pause') : t('learn.play');
  const blue = theme.colors.secondary;
  return <Panel style={styles.card}>
    <View style={styles.controls}>
      <Pressable accessibilityRole='button' accessibilityLabel={t('lessonUi.speed')} onPress={cycleRate} style={styles.speed}><Text variant='titleSmall' style={{ color: blue, fontWeight: '700' }}>{`${rate.toFixed(2)}x`}</Text></Pressable>
      <Pressable accessibilityRole='button' accessibilityLabel={t('lessonUi.back15')} accessibilityState={{ disabled: !owned || duration <= 0 }} disabled={!owned || duration <= 0} onPress={() => seekBy(-15)} style={styles.skip}><Text style={[styles.skipIcon, { color: blue }]}>↺</Text><Text style={[styles.skipLabel, { color: blue }]}>15</Text></Pressable>
      <Pressable accessibilityRole='button' accessibilityLabel={playLabel} onPress={() => { if (playing) lessonAudio.pause(key); else void lessonAudio.play(track, rate); }} style={[styles.play, { backgroundColor: blue }]}><Text style={[styles.playIcon, { color: theme.colors.onSecondary }]}>{playing ? '❚❚' : '▶'}</Text></Pressable>
      <Pressable accessibilityRole='button' accessibilityLabel={t('lessonUi.forward15')} accessibilityState={{ disabled: !owned || duration <= 0 }} disabled={!owned || duration <= 0} onPress={() => seekBy(15)} style={styles.skip}><Text style={[styles.skipIcon, { color: blue }]}>↻</Text><Text style={[styles.skipLabel, { color: blue }]}>15</Text></Pressable>
      <Pressable accessibilityRole='button' accessibilityLabel={t('lessonUi.follow')} accessibilityState={{ selected: follow }} onPress={onToggleFollow} style={[styles.tool, follow && { backgroundColor: theme.colors.primaryContainer }]}><Text style={[styles.toolIcon, { color: blue }]}>⇩</Text></Pressable>
      <Pressable accessibilityRole='button' accessibilityLabel={t('lessonUi.jump')} onPress={onJump} style={styles.tool}><Text style={[styles.toolIcon, { color: blue }]}>◎</Text></Pressable>
    </View>
    <View style={styles.seekRow}><Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{fmt(position)}</Text><SeekBar value={duration > 0 ? position / duration : 0} onSeek={(ratio) => { if (owned) void lessonAudio.seek(ratio * duration, key); }} /><Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{fmt(duration)}</Text></View>
    {owned && session.phase === 'loading' ? <Text variant='bodySmall'>{text.loading}</Text> : null}
    {owned && session.phase === 'error' ? <Text variant='bodySmall' style={{ color: theme.colors.error }}>{text.failed}</Text> : null}
    {!owned && session.phase === 'playing' ? <Text variant='bodySmall'>{text.other}</Text> : null}
    {owned ? <Button compact mode='text' onPress={() => lessonAudio.stop()}>{text.stop}</Button> : null}
  </Panel>;
}
const styles = StyleSheet.create({ card: { gap: 4, paddingVertical: 12, borderRadius: 24 }, controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }, speed: { minWidth: 52, paddingVertical: 8 }, skip: { alignItems: 'center', justifyContent: 'center', width: 44, height: 44 }, skipIcon: { fontSize: 26, lineHeight: 28 }, skipLabel: { fontSize: 10, fontWeight: '700', marginTop: -6 }, play: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }, playIcon: { fontSize: 22 }, tool: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, toolIcon: { fontSize: 22 }, seekRow: { flexDirection: 'row', alignItems: 'center', gap: 10 } });
