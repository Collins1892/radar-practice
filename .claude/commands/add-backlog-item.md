---
description: Add a new task to docs/nightly-agent-backlog.md — interactive Q&A, one question at a time.
---
Add a new task to the nightly agent backlog.

Step 1 — Determine the next task ID:
- Read docs/nightly-agent-backlog.md and docs/nightly-agent-completed.md.
- Extract every ID matching T\d+ from both markdown tables.
- Take the numeric maximum across both files, add 1, and format as T
  plus a zero-padded number (T01–T09 use two digits; T10 and above use
  as many digits as needed).
- Tell the user: "The new task will be assigned ID **[ID]**."

Step 2 — Ask the following questions one at a time, waiting for each
answer before proceeding. Re-prompt only the current question if the
answer is invalid. Do not include real names, patient data, or
credentials in description or notes.

1. Difficulty — easy, medium, or hard?
   Valid values: easy, medium, hard
2. Stack — backend, docs, frontend, or infra?
   Valid values: backend, docs, frontend, infra
3. Category — a11y, code-quality, docs, nightly-agent, or pr-review?
   Valid values: a11y, code-quality, docs, nightly-agent, pr-review
4. Description — one sentence describing the task.
   Reject empty answers after trimming.
5. Notes — any additional context? (press enter to skip)
   Empty is allowed.

Step 3 — Resolve today's date:
- Run: date
- Format Created as YYYY-MM-DD.
- Leave Updated empty.

Step 4 — Build the new row with these fixed values:

| Column      | Value                              |
|-------------|------------------------------------|
| ID          | auto-computed from Step 1          |
| Status      | open                               |
| Difficulty  | from answer 1                      |
| Stack       | from answer 2                      |
| Category    | from answer 3                      |
| Attempts    | 0                                  |
| PRNumber    | empty                              |
| Created     | today's date (YYYY-MM-DD)          |
| Updated     | empty                              |
| Description | from answer 4                      |
| Notes       | from answer 5 (may be empty)       |

The nightly agent parser (parseBacklogRow in .github/scripts/nightly-agent.js)
expects exactly 11 pipe-delimited cells; whitespace inside cells is trimmed
on read.

Step 5 — Format and append to docs/nightly-agent-backlog.md:
- Modify only docs/nightly-agent-backlog.md. Do not change, delete, or
  reformat any existing rows.
- Do not commit or push unless explicitly asked.
- Locate the backlog markdown table (header row starting with | ID  |).
- Parse the header row and every existing data row (lines starting with |).
- For each of the 11 columns, compute max(cell.trim().length) across the
  header and all existing data rows (same idea as computeColumnWidths in
  .github/scripts/nightly-agent.js).
- Format the new row as | cell | cell | ... | with each cell space-padded
  on the right to that column's max width, matching the visual alignment of
  neighbouring rows.
- If Description or Notes content exceeds the current column max width,
  use the longer content length for that column when padding the new row.
- Append the new row after the last existing data row in the table.
- Do not reorder rows or rewrite the table header or separator.

Step 6 — Confirm to the user:

Added **[ID]** to docs/nightly-agent-backlog.md:

[full new row exactly as written to the file]
