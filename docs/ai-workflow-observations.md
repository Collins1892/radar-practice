# AI workflow observations

Practical lessons from building and maintaining this project with AI coding
agents — Claude Code (terminal) and Cursor (IDE), with Context7 MCP for live
library documentation. Relocated from the README so the README can stay a
concise overview; this is the longer-form narrative behind it.

For loop-by-loop tuning notes see [ai-observations.md](ai-observations.md); for
workflow friction entries see [workflow-friction.md](workflow-friction.md).

## What agents do well

- Rapid scaffolding of boilerplate — API, tests, and frontend setup in minutes rather than hours.
- Fixing environment issues autonomously (locked binaries, path mangling, CORS).
- Making sensible architectural choices when given clear, focused prompts (typed API layer, runtime type guards, NSubstitute for mocking).
- Explaining non-obvious decisions when asked.

## Where agents hit limits

- Overly long prompts that ask for too much at once (e.g. several tests in one go) cause stalls; one focused task per prompt works reliably.
- Early code before the DI/repository refactor included shortcuts the agent itself later acknowledged as hacks.
- Agents should not be left unsupervised on unfamiliar or high-stakes codebases without review.

## Cursor vs Claude Code

- **Cursor** excels when full workspace context matters — wiring the frontend to the backend, adding typed error handling, and verifying changes in-editor.
- **Claude Code** suits terminal-driven workflows — generating projects, running tests, and iterating on backend logic with explicit accept/reject control.
- Both benefit from the same discipline: small prompts, verify output, read the diff before committing.

## Two independent reviews catch different things

- Claude Code `/review` and Cursor review consistently flag different issues on the same diff. Running both for significant PRs is a firm discipline — neither alone is complete.
- On a large migration PR, the automated review loop shows diminishing returns — later rounds re-surface findings already deferred or already confirmed correct. The fix is a stopping rule: once two independent reviewers converge on suggestion-tier-only findings, the bot's next pass is the final gate, not another round of manual fixes.

## Skills as variance reduction (`.claude/skills/`)

- Seven repo-level skills: `dotnet-test-writer`, `react-test-writer`, `playwright-test-writer`, `code-reviewer`, `wcag`, `component-builder`, `modernisation`.
- Test-writer skills are built *after* real code exists — the agent reads real patterns before writing. Build-guide skills (e.g. `wcag`, `component-builder`) are more valuable built *before* feature work, to prevent retrofitting.
- Skills drive consistent output across sessions and developers — the direct fix for the reusable-patterns problem.
- All skills include effort calibration — **think hard** for complex work (multi-file diffs, a11y-heavy UI, journey tests); standard effort for pattern-following tasks.
- Formal evals confirmed the delta is test quality and convention consistency, not just pass rate: skill-equipped agents refused duplicate tests, used higher-priority RTL queries, and caught cross-stack issues that no-skill agents missed. The real measure is variance reduction — skills narrow the agent's output toward convention-consistent, high-quality results.

## WCAG 2.2 AA — layered accessibility

- Accessibility was built in four layers: component primitives, screen composition, app shell, and interaction patterns.
- The `wcag` skill drives systematic audits — one component or screen at a time, findings-only report, then targeted fix prompts.
- Building the `wcag` skill before screen-level work would have been more efficient — components would have been built correctly from the start rather than retrofitted.
- WCAG at screen and shell level is substantially more work than component-level fixes. Budget accordingly.

## Legacy migration — reference for *what*, never *how*

- Legacy code being migrated informs what a feature does (fields, validation, behaviour) — never how the new code is structured. The structural template is always the most recent correctly-built equivalent module already in the repo — Incidents or Audits, not Items. Mapping legacy control flow onto new code 1:1 reproduces the legacy smell the migration exists to fix.
- Reusable component reuse has to be provable, not assumed. A migration prompt needs a hard constraint mapping every UI need to an existing shared component, plus a self-check requiring the agent to justify any new component file it creates.

## Radix / shadcn testing gotchas

These now live in the skills that need them — `react-test-writer` and
`component-builder` (and `wcag` for the accessibility angle). Summary, for
reference:

- Radix `Select` requires `Element.prototype.scrollIntoView = vi.fn()` in jsdom tests (now global in `client/src/test/setup.ts`).
- Any component using `Link`, `NavLink`, or `useNavigate` must be wrapped in `MemoryRouter` in tests.
- Use `format(date, 'yyyy-MM-dd')` (local date) not UTC getters — affects users in UTC+ timezones.
- Radix `Dialog` overlay has no ARIA role and is portaled; locate it via `document.querySelector('div[data-state="open"]:not([role="dialog"])')`, and dismiss with `userEvent.click(overlay)` (Radix Dialog 1.1.17+ defers outside-dismiss until a full click).

## Safety habits (especially for healthcare work)

- Never paste identifiable patient data into prompts — anything in a prompt leaves your environment via the API.
- Strip names, IDs, and NHS numbers from stack traces and snippets before sharing with an agent.
- Use synthetic test data rather than real records.
- Treat code review as a safety layer: does it do what you asked, does it do anything extra, and can you explain every changed line?
