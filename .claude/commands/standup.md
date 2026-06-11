Run the daily standup for this session.

Step 1 — Establish the current date and week position:
- Run: date
- Read the active phase file from private/ (whichever of phase-1-foundation.md, phase-2-build.md, or phase-3-articulate.md is not yet marked complete)
- Cross-reference the date output with the phase file to determine the current Week X Day Y
- If the week/day cannot be determined with confidence, ask the developer before continuing

Step 2 — Read the following files:
- learning-notes.md (most recent entry)
- private/seven-week-plan.md (daily structure and context)

Step 3 — Summarise what was delivered yesterday: what landed, what didn't, any loose ends.

Step 4 — Check for open PRs with: gh pr list --state open

Step 5 — Output in this format:

**Date:** [date] — [Week X Day Y]

**Yesterday**
[what landed]

**Carried**
[deferred or incomplete]

**Open PRs**
[list or "none"]

**Ready to confirm today's tasks.**
