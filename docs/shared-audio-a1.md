# A1: shared lesson audio ownership

Baseline: main after PR 7, merge commit c87b902aa90ed445c2edbe31cc22d42b42cc5ef9.

A1 introduces a single app-lifetime lesson audio controller and a native expo-audio adapter. The controller is separate from persisted preferences, progress, assessment history and study-day streaks. No dependency or native configuration change is included.

Recordings are identified by language, lesson ID and the local require asset number. Opening a lesson does not replace playback. Pressing Play for a different recording unsubscribes, pauses and disposes the old recording before creating its replacement. Generation guards discard late updates and pending seek/replay results from replaced recordings. A native disposal failure blocks replacement rather than knowingly creating overlapping players.

Screen subscription cleanup does not dispose the shared player. Root lifecycle cleanup stops the session. Playback state is in-memory only; app relaunch does not auto-play or restore a recording.

The existing lesson controls now address that shared session: Play/Pause, speed, seeking, follow/jump position updates, plus Stop and loading/error messages. Another lesson's controls display zero position and cannot seek or change that recording's speed. Pressing Play intentionally replaces it. Completion has an explicit ended state and Replay seeks to zero. Loading has a 15-second timeout and retryable error state.

The session states are idle, loading, playing, paused, ended and error. Native status remains the playback source of truth. Audio events do not record study activity, count a streak day or validate completion.

A2 adds the cross-screen mini-player; A3 adds native background and lock-screen support; A4 adds exam/interruption policy; A5 completes reader synchronization and lifecycle hardening. A1 alone does not promise background playback or pause audio when a timed exam starts. Until A4, stop lesson audio manually before timed practice.

Ten fake-driver regression tests are included but not executed. No lint, typecheck, test run, native build or before/after verification was performed, per the user's instruction.

Manual acceptance after installing an A1 build: play lesson A, navigate to another foreground tab and return without restarting; open lesson B without pressing Play and ensure A remains the active recording; press Play on B and ensure A stops; return to B and check position/control ownership; switch between French and English recordings; pause/resume, seek, cycle rate, Stop and replay after completion; verify missing/failed audio errors are retryable. Real lesson audio assets are required; the sample build may not contain recordings.
