Log a workflow friction observation.

You are helping log a workflow friction observation to [ai-observations.md](http://ai-observations.md).

Ask the developer the following questions one at a time, waiting for each answer before proceeding:

1. In one sentence, what happened?
2. Which tool was involved? (Claude Code / Cursor / GitHub Actions / other)
3. Was a skill active? If so, which one?
4. Why did this break flow — time cost, re-prompting loop, or workaround needed?
5. Rough time cost in minutes?
6. Which category best fits?
  - Context gap ([CLAUDE.md](http://CLAUDE.md) or skill didn't cover it)
  - Scope overrun (agent did more than asked)
  - Re-prompting loop (needed multiple corrections)
  - Tool limitation (the tool couldn't do what was needed)
  - Convention drift (inconsistent output across sessions)
  - Unexpected output (agent produced something wrong or surprising)
7. What would prevent this next time? ([CLAUDE.md](http://CLAUDE.md) update / skill update / process change / new command / accept it)
8. Is there an open action? If yes, what?

Once all answers are collected, append to [ai-observations.md](http://ai-observations.md) in this format:

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

If [ai-observations.md](http://ai-observations.md) does not exist, create it with this header first:

# AI Workflow Observations

A running log of workflow friction — anything that broke flow, required re-prompting, took longer than expected, or wasn't prevented by [CLAUDE.md](http://CLAUDE.md) or a skill file. Feeds into the Week 6 AI impact story.