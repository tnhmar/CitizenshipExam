# Qualifying study-day streak (commit 5)

The streak records consecutive local calendar dates with a qualifying learning action, not readiness, mastery or minutes. Home shows one of done today, continue today, restart, or not started; best is shown only in Progress. Tapping the card or What counts opens the French/English explanation.

Qualifying: an accepted objective quiz/review response, an accepted objective exam selection, a valid full quiz result, explicit studied completion for a question-free lesson, or a finished exam with a valid answered question. Wrong or guessed objective answers count. Repeated same-date actions do not add days. Invalid or duplicate captured responses do not touch the streak.

Excluded: lesson opening, reader time, bookmarks, revealing cards, and flashcard self-ratings. SRS scheduling and assessment event recording still operate for self-reports; they simply do not earn a study day.

Schema version 4 preserves the previous streak in legacyActivityStreak and begins the new streak empty. No historical study-day dates are fabricated from a mixed activity counter. Completion, quizzes, exams, bookmarks, SRS, reader time and version-3 assessment history remain preserved. Older completion/history migrations retain their existing behavior. Reset clears the new and legacy streak along with other progress.

A valid next-date action extends the streak. Missing a full date makes the displayed current count zero until a new qualifying action restarts at one; best stays saved. Date comparisons use local calendar dates rather than a 24-hour millisecond gap. Device clock or time-zone changes remain a local-date limitation; no server clock or streak-freeze feature is added.

Eight helper tests are supplied, not executed. No lint, typecheck, build, tests or before/after verification were run, as requested. Existing unrelated CI warnings are outside this commit.
