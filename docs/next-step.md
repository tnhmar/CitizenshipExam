# Recommended next step (commit 3)

One primary recommendation and at most one smaller alternative are derived by a shared selector.

Priority: live, unexpired exam; due reviews; earliest chapter awaiting validation; evidence-qualified weak topic; current chapter lesson; mock practice after course completion.

A chapter awaiting validation cannot be bypassed by the first incomplete lesson in the next chapter. Course ordering uses chapter order and lessonIds rather than incidental bundle array order. Earned completion stays unchanged. Quiz availability and validation rules are not altered.

On Home, a live exam stays primary and course continuation is secondary with a timer warning. Pending chapter validation offers chapter review as its alternative. Home and Progress use the same primary selection; the secondary control is added to Home only in this commit. Existing chapter-detail routing for validation is retained.

Expired attempts are not recommended as live exams. This does not submit, delete or otherwise alter an expired attempt; existing exam lifecycle behavior remains responsible for submission.

The Home layout, analytics cards, reminders and streak rules are not refactored in this commit. The later Home refactor can reuse nextAlternative.

Tests are included but have not been run. No lint, typecheck, build or pre/post-push verification has been performed at the user's request.
