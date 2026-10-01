import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Panel } from './Panel';
import { SeekBar } from './SeekBar';

const RATES = [1, 1.25, 1.5, 1.75, 2];
const fmt = (s: number) => {
  const total = Math.max(0, Math.floor(s || 0));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

interface Props { source: number; onTime: (ms: number) => void; follow: boolean; onToggleFollow: () => void; onJump: () => void; }

export function AudioBar({ source, onTime, follow, onToggleFollow, onJump }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const [rate, setRate] = useState(1);
  useEffect(() => { onTime(Math.round(status.currentTime * 1000)); }, [status.currentTime, onTime]);
  const seekBy = (delta: number) => { const end = status.duration || 0; void player.seekTo(Math.max(0, Math.min(end, status.currentTime + delta))); };
  const cycleRate = () => { const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length]; setRate(next); player.setPlaybackRate(next); };
  const ratio = status.duration > 0 ? status.currentTime / status.duration : 0;
  const blue = theme.colors.secondary;
  return (
    <Panel style={styles.card}>
      <View style={styles.controls}>
        <Pressable accessibilityRole='button' accessibilityLabel={t('lessonUi.speed')} onPress={cycleRate} style={styles.speed}><Text variant='titleSmall' style={{ color: blue, fontWeight: '700' }}>{`${rate.toFixed(2)}x`}</Text></Pressable>
        <Pressable accessibilityRole='button' accessibilityLabel={t('lessonUi.back15')} onPress={() => seekBy(-15)} style={styles.skip}><Text style={[styles.skipIcon, { color: blue }]}>↺</Text><Text style={[styles.skipLabel, { color: blue }]}>15</Text></Pressable>
        <Pressable accessibilityRole='button' accessibilityLabel={status.playing ? t('learn.pause') : t('learn.play')} onPress={() => (status.playing ? player.pause() : player.play())} style={[styles.play, { backgroundColor: blue }]}><Text style={[styles.playIcon, { color: theme.colors.onSecondary }]}>{status.playing ? '❚❚' : '▶'}</Text></Pressable>
        <Pressable accessibilityRole='button' accessibilityLabel={t('lessonUi.forward15')} onPress={() => seekBy(15)} style={styles.skip}><Text style={[styles.skipIcon, { color: blue }]}>↻</Text><Text style={[styles.skipLabel, { color: blue }]}>15</Text></Pressable>
        <Pressable accessibilityRole='button' accessibilityLabel={t('lessonUi.follow')} accessibilityState={{ selected: follow }} onPress={onToggleFollow} style={[styles.tool, follow && { backgroundColor: theme.colors.primaryContainer }]}><Text style={[styles.toolIcon, { color: blue }]}>⇩</Text></Pressable>
        <Pressable accessibilityRole='button' accessibilityLabel={t('lessonUi.jump')} onPress={onJump} style={styles.tool}><Text style={[styles.toolIcon, { color: blue }]}>◎</Text></Pressable>
      </View>
      <View style={styles.seekRow}><Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{fmt(status.currentTime)}</Text><SeekBar value={ratio} onSeek={(r) => void player.seekTo(r * (status.duration || 0))} /><Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{fmt(status.duration)}</Text></View>
    </Panel>
  );
}

const styles = StyleSheet.create({ card: { gap: 4, paddingVertical: 12, borderRadius: 24 }, controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, speed: { minWidth: 52, paddingVertical: 8 }, skip: { alignItems: 'center', justifyContent: 'center', width: 44, height: 44 }, skipIcon: { fontSize: 26, lineHeight: 28 }, skipLabel: { fontSize: 10, fontWeight: '700', marginTop: -6 }, play: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }, playIcon: { fontSize: 22 }, tool: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, toolIcon: { fontSize: 22 }, seekRow: { flexDirection: 'row', alignItems: 'center', gap: 10 } });
