# Preparation-first design reset: R1

This reset implements the newer Preparation-first Option 1 selected in the attached proposal, not the earlier balanced-overview Option 1. It supersedes the relevant H4 header/tile/surface presentation inside PR 9. PR 8 and its audio branch are unchanged.

R1 restores a compact full-width red Home header with white greeting/settings icon and light status-bar content. The preparation metric itself is R2; no illustrative 42% or other invented value is shown here. The current detailed Home overview remains temporarily until R3 replaces it with the selected compact course/evidence summary. Settings drill-down work is R4.

Today has three equal-width tiles at normal phone widths. Separate bounded rows use alignItems stretch so each row's tiles share the height of its tallest content, with a scalable minimum and aligned label/value/hint slots. There is no unbounded vertical flex-fill. Large text and very narrow widths switch the whole grid to two or one columns. An incomplete final row keeps the same tile width rather than widening the last card. Text can wrap without a fixed-height clipping cap. Review, exam-date and study-day actions and the full bilingual streak explanation remain.

Root now synchronizes the Paper and navigation themes through the official SDK 56 expo-router/react-navigation entry point, without adding external @react-navigation packages. Navigation background/card/text colors, SafeAreaProvider/root View background, native stack content and tab scenes match the theme. This addresses app-owned white margins/corners around a dark floating tab bar. The native stack requests a matching Android navigation-bar color; that option is deprecated and may be ignored by edge-to-edge Android versions, so actual system-bar rendering and icon contrast remain device-dependent and unconfirmed.

No progress, streak, completion, recommendation-priority, reminder or audio logic changes are included. Existing Learn/Review tab-root recovery and focused-exam tab hiding are preserved. Stored data is untouched.

Six policy tests are supplied but unexecuted. No tests, lint, typecheck, builds or before/after verification were run, as requested. R1 acceptance still needs equal tile measurements/visual alignment on the user's phone, French/English and larger fonts, dark-mode tab-bar margins and Android system-navigation area, theme transitions, direct quiz/review navigation and the unchanged streak dialog. R2-R4 remain pending; do not treat this intermediate reset as the complete new Home.
