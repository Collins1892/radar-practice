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
- Read the matching phase file from private/ to find today's task list
- Read private/phase-3-articulate.md to find the Week 7 tidy list (T0X items)
- If private/ is missing, ask the developer for today's tasks and skip
  the tidy list check

Step 2 — Run status checks:
- Run: gh pr list --state open --json number,title,headRefName
- Run: gh pr list --state merged --json number,title,headRefName --limit 20
- Run: git branch -r
- If gh is not authenticated or fails, note "gh unavailable — PR checks
  skipped" and continue with branch and codebase checks only

Step 3 — Assign a status to each item using these rules in order:
- **Done** — the T0X identifier appears in a merged PR title, OR the
  corresponding line in private/phase-3-articulate.md is marked ✅
- **In PR** — the T0X identifier appears in an open PR title or branch
  name (note the PR number)
- **In Progress** — a remote branch exists whose name relates to the
  task but has no open PR (note the branch name)
- **Partial** — partially addressed in the codebase
- **Open** — none of the above apply
- **Unknown** — insufficient information to determine status

Step 4 — For today's tasks, number them sequentially as D01, D02 etc.
from the phase file bullet list for the current day. Do not invent IDs
that are not in the source — use the bullet text as the task description.

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
Today: [X] Done · [Y] In PR · [Z] In Progress · [W] Open
Tidy list: [X] Done · [Y] In PR · [Z] In Progress · [W] Open · [V] Partial

Step 6 — If any items are Open or Partial, ask:
"Would you like to address any of these now?"
