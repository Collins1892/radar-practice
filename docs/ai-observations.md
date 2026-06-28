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
- **Action:** Add a change-type check at the start of the loop — if the diff
  touches only `.md` files, skip the test suite and go straight to the review
  pass.
- **Resolution:** Added a pre-flight change-type check to
  [loop-pattern.md](loop-pattern.md) §3 (and the §9 prompt snippets) — a
  markdown-only diff skips the test suite and goes straight to Step 2 (review).
- **Status:** Resolved (Week 5 Day 1)

### Week 6 Day 6 — Saturday 27 June 2026 (T73 guard)

- **Category:** Nightly agent / fail-closed
- **Observation:** Oversize file content in implement prompts caused silent GHA
  connection drops (T26).
- **Action:** 100 KiB UTF-8 guard + skip-and-retry in same run; backlog-only
  push when all tasks oversize.
- **Resolution:** T73 — see CLAUDE.md Automation and learning-notes.md Week 6
  Day 6.
- **Status:** Resolved (pending T73 PR merge)
