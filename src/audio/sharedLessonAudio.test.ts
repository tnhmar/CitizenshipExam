import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { SharedLessonAudio, trackKey, type LessonTrack, type PlayerDriver, type PlayerStatus } from './sharedLessonAudio';
const track = (id: number, lang: 'en' | 'fr' = 'en'): LessonTrack => ({ lessonId: id, lang, source: id, title: `Lesson ${id}`, chapterTitle: 'Chapter' });
function fake(source: number, log: string[], loaded = true) {
  let status: PlayerStatus = { loaded, playing: false, buffering: false, position: 0, duration: 120, finished: false, error: null };
  let listener: ((value: PlayerStatus) => void) | null = null;
  const emit = (patch: Partial<PlayerStatus>) => { status = { ...status, ...patch }; listener?.({ ...status }); };
  const player: PlayerDriver = {
    status: () => ({ ...status }),
    listen: (callback) => { listener = callback; return () => { listener = null; log.push(`unsubscribe:${source}`); }; },
    play: () => { log.push(`play:${source}`); emit({ playing: true, finished: false }); },
    pause: () => { log.push(`pause:${source}`); emit({ playing: false }); },
    seek: async (position) => { log.push(`seek:${source}:${position}`); emit({ position, finished: false }); },
    rate: (value) => { log.push(`rate:${source}:${value}`); },
    dispose: () => { log.push(`dispose:${source}`); },
  };
  return { player, emit, late: () => listener };
}
const sessions: SharedLessonAudio[] = [];
function setup(loaded = true) {
  const log: string[] = []; const players: ReturnType<typeof fake>[] = [];
  const session = new SharedLessonAudio((source) => { log.push(`create:${source}`); const value = fake(source, log, loaded); players.push(value); return value.player; });
  sessions.push(session); return { session, players, log };
}
afterEach(() => { for (const session of sessions.splice(0)) session.stop(); jest.useRealTimers(); });
describe('shared lesson audio ownership', () => {
  test('repeated Play on the same recording creates only one native player', async () => {
    const { session, players } = setup(); await session.play(track(1)); await session.play(track(1));
    expect(players).toHaveLength(1); expect(session.getSnapshot().phase).toBe('playing');
  });
  test('changing lesson or language releases the old player before creating the new one', async () => {
    const { session, log } = setup(); await session.play(track(1)); await session.play(track(1, 'fr'));
    expect(log.indexOf('dispose:1')).toBeLessThan(log.lastIndexOf('create:1'));
    expect(session.getSnapshot().track?.lang).toBe('fr');
  });
  test('status updates from a replaced recording cannot mutate the current session', async () => {
    const { session, players } = setup(); await session.play(track(1)); const stale = players[0].late();
    await session.play(track(2)); stale?.({ loaded: true, playing: false, buffering: false, position: 99, duration: 120, finished: true, error: null });
    expect(session.getSnapshot().track?.lessonId).toBe(2); expect(session.getSnapshot().phase).toBe('playing');
    expect(session.getSnapshot().position).toBe(0);
  });
  test('unsubscribing a screen does not release the global recording', async () => {
    const { session, log } = setup(); const off = session.subscribe(() => undefined);
    await session.play(track(1)); off(); expect(log).not.toContain('dispose:1');
    expect(session.getSnapshot().phase).toBe('playing');
  });
  test('pause and resume preserve the recording and position', async () => {
    const { session, players } = setup(); await session.play(track(1)); players[0].emit({ position: 30 });
    session.pause(trackKey(track(1))); expect(session.getSnapshot().phase).toBe('paused');
    await session.play(track(1)); expect(players).toHaveLength(1); expect(session.getSnapshot().position).toBe(30);
  });
  test('Play after completion seeks to the beginning before replay', async () => {
    const { session, players, log } = setup(); await session.play(track(1));
    players[0].emit({ finished: true, playing: false, position: 120 }); expect(session.getSnapshot().phase).toBe('ended');
    await session.play(track(1)); expect(log).toContain('seek:1:0'); expect(session.getSnapshot().position).toBe(0);
    expect(session.getSnapshot().phase).toBe('playing');
  });
  test('Stop clears identity and disposes the native recording', async () => {
    const { session, log } = setup(); await session.play(track(1)); session.stop();
    expect(session.getSnapshot().track).toBeNull(); expect(session.getSnapshot().phase).toBe('idle');
    expect(log).toContain('dispose:1');
  });
  test('pause during loading prevents later load events from starting playback', async () => {
    const { session, players, log } = setup(false); await session.play(track(1)); session.pause();
    players[0].emit({ loaded: true }); expect(log).not.toContain('play:1'); expect(session.getSnapshot().phase).toBe('paused');
  });
  test('an unloaded recording times out and releases resources', async () => {
    jest.useFakeTimers(); const { session, log } = setup(false); await session.play(track(1));
    jest.advanceTimersByTime(15000); expect(session.getSnapshot().phase).toBe('error'); expect(log).toContain('dispose:1');
  });
  test('commands addressed to another recording do not seek or change its rate', async () => {
    const { session, log } = setup(); await session.play(track(1)); const other = trackKey(track(2));
    await session.seek(60, other); session.setRate(2, other);
    expect(log).not.toContain('seek:1:60'); expect(session.getSnapshot().rate).toBe(1);
  });
});
