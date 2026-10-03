# Balanced Home: H1 layout repair

Separate branch from main at c87b902aa90ed445c2edbe31cc22d42b42cc5ef9. The audio branch and PR 8 are untouched.

The old StatCard always used flex: 1. That fill behavior was reused inside vertical wrappers in a wrapping Home row, causing unintended growth instead of content-driven status-card heights. H1 adds an explicit fill=false mode, preserving fill=true as the default for existing Progress/quiz/exam callers.

Home's due-review and date cards use intrinsic mode. The study-day card's inner StatCard also uses intrinsic mode. Status wrappers use horizontal flex basis/grow/shrink without a vertical flex shorthand, and row items align at the top. No fixed card height or empty filler space is introduced; labels can wrap for French and larger fonts.

This commit changes layout only. Streak definitions, persistence, migration, completion, recommendations, reminders, analytics and audio behavior remain unchanged. H2 adds global charts; H3 makes recommendation actions more direct; H4 completes spacing and removes duplicated navigation.

Four sizing-policy tests are included but unexecuted. These tests are not native layout measurements. No lint, typecheck, tests, build or before/after verification were run, as requested. Device acceptance still needs the reported Android layout, both languages, larger text and the streak's explanation dialog.
