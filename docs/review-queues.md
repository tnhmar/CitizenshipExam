# Review queues and grading transactions

This change separates the scheduled workload, unresolved difficulties, and historical misses. All app deck counts are scoped to the native lesson concept pool. Review uses the same conceptPool/reviewWorkload eligibility as Home/Progress; session selection resolves a stale representative question by concept and deduplicates cards before sampling.

- Due: due <= now, oldest due first, seeded ordering for ties.
- Needs more practice: needsWork when recorded, otherwise legacy lapses > 0. Sixty percent of slots are reserved for due unresolved cards, then the least recently practiced unresolved cards fill the rest. Lifetime lapses do not dominate selection.
- Previously missed: distinct eligible concepts with lapses > 0, even after resolution.
- Random: one native representative per concept; unseen and least recently practiced concepts precede recent ones, with seeded ties.
- A session contains up to REVIEW_SESSION_SIZE (20) items. The overview shows collection size separately.

Every genuine unknown grade increments the lifetime lapse counter once. Duplicate contextual actions are rejected using a persisted action ledger before either scheduling or event capture. The ledger is kept across history pruning and app restarts and cleared by progress reset; it intentionally grows with contextual grading actions. Legacy callers without assessment context remain supported but cannot provide replay identity.

Unknown answers enter relearning due in ten minutes. Immediate missed-only retries or exposed answers do not earn recall promotions. A successful due short-relearning step schedules a day later without increasing repetitions or clearing needsWork. Later due successful recall at least 24 hours after the last scheduling action can promote the interval. Only an objective, unexposed, non-guessed recall resolves needsWork. Guessed answers remain unresolved. Self-ratings can maintain a spaced-review schedule after a valid delay but cannot certify objective resolution. These windows are product rules, not validated memory predictions.

Practice time and latest grade are saved separately from last scheduling time. Reopening sessions therefore rotates practiced concepts without postponing scheduled cards repeatedly. Historical errors are never erased by successful correction. Legacy cards are not automatically declared resolved; their existing dates, intervals and counts survive migration. Version 5 adds the replay ledger without resetting assessment history, quizzes, settings, completion, bookmarks or streaks.

Session summaries distinguish objective accuracy from confidence grades and identify self-report-only rounds. Correct guesses count as objectively correct, not as confident knowledge. Exposure is recorded once per step, and corrections contain each item at most once. A summary reports cards still due before presenting the next future time.

Regression tests are supplied but not executed. No tests, lint, typecheck, build, device checks or pre/post-push validation were run. Rendering, migration and runtime behavior remain unverified. Existing no-context quiz/exam scheduling remains a compatibility boundary; callers need stable context to obtain replay protection.
