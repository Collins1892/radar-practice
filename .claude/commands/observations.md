---
description: Log a workflow friction observation — interactive Q&A appended to docs/workflow-friction.md.
---
Log a workflow friction observation.

Capture anything that broke flow, required re-prompting, took longer
than expected, or wasn't prevented by CLAUDE.md or a skill.

Step 1 — Establish the current date and week position:
- Run: date
- Compare the date to the programme phase ranges:
  - Phase 1 (phase-1-foundation.md): May 18 – May 30
  - Phase 2 (phase-2-build.md): Jun 2 – Jun 20
  - Phase 3 (phase-3-articulate.md): Jun 23 – Jul 4
- Determine the current Week X Day Y
- If uncertain, ask the developer before continuing

Step 2 — Ask the following questions one at a time, waiting for each
answer before proceeding:

1. In one sentence, what happened?
2. Which tool was involved? (Claude Code / Cursor / GitHub Actions / other)
3. Was a skill active? If so, which one?
4. Why did this break flow — time cost, re-prompting loop, or workaround
   needed?
5. Rough time cost in minutes?
6. Which category best fits?
   - Context gap (CLAUDE.md or skill didn't cover it)
   - Scope overrun (agent did more than asked)
   - Re-prompting loop (needed multiple corrections)
   - Tool limitation (the tool couldn't do what was needed)
   - Convention drift (inconsistent output across sessions)
   - Unexpected output (agent produced something wrong or surprising)
7. What would prevent this next time? (CLAUDE.md update / skill update /
   process change / new command / accept it)
8. Is there an open action? If yes, what?

Step 3 — Once all answers are collected, append to docs/workflow-friction.md
in this format:

## [Week X Day Y] — [one-line summary]
- **Category:** [category]
- **Tool:** [tool]
- **Skill active:** [skill or none]
- **What happened:** [description]
- **Why it broke flow:** [description]
- **Time cost:** [estimate]
- **Fix or lesson:** [what would prevent this]
- **Open action:** [action or none]
- **Status:** Open / Resolved

Step 4 — If docs/workflow-friction.md does not exist, create it with
this header first, then append the entry:

# Workflow Friction Log

A running log of workflow friction — anything that broke flow, required
re-prompting, took longer than expected, or wasn't prevented by CLAUDE.md
or a skill file. Feeds into the Week 6 AI impact story.
