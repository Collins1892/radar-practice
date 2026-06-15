# Workflow Friction Log

A running log of workflow friction — anything that broke flow, required
re-prompting, took longer than expected, or wasn't prevented by CLAUDE.md
or a skill file. Feeds into the Week 6 AI impact story.

## [Week 5 Day 1] — Loop ran full CI suite on a markdown-only change
- **Tool:** Claude Code
- **Skill active:** None — loop pattern running directly from docs/loop-pattern.md
- **What happened:** The implement-test-review loop ran the full CI test suite (three suites) on a documentation-only diff, with no value added on a markdown-only change.
- **Why it broke flow:** Time cost — three test suites ran unnecessarily, adding wait time with no value on a documentation-only change.
- **Time cost:** ~3 minutes
- **Category:** Tool limitation — the loop pattern has no change-type check to skip tests on markdown-only diffs
- **Fix or lesson:** Loop pattern update — add a change-type check at the start of the loop; if the diff touches only `.md` files, skip the test suite and go straight to the review pass.
- **Open action:** None — resolved Week 5 Day 1: added the pre-flight change-type check to docs/loop-pattern.md (§3 sequence + §9 prompt snippets) and marked the action resolved in docs/ai-observations.md.
- **Status:** Resolved (Week 5 Day 1)
