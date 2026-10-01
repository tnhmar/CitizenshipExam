import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
};

interface Props {
  source: number;
  onTime: (ms: number) => void;
}

export function AudioBar({ source, onTime }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    onTime(Math.round(status.currentTime * 1000));
  }, [status.currentTime, onTime]);

  const seek = (delta: number) => {
    void player.seekTo(Math.max(0, status.currentTime + delta));
  };

  return (
    <View style={[styles.bar, { backgroundColor: theme.colors.elevation.level2, borderColor: theme.colors.outlineVariant }]}>
      <Button compact accessibilityLabel={t('learn.rewind')} onPress={() => seek(-10)}>
        -10s
      </Button>
      <Button mode='contained' compact onPress={() => (status.playing ? player.pause() : player.play())}>
        {status.playing ? t('learn.pause') : t('learn.play')}
      </Button>
      <Button compact accessibilityLabel={t('learn.forward')} onPress={() => seek(10)}>
        +10s
      </Button>
      <Text variant='bodySmall'>{`${fmt(status.currentTime)} / ${fmt(status.duration)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, padding: 8, borderWidth: 1, borderRadius: 16 },
});
