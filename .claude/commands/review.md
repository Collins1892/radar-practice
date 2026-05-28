---
description: Review exactly one file or diff using the project code-reviewer skill. Produces structured findings with Blocker/Major/Minor/Suggestion severity levels, positive notes, and closes with "I have not made any code changes."
---

You MUST follow the output format below exactly. Do not use any other review format.

Load and follow `.claude/skills/code-reviewer/SKILL.md` exactly.

1. Confirm scope — one file path or one diff. Ask once if ambiguous.
2. Classify path — ItemsApi* applies backend rules, client/ applies frontend rules, other paths apply universal rules.
3. Read CLAUDE.md if not already in context.
4. Produce findings using this exact format. Each finding MUST use exactly this structure — no summarising, no prose findings:

## Review: <filename or "diff">

### Summary
<1–2 sentences: overall risk / merge readiness>

### Findings

#### [Blocker|Major|Minor|Suggestion] — <short title>
- **Where:** line N
- **Rule:** <Universal|Backend|Frontend> — <rule name>
- **Issue:** ...
- **Suggested fix:** ...

### Positive notes
<what is done well>

**I have not made any code changes.**
