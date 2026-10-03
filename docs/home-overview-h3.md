# Balanced Home: H3 compact, distinct recommendation actions

Home now renders a dedicated recommendation card with a short requirement/status line instead of the previous paragraph. Lesson and chapter names are separated into subject and context. Text may wrap; no fixed card height or truncation hides the requirement.

For an available pending chapter assessment, Validate chapter opens /learn/quiz?kind=chapter&id=<id> directly. Review opens /learn/<id>. Quiz availability is resolved from the current content bundle using the existing assessmentIds selector. An unavailable assessment falls back to chapter details with an honest unavailable message; deleted content falls back to the course/exam list. Secondary actions targeting the same route as the primary are hidden.

A course-validation alternative while a live exam is primary also opens the quiz directly and is labelled Validate chapter rather than an ambiguous Continue course. The exam remains primary, and the timer warning remains visible before choosing the alternative. The shared priority selector, exam lifecycle and completion rules are unchanged. Opening a quiz is not a passing result.

The H2 overview and H1 intrinsic status-card sizing remain intact. This is a Home presentation/routing change; Progress and notification destinations retain their existing behavior. H4 still needs to remove the Explorer grid and finish compact status/icon/responsive styling. PR 8 and the audio branch are untouched.

Eight recommendation-model tests are included but not executed. No lint, typecheck, tests, native build or before/after verification were run, as requested. Manual acceptance remains: available pending quiz vs Review must lead to distinct screens; unavailable/deleted assessment fallbacks; live exam plus secondary validation and timer warning; narrow French/English and larger text; no automatic completion from navigation.
