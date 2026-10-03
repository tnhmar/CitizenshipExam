import type { Lang } from '../types';

export type PlaybackPhase = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
export interface LessonTrack { lessonId: number; lang: Lang; source: number; title: string; chapterTitle: string; }
export interface PlayerStatus { loaded: boolean; playing: boolean; buffering: boolean; position: number; duration: number; finished: boolean; error: string | null; }
export interface PlayerDriver {
  status: () => PlayerStatus;
  listen: (listener: (status: PlayerStatus) => void) => () => void;
  play: () => void; pause: () => void; seek: (seconds: number) => Promise<void>;
  rate: (value: number) => void; dispose: () => void;
}
export interface PlaybackSnapshot { track: LessonTrack | null; phase: PlaybackPhase; position: number; duration: number; rate: number; error: string | null; }
interface Entry { token: number; player: PlayerDriver; unsubscribe: () => void; timeout: ReturnType<typeof setTimeout> | null; wanted: boolean; requested: boolean; command: number; seeks: Promise<void>; }
export const trackKey = (track: LessonTrack): string => JSON.stringify([track.lang, track.lessonId, track.source]);
const empty = (): PlaybackSnapshot => ({ track: null, phase: 'idle', position: 0, duration: 0, rate: 1, error: null });
const finite = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 0;
const errorText = (error: unknown): string => error instanceof Error ? error.message : String(error);
export class SharedLessonAudio {
  private snapshot: PlaybackSnapshot = empty();
  private listeners = new Set<() => void>();
  private entry: Entry | null = null;
  private generation = 0;
  constructor(private readonly factory: (source: number) => PlayerDriver, private readonly loadTimeoutMs = 15000) {}
  getSnapshot = (): PlaybackSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(patch: Partial<PlaybackSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }
  private current(entry: Entry): boolean { return this.entry === entry && entry.token === this.generation; }
  private clearTimeout(entry: Entry): void { if (entry.timeout !== null) clearTimeout(entry.timeout); entry.timeout = null; }
  private release(): boolean {
    const entry = this.entry; this.generation += 1;
    if (!entry) return true;
    entry.wanted = false; entry.requested = false; entry.command += 1;
    this.clearTimeout(entry);
    try { entry.unsubscribe(); } catch { /* Still attempt native disposal. */ }
    entry.unsubscribe = () => undefined;
    try { entry.player.pause(); } catch { /* Dispose even if pause fails. */ }
    try { entry.player.dispose(); this.entry = null; return true; }
    catch (error) { this.publish({ phase: 'error', error: errorText(error) }); return false; }
  }
  private fail(entry: Entry, error: unknown): void {
    if (!this.current(entry)) return;
    const message = errorText(error);
    this.release(); this.publish({ phase: 'error', error: message });
  }
  private receive(entry: Entry, status: PlayerStatus): void {
    if (!this.current(entry)) return;
    if (status.error) { this.fail(entry, status.error); return; }
    if (status.loaded) this.clearTimeout(entry);
    if (status.finished) { entry.wanted = false; entry.requested = false; }
    const duration = finite(status.duration);
    const position = duration > 0 ? Math.min(duration, finite(status.position)) : finite(status.position);
    const ended = status.finished || this.snapshot.phase === 'ended' && !entry.wanted;
    const phase: PlaybackPhase = ended ? 'ended' : !status.loaded || status.buffering ? 'loading' : status.playing ? 'playing' : 'paused';
    this.publish({ phase, position, duration, error: null });
    if (status.loaded && entry.wanted && !entry.requested && !status.finished) {
      entry.requested = true;
      try { entry.player.play(); } catch (error) { this.fail(entry, error); }
    }
  }
  async play(track: LessonTrack, rate?: number): Promise<void> {
    if (!Number.isSafeInteger(track.lessonId) || track.lessonId <= 0 || !Number.isSafeInteger(track.source) || track.source <= 0 || track.lang !== 'en' && track.lang !== 'fr') return;
    const same = this.snapshot.track !== null && trackKey(this.snapshot.track) === trackKey(track);
    let entry = this.entry;
    if (!same || !entry || this.snapshot.phase === 'error') {
      if (!this.release()) return;
      this.snapshot = { ...empty(), track: { ...track }, phase: 'loading', rate: rate !== undefined && Number.isFinite(rate) ? Math.max(1, Math.min(2, rate)) : 1 };
      this.publish({});
      try {
        const player = this.factory(track.source);
        entry = { token: ++this.generation, player, unsubscribe: () => undefined, timeout: null, wanted: true, requested: false, command: 0, seeks: Promise.resolve() };
        this.entry = entry;
        const owned = entry;
        owned.timeout = setTimeout(() => this.fail(owned, new Error('Audio did not finish loading')), this.loadTimeoutMs);
        const unsubscribe = player.listen((status) => this.receive(owned, status));
        if (!this.current(owned)) { unsubscribe(); return; }
        owned.unsubscribe = unsubscribe;
        player.rate(this.snapshot.rate);
        this.receive(owned, player.status());
      } catch (error) {
        if (entry && this.current(entry)) this.fail(entry, error);
        else if (this.snapshot.track && trackKey(this.snapshot.track) === trackKey(track)) this.publish({ phase: 'error', error: errorText(error) });
      }
      return;
    }
    const command = ++entry.command;
    if (rate !== undefined) this.setRate(rate, trackKey(track));
    if (!this.current(entry)) return;
    if (this.snapshot.phase === 'ended') {
      entry.wanted = false;
      const owned = entry;
      const task = owned.seeks.catch(() => undefined).then(async () => { if (this.current(owned)) await owned.player.seek(0); });
      owned.seeks = task;
      try { await task; } catch (error) { this.fail(owned, error); return; }
      if (!this.current(owned) || owned.command !== command) return;
      this.publish({ phase: 'paused', position: 0 });
    }
    if (entry.command !== command) return;
    entry.wanted = true; entry.requested = false;
    try { this.receive(entry, entry.player.status()); } catch (error) { this.fail(entry, error); }
  }
  pause(expectedKey?: string): void {
    const entry = this.entry;
    if (!entry || expectedKey !== undefined && (!this.snapshot.track || trackKey(this.snapshot.track) !== expectedKey)) return;
    entry.command += 1; entry.wanted = false; entry.requested = false;
    try { entry.player.pause(); this.publish({ phase: this.snapshot.phase === 'ended' ? 'ended' : 'paused' }); }
    catch (error) { this.fail(entry, error); }
  }
  async seek(seconds: number, expectedKey?: string): Promise<void> {
    const entry = this.entry;
    if (!entry || !Number.isFinite(seconds) || this.snapshot.duration <= 0 || expectedKey !== undefined && (!this.snapshot.track || trackKey(this.snapshot.track) !== expectedKey)) return;
    const target = Math.max(0, Math.min(this.snapshot.duration, seconds));
    const task = entry.seeks.catch(() => undefined).then(async () => { if (this.current(entry)) await entry.player.seek(target); });
    entry.seeks = task;
    try {
      await task;
      if (this.current(entry)) {
        if (this.snapshot.phase === 'ended' && target < this.snapshot.duration) this.publish({ phase: 'paused' });
        this.receive(entry, entry.player.status());
      }
    } catch (error) { this.fail(entry, error); }
  }
  setRate(value: number, expectedKey?: string): void {
    const entry = this.entry;
    if (!entry || !Number.isFinite(value) || expectedKey !== undefined && (!this.snapshot.track || trackKey(this.snapshot.track) !== expectedKey)) return;
    const rate = Math.max(1, Math.min(2, value));
    try { entry.player.rate(rate); this.publish({ rate }); } catch (error) { this.fail(entry, error); }
  }
  stop(): void { if (this.release()) { this.snapshot = empty(); this.publish({}); } }
}
