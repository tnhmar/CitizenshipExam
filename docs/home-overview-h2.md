# Balanced Home: H2 compact global overview

The overview is now above the recommendation. It replaces the old separate completion preview rather than duplicating it. Detailed Progress content and stored data are unchanged; the audio branch and PR 8 are untouched.

Course chart: a small static SVG ring using completed lessons divided by available lessons. Lesson and chapter numerators/denominators remain separate and visible. An empty course has no fabricated percentage. This is completion, not readiness.

Mock chart: at most the five recent timed mock attempts already selected by the shared dashboard (last 30 days), displayed oldest to newest. Scores use each attempt's actual denominator. The dashed pass requirement also uses each attempt's own required/total value. The overview shows average and latest score, not a full attempt list. One point is explicitly not a trend; no mocks shows a short empty state and exam-selection link rather than an empty plot.

Recent practice: the existing latest-objective-response-per-concept summary over the last 30 days, displayed with numerator/denominator, assessed sample count and a small bar when assessed. Missing evidence is not zero performance; an assessed zero is displayed as zero. Flashcard self-ratings are not substituted as accuracy. No blended passing-probability score is created.

Charts have text summaries and screen-reader labels. Layout columns wrap rather than imposing a large fixed panel height. Home's H1 intrinsic status-card sizing remains in place. H3 still needs to shorten the recommendation and make validation actions direct. H4 still needs to remove the Explorer grid and finish compact status/icon styling.

Eight presentation-model tests are included but unexecuted. No tests, lint, typecheck, build or before/after verification were run, as requested. Device acceptance remains necessary for the reported Android screen, French/English, larger text, zero history, one mock, five mocks, and comparison with Progress.
