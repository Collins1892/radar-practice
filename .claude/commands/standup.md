---
description: Run daily standup — date, yesterday's delivery, open PRs, confirm today's tasks.
---
Run the daily standup for this session.

Step 1 — Establish the current date and week position:
- Run: date
- Compare the date to the programme phase ranges:
  - Phase 1 (phase-1-foundation.md): May 19 – May 30
  - Phase 2 (phase-2-build.md): Jun 1 – Jun 21
  - Phase 3 (phase-3-articulate.md): Jun 22 – Jul 3
  - If the date falls in a gap between phases, ask the developer for
    Week X Day Y before continuing
- Read the matching phase file from private/
- Cross-reference the date with the ### Week X Day Y headers in the
  phase file to determine the current Week X Day Y
- If the week/day cannot be determined with confidence, ask the developer
  before continuing
- If private/ is missing, ask the developer for Week X Day Y and today's
  task list before continuing

Step 2 — Read the following files:
- learning-notes.md (all entries to identify sections by Week X Day Y)
- private/seven-week-plan.md (daily structure and context)
- docs/workflow-friction.md (open friction actions for Carried section)

When summarising, omit personal names, client names, and credentials — consistent with the PII hygiene rules in CLAUDE.md.

Step 3 — Summarise yesterday:
- "Yesterday" is the Week X Day Y section immediately before the
  date-derived current day — not simply the most recent entry
- Use the phase file as source of truth for completion status; use
  learning-notes.md for narrative detail. If they disagree, note the
  discrepancy.
- If no matching learning-notes.md section exists, summarise from
  yesterday's phase-file bullets only and note that notes are pending.
- Report: what landed, what didn't, any loose ends

Step 4 — Identify carried items:
- Incomplete bullets from yesterday's phase file section
- Any entry in docs/workflow-friction.md with Status: Open (check all
  entries, not just the latest)

Step 5 — Check for open PRs:
- Run: gh pr list --state open
- If gh is not authenticated or fails, note "gh unavailable — PR check
  skipped" and continue

Step 6 — Output in this format:

**Date:** [date] — [Week X Day Y]

**Yesterday**
[what landed]

**Carried**
[incomplete bullets from yesterday + open friction actions, or "none"]

**Open PRs**
[list or "none"]

**Ready to confirm today's tasks.**
