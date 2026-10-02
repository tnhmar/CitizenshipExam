# Learning statistics methodology

This PR keeps course completion separate from current learning evidence. No metric is a calibrated probability of passing, and none certifies permanent mastery.

## Assessment history
Events contain an ID, session ID, question ID, concept ID, timestamp, assessment mode, response type, correctness, first-response flag, retry context and optional self-reported confidence. No raw question text or external telemetry is required. History is local and bounded to the newest 5,000 events. A recording-start timestamp and pruning marker must be visible when interpreting coverage. Reset clears history together with other progress.

Older progress cannot reconstruct first responses, review sessions or when individual quiz questions were answered. Migration starts new event history empty; it preserves legacy scores and exam attempts as legacy evidence rather than fabricating timestamps. Future integration must record objective responses before feedback is revealed, use stable event IDs, and never label final changed exam selections as first responses.

## Course completion
The separate completion rules remain: full lesson quiz >=90%; every lesson complete plus full chapter quiz >=90%; explicit studied exception only for genuinely question-free lessons. Earned completion is not removed by later practice failure. Dashboard badges must use the shared completion selectors. Studied exceptions must not be described as assessment-validated mastery.

## Coverage and recent practice
The assessable pool consists of distinct concepts linked by native lesson question references. Duplicate question variants do not expand it. Coverage means concepts with recorded objective first-response evidence divided by this pool. Coverage is limited to retained events, not claimed lifetime coverage. Zero coverage means no recorded evidence; an empty pool has no percentage.

Recent practice uses the newest eligible first response for each distinct concept within 30 days, excluding exam modes. Self-report flashcards, future events and missed-only retries do not count. Repeated concepts within a session contribute their earliest eligible response only. A deliberately restarted full quiz is a new session and may contribute newer evidence, but remains familiar-bank practice, not independent readiness evidence.

## Delayed recall
Count objective review first responses at least 24 hours after the previous recorded encounter with that concept, within the last 30 days. Any intervening recorded encounter, including flashcard self-report and retries, resets the gap. Use the newest qualifying recall per concept. This is delayed performance on familiar concepts, not an estimate of memory half-life or probability of retaining knowledge. Unrecorded exposures cannot be detected.

## Topic evidence
Use the latest eligible objective response per native lesson concept in the last 30 days. Display correct/assessed distinct concepts, coverage, distinct assessment dates and most recent evidence date. Not assessed means no eligible recent evidence. Fewer than five assessed concepts means limited evidence, even if the score is 0% or 100%. Needs review means at least five concepts with accuracy below 75%. Strong recent evidence requires at least five concepts, 90% accuracy, 60% coverage, evidence on two local calendar dates, and no reported guessing in the latest outcomes. All other sufficiently broad outcomes use the learning label. These thresholds and the 30-day/24-hour windows are transparent product heuristics, not scientifically validated mastery cutoffs. Small chapters may never meet the strong-evidence sample requirement; show their limited sample rather than falsely upgrading confidence. Source exam chapter inferences must not override native concept membership.

## Exam performance
Use each finished attempt's actual distinct question count and the exam pass rule, not the 90% learning-validation rule. Count only answers belonging to the attempt, deduplicate answers and never score an unanswered item correct. Best exam ranks score ratios; display its original numerator and denominator. Recent timed mock evidence uses up to five finished mock attempts within 30 days. Repeated-bank results are not independent predictive trials. Improvement requires the latest six same-length mocks, comparing three recent with three earlier attempts, in percentage points. If there are fewer comparable attempts, show insufficient evidence, not zero improvement. A timed attempt only confirms configured timing; tracking timer expiry, help usage and first selections requires capture integration.

## Review workload and activity
Due means scheduled at or before now; overdue means before today's local midnight. Count distinct concepts that still belong to the lesson pool. Historic lapse counts are not current mastery. Reader duration remains an explicitly labelled estimate until active/background/idle timing is instrumented; do not use it in readiness. Listening is deferred to the separate audio PR and must not validate mastery.

## Integration checklist
- Persist and migrate assessment history without erasing legacy data.
- Capture quiz, review and exam responses with their mode/session/retry provenance.
- Exclude self-reported flashcard ratings from objective accuracy.
- Replace the blended readiness ring on Home and Progress.
- Show completion, recent mocks, concept evidence and review actions separately.
- Apply per-attempt denominators/pass colours and shared completion selectors everywhere.
- Display no-evidence, limited-sample, recording-start and pruning limitations.
- Add store, capture and screen regression tests before merge.
- Keep audio and haptics out of PR 6.
