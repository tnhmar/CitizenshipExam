# Preparation-first design reset: R4

Settings is reorganized into the three groups shown in the selected specification: Preferences, Exam and Data. Each preference and exam row shows its saved summary and opens a focused sub-screen within the existing Settings modal. Header Back and Android device Back return from technical details to reminders, then to the Settings overview. Close dismisses Settings. The root navigator and Home are unchanged.

Reminder configuration retains opt-in permission handling, category toggles, the native time picker and the five-second notification test. Suggested study duration remains available in a collapsed editor; it still personalizes reminder copy rather than reporting measured study time. The default reminder surface shows only a concise registration/off/blocked/unavailable status. It does not equate queue registration with delivery.

Device authorization, exact-alarm explanations, queue previews, scheduling counts, last check, raw errors, dated-trigger test, refresh and device-settings actions are behind Technical details. Existing readback cancellation guards and deferred inspection are preserved. Reminder scheduling, notification copy, stores and migrations are not modified.

Appearance is represented by the existing system/light/dark choices. Text-size slider bounds and preview, haptic feedback and reduced-motion settings remain. Data contains privacy information, a Progress link and app version. Reset stays visually separate and retains confirmation, reminder disabling, progress reset and reminder synchronization.

No tests, lint, typecheck, build or native visual validation were run. Acceptance remains: French/English, large text, theme switching, native pickers, Android/header Back and Close, reminder permission denial, both tests, diagnostics and destructive reset confirmation. R1-R3 and the corrected 25/40/35 formula remain unchanged.
