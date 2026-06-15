# AI observations — implement-test-review loop tuning

Tuning log for the [implement-test-review loop](loop-pattern.md). Records
what was observed during loop runs and what was changed (or proposed) as a
result.

## Entries

### Week 5 Day 1 — Monday 15 June 2026

- **Category:** Loop tuning
- **Observation:** The loop runs the full CI test suite on every iteration
  regardless of change type. For markdown-only changes (no code, no tests)
  this is wasteful — 3 test suites ran unnecessarily on a `learning-notes.md`
  indent fix.
- **Action:** Consider adding a change-type check at the start of the loop —
  if the diff touches only `.md` files, skip the test suite and go straight
  to the review pass.
- **Status:** Open
