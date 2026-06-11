Check the status of today's tasks and the Week 7 tidy list.

Step 1 — Establish context:

- Run: date

- Read the active phase file from private/ (whichever of

  [phase-1-foundation.md](http://phase-1-foundation.md), [phase-2-build.md](http://phase-2-build.md), or [phase-3-articulate.md](http://phase-3-articulate.md)

  is not yet marked complete)

- Identify today's task list from the current day's entry

- Read private/[phase-3-articulate.md](http://phase-3-articulate.md) and locate all T0X tidy list items

Step 2 — Run status checks:

- Run: gh pr list --state open --json number,title,headRefName
- For T0X tidy items: match by looking for the identifier (e.g. T14)
  explicitly in the PR title or branch name
- For today's tasks: match by branch name or codebase presence

Step 3 — Assign a status to each item:

- Done — merged to main

- In PR — appears in an open PR (note the PR number)

- In Progress — branch exists, no PR yet (note the branch name)

- Partial — partially addressed

- Open — not started

Step 4 — Output in this format:

**Today's tasks — [Week X Day Y]**

| ID  | Task | Status | Notes |

|-----|------|--------|-------|

| D01 | ...  | ...    | ...   |

**Week 7 tidy list**

| ID  | Item | Status | Notes |

|-----|------|--------|-------|

| T01 | ...  | ...    | ...   |

**Summary**

Today: [X] Done · [Y] In PR · [Z] Open

Tidy list: [X] Done · [Y] In PR · [Z] Open · [W] Partial

Step 5 — If any today's tasks or tidy items are Open or Partial, ask:

"Would you like to address any of these now?"

