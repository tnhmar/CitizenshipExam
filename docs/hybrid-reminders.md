# Hybrid local reminders (commit 2)

- One native DAILY trigger replaces the finite 30-day study queue. It uses local hour/minute, not an 86400-second interval.
- Daily content is intentionally generic. It cannot read changing learning state while JavaScript is not running. Tap routing resolves the current valid exam, review or course task.
- If study and review are enabled, the daily message covers both intents. It does not add a second review alert.
- Review-only mode maintains one upcoming due notification. Review after the selected hour moves to the next day. A due date beyond 30 days can still be scheduled. It is rebuilt on existing foreground/progress synchronization; it cannot recompute an unlimited chain with the app permanently closed.
- Exam milestones remain dated 7/3/1-day notices. These can add one extra alert at the chosen hour on a milestone day if daily study is also enabled. Review-only milestones sharing a date coalesce.
- A sync cancels owned legacy dated study/review notices, keeps test notifications, and replaces the stable recurring registration only when settings/copy change. Turning reminders off cancels owned registrations. No global cancellation is used.
- Queue inspection reports the next occurrence of the registered daily trigger, not its creation time. Counts mean registrations, not the number of future deliveries.
- Exact-alarm authorization limitations from commit 1 remain. Recurrence is not a guarantee of exact delivery, reboot persistence on every OEM, DST behavior or immunity to force-stop/system restrictions.
- Quiet weekdays, pause controls, action buttons, native exact-alarm capability checks and all Home/recommendation/streak changes are outside this commit.

No tests, lint, typecheck, build or before/after verification have been run for this commit, at the user's request. Helper tests are included but not executed.
