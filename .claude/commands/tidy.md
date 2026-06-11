---
description: Check status of today's tasks and Week 7 tidy list against PRs and branches.
---
Check the status of today's tasks and the Week 7 tidy list.

Step 1 — Establish the current date and week position:
- Run: date
- Compare the date to the programme phase ranges:
  - Phase 1 (phase-1-foundation.md): May 18 – May 30
  - Phase 2 (phase-2-build.md): Jun 2 – Jun 20
  - Phase 3 (phase-3-articulate.md): Jun 23 – Jul 4
  - If the date falls in a gap between phases, ask the developer for
    Week X Day Y before continuing
- Read the matching phase file from private/ to find today's task list
- Read private/phase-3-articulate.md to find all T0X tidy list items
- If private/ is missing, ask the developer for today's tasks and skip
  the tidy list check

Step 2 — Run status checks:
- Run: gh pr list --state open --json number,title,headRefName
- Run: gh pr list --state merged --json number,title,headRefName --limit 50
- Run: git branch -r
- If gh is not authenticated or fails, note "gh unavailable — PR checks
  skipped" and continue with branch and codebase checks only

Step 3 — Assign status to T0X tidy list items using these rules in order:
- **Done** — the T0X identifier appears in a merged PR title or branch
  name, OR the corresponding line in private/phase-3-articulate.md is
  marked ✅. The ✅ marker is the primary Done signal; merged PR match
  is supplementary.
- **In PR** — T0X identifier appears in an open PR title or branch name
  (note PR number)
- **In Progress** — a remote branch name contains the T0X identifier
  but has no open PR (note branch name)
- **Partial** — partially addressed in the codebase
- **Open** — none of the above apply
- **Unknown** — insufficient information to determine status

Step 4 — Assign status to today's tasks (D01, D02 etc., numbered
sequentially from the phase file bullets for the current day):
- **Done** — bullet is marked ✅ in the phase file, OR a merged PR
  or open PR title/branch contains a significant keyword from the task
  text (first noun phrase or distinctive term)
- **In PR** — open PR title or branch contains a significant keyword
  from the task text (note PR number)
- **In Progress** — remote branch name contains a significant keyword
  from the task text but has no open PR (note branch name). If no clear
  keyword match exists, mark Unknown rather than guess.
- **Partial** — partially addressed in the codebase
- **Open** — none of the above apply
- **Unknown** — insufficient information to determine status

Step 5 — Output in this format (no blank lines between table rows):

**Today's tasks — [Week X Day Y]**

| ID | Task | Status | Notes |
|----|------|--------|-------|
| D01 | ... | ... | ... |

**Week 7 tidy list**

| ID | Item | Status | Notes |
|----|------|--------|-------|
| T01 | ... | ... | ... |

**Summary**
Today: [X] Done · [Y] In PR · [Z] In Progress · [W] Partial · [V] Open · [U] Unknown
Tidy list: [X] Done · [Y] In PR · [Z] In Progress · [W] Partial · [V] Open · [U] Unknown

Step 6 — If any items are Open or Partial, ask:
"Would you like to address any of these now?"
