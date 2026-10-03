import { createAudioPlayer } from 'expo-audio';
import { useEffect, useSyncExternalStore } from 'react';
import { SharedLessonAudio, type PlayerDriver } from './sharedLessonAudio';

function createDriver(source: number): PlayerDriver {
  const player = createAudioPlayer(source, { updateInterval: 250 });
  return {
    status: () => ({ loaded: player.isLoaded, playing: player.playing, buffering: player.isBuffering, position: player.currentTime, duration: player.duration, finished: false, error: null }),
    listen: (listener) => {
      const subscription = player.addListener('playbackStatusUpdate', (status) => listener({
        loaded: status.isLoaded, playing: status.playing, buffering: status.isBuffering,
        position: status.currentTime, duration: status.duration,
        finished: 'didJustFinish' in status && status.didJustFinish === true,
        error: 'playbackState' in status && status.playbackState === 'error' ? 'Audio playback failed' : null,
      }));
      return () => subscription.remove();
    },
    play: () => player.play(), pause: () => player.pause(), seek: (seconds) => player.seekTo(seconds),
    rate: (value) => player.setPlaybackRate(value), dispose: () => player.remove(),
  };
}
export const lessonAudio = new SharedLessonAudio(createDriver);
export function useLessonAudio() {
  return useSyncExternalStore(lessonAudio.subscribe, lessonAudio.getSnapshot, lessonAudio.getSnapshot);
}
export function useSharedAudioLifecycle(): void {
  useEffect(() => { const owner = lessonAudio; return () => { owner.stop(); }; }, []);
}
