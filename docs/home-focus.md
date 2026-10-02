# Focus-first Home (commit 4)

Home now has a compact greeting/settings header, one primary next-step card with at most one secondary action, a Today section, a compact course-completion preview and four shortcuts (Learn, Review, Exams, Progress).

Removed from Home: the recent mock history and trend panel, concept evidence and delayed recall panel, their long explanations, the reminder-settings card, and the Bookmarks/Glossary shortcut row. Existing destination screens and stored data are unchanged; the existing Progress screen already contains detailed analytics. The Learn glossary route and Review bookmarks route are not deleted.

The primary and secondary recommendations from commit 3 are retained. Chapter validation keeps existing chapter-detail routing, unavailable quizzes retain their explanatory fallback, and live exams show the timer warning when offering another activity.

The course ring represents the completed lesson ratio, not readiness or chapter validation. Both lesson and chapter counts remain visible. Layout wraps status tiles, progress text and shortcuts on narrow screens. Header/settings access and safe-area spacing are retained.

Current streak rules and labels are intentionally unchanged; qualifying study-day rules belong to the separate commit 5. This commit does not alter scheduling, assessment history, completion rules, or exam lifecycle.

Six helper tests are included but not executed. No lint, typecheck, tests, build, or before/after verification were performed, as requested.
