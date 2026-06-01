## Day 11 — 1 June 2026

### Summary

First day of Week 3. New week, new chat, Claude Project cold start tested and
passed — no context overhead, straight into productive work. Three PRs raised,
reviewed, iterated, and merged. shadcn/ui setup took longer than the 1h estimate
due to environment friction. End-of-day documentation block was heavier than
expected with a full stack change day. Strong foundation laid for the rest of
the week.

### Code review findings

- No open PRs at start of day — clean repo after merging Week 2 work
- `/review` skipped — shell not returning output in Claude Code. Clean repo,
  no diff to review. Documented as acceptable when repo is known clean

### Claude Project — cold start

- New week, new chat — RAG handled all background context automatically
- Picked up immediately with full awareness of plan, stack, decisions, and relationships
- No context pasting, no handover overhead — strongest evidence yet the approach is right
- Cold start discipline confirmed: project is ready for a new developer to pick up

### shadcn/ui and Tailwind v4 setup (Item 1)

- Decision confirmed: shadcn + Tailwind v4. Real decision was "are we adopting
  Tailwind" — shadcn follows from that. Radix primitives handle WCAG heavy lifting
- Ran `npx shadcn@latest init` from the repo root instead of `client/` — created
  a nested `radar-practice/` folder inside the repo. Lesson: always verify working
  directory before running CLI tools
- Config files lost in lint-staged CRLF revert — `vite.config.ts`, `tsconfig.json`,
  `tsconfig.app.json`, `src/index.css`, `package.json` all wiped from the commit.
  Had to re-apply all four manually. Lesson: after any lint-staged failure, run
  `git show HEAD --stat` to verify what actually landed before pushing
- ESLint pre-commit failures on shadcn-generated files — fixed by excluding
  `src/components/ui/**` and `src/lib/utils.ts` from linting. Vendor-generated
  files should not be held to project lint conventions
- `--no-warn-ignored` flag needed in lint-staged to suppress `--max-warnings 0`
  failure on ignored files. Not disabling a rule — suppressing a noise message
- `radix-ui` umbrella package vs `@radix-ui/react-slot` individual package —
  shadcn 4.9.0 imports from the umbrella. Only the individual package was installed.
  TypeScript would have failed in CI without the fix
- shadcn theme tokens missing from `index.css` — lost in the lint-staged revert.
  Added manually using OKLCH Nova preset values
- Duplicate CSS variable conflict — `--border`, `--accent`, `--muted` existed in
  both the shadcn token block and original project CSS. Renamed original vars to
  `--app-border`, `--app-accent`, `--app-muted` and updated all usages across
  `App.css` and `ItemsList.css`

### Responsive rules and WCAG principles (Item 2)

- Responsive rules drafted in chat and applied to CLAUDE.md — mobile-first,
  three breakpoints (none/md/lg), container, grid, table overflow, form conventions
- WCAG 2.1 AA principles documented — semantic HTML, form labels, colour contrast,
  focus rings, motion, touch targets
- Mobile accessibility section added specifically — Google mobile usability signals,
  viewport meta, 16px minimum font size, touch target spacing, no zoom disabling
- `.cursorrules` task deferred — modern Cursor convention is `.cursor/rules/project.mdc`.
  Moved to end of day after CLAUDE.md is updated so the file reflects the final stack

### SQLite + EF Core persistence (Item 3)

- `AppDbContext` in `Data/` — shared context for all modules. `DbSet<Item>` now,
  `DbSet<Incident>` follows later this week. One context, one database, no refactoring needed
  when incidents land
- `EfItemsRepository` implements `IItemsRepository` — interface unchanged, endpoints
  untouched, scoped lifetime with `AsNoTracking()` reads
- Database starts empty — seed data was a development convenience, not a requirement.
  EmptyState component handles the empty list view
- `Price` stored as TEXT via `HasConversion<string>()` — exact decimal precision.
  `REAL` silences the EF warning but loses precision. SQLite TEXT sorts
  lexicographically so avoid DB-side price ordering — sort in memory instead
- `TestWebApplicationFactory` — per-class isolated in-memory SQLite DB. Data
  persists within a class fixture, not across classes. Schema applied via
  `Database.Migrate()`
- Migration churn: three migrations landed in quick succession. Squashed to a
  single clean `InitialCreate` with `Price TEXT` from the start — unreleased
  schema, free operation

### Two independent reviews caught a real precision bug

- Both Cursor and Claude Code Opus 4.8 independently flagged `Price` as `REAL`
  as a [Major] finding
- Round-trip test gave false confidence — `Add()` returns the in-memory tracked
  entity, not a DB re-read. POST response price is never lossy. `9.99m` surviving
  was coincidence, not proof
- Fixed to `HasConversion<string>()` and strengthened test to use `0.1m + 0.2m`
  asserting `0.3m` — a value that fails under IEEE-754 double, proving TEXT
  conversion is genuinely lossless
- Two independent reviewers agreeing on a finding is a strong signal. Trust it
- Key "what the AI gets wrong" observation: agent suggested `HasColumnType("REAL")`
  to silence the EF decimal warning without flagging the precision trade-off.
  The warning exists for a reason

### Skill reviews

- `dotnet-test-writer` — updated for `TestWebApplicationFactory`, EF Core patterns,
  corrected `CreateDefaultClient()` guidance (now valid for persistence tests, not
  just validation errors), new SQLite isolation gotchas
- `code-reviewer` — updated for Tailwind v4, shadcn/ui, Radix, EF Core rules,
  vendor file exemption for `src/components/ui/**`
- Both skills' version tables updated to reflect full new stack

### End-of-day documentation — heavier than expected

- Full stack change day means full documentation pass — CLAUDE.md, README.md,
  both skills, seven-week-plan decisions log, and `.cursor/rules/project.mdc`
- Lesson: documentation volume scales with stack change volume. On a day that
  adds Tailwind, shadcn, EF Core, and SQLite, budget extra time at close of day
- Task reordering cost time — `.cursorrules` was on the morning list, deferred
  to end of day once the modern `.cursor/rules/` convention was identified.
  Deferring was correct but added a late context switch
- Four decisions log entries added to seven-week-plan.md — shadcn adoption,
  AppDbContext shared context, precision bug catch, `.cursor/rules/` convention
- README corrected — test count 12 → 13, in-memory references removed,
  architecture table updated for EF Core
- CLAUDE.md line 124 corrected — `WebApplicationFactory` → `TestWebApplicationFactory`
  in the testing approach section. Last pre-existing stale reference resolved

### .cursor/rules/project.mdc

- Created at end of day after CLAUDE.md was finalised — correct order
- `alwaysApply: true` — loads every Cursor session like CLAUDE.md
- Condensed version of CLAUDE.md: same rules, ~80 lines vs 236
- Modern format `.cursor/rules/` over deprecated `.cursorrules`

### What I would not trust the agent to do unsupervised

- Run `npx` CLI tools without confirming the working directory — wrong directory
  cost significant time today
- Commit after a lint-staged failure without checking `git show HEAD --stat` —
  config files can silently disappear from the commit
- Choose `HasColumnType("REAL")` for decimal without flagging the precision
  trade-off — the warning exists for a reason

### Ideas and observations

- 55 tests (13 xUnit, 42 Vitest), 3 PRs, full stack addition, two skill updates,
  documentation pass, and `.cursor/rules/` created — all in one day. Week 3 is
  moving
- Two independent reviews (different models, different tools, different sessions)
  agreeing on a finding = strong signal. Run both when the change matters
- The precision bug story is Week 6 material — the AI suggested a fix that
  silenced a warning by trading away correctness, the tests passed, and only
  independent review caught it
- Documentation load at end of a big stack change day is a planning observation
  for future weeks — factor it into the estimate
  
## Day 10 — 29 May 2026

### Summary

Last day of Week 2. Full day using the Claude Project for the first time 
— no context-pasting overhead, straight into productive work. Session 
tokens held up well throughout the day.

### Code review findings

- No open PRs at start of day — clean repo after Week 2
- /review discipline broke on first PR — Cursor review substituted, documented as valid alternative

### xUnit deep dive

- Walked through all 12 existing tests with the agent in Ask mode
- Deleted empty UnitTest1 scaffold — noise with no coverage value
- Closed two high-value gaps: 500 response body assertions on GET and POST
- Added Content-Type assertion and DoesNotContain for leaked exception messages
- AAA comments now consistent across all 12 tests
- Branching discipline failure caught — committed to main before creating branch. Reset and rebuilt correctly.
- `/review` before merge discipline broke on first PR — Cursor review was done but Claude Code step skipped. Documented as distinction: Cursor review is a valid substitute when changes have already been through structured review

### Vitest setup

- Installed Vitest 4.1.7, @testing-library/react, @testing-library/jest-dom, jsdom
- Context7 fetched live Vitest docs and caught Windows forks pool timeout — fixed with `pool: 'threads'` in vite.config.ts
- First test: ItemsList loading state
- All four ItemsList states covered: loading, error, empty, ready
- Edge case: status="error" with errorMessage={null} falls through to empty list — documented by test
- renderItemsList helper extracted to remove boilerplate
- afterEach(cleanup) added to setup.ts — fixed DOM pollution between tests
- within(container) was a workaround; screen queries correct once cleanup in place

### App integration tests

- 8 tests covering all main App flows
- vi.mock('./api') at module level, mockReset in beforeEach
- findBy* for async assertions after mount
- toUserMessage network message asserted — not just alert visibility
- type="number" inputs return null when empty in jsdom, not '' — real testing gotcha
- Mock isolation: vi.mockReset() preferred over vi.clearAllMocks() — resets implementations not just call history

### guards.ts unit tests

- 20 tests covering isRecord, isItem, isItemArray, isApiErrorBody
- JavaScript edge cases documented: NaN as number, arrays as objects, extra properties
- isItem/isRecord array interaction documented
- Pure unit tests — no RTL, no vi.mock

### errors.ts unit tests

- 9 tests covering ApiClientError constructor and all toUserMessage branches
- SERVER_UNREACHABLE_MSG constant to avoid string duplication
- Context independence documented — network errors ignore context
- All branches covered including unknown load/create fallbacks

### Documentation discipline established

- After every significant PR: review README, CLAUDE.md, code-reviewer skill
- One fix at a time in Agent mode
- Caught real issues every time — stale counts, missing paths, incorrect guidance
- client/README.md replaced — Vite boilerplate removed, project-specific content

### Claude Project — first full day

- RAG approach working — no context overhead, full day productive
- Pain points to watch: does daily structure run cleanly from cold start?
- Project description updated with working conventions
- CLAUDE.md and README.md added to Project knowledge
- Sunday regeneration ritual simplified — Project handles context, Sunday is planning

### Cursor modes

- Ask — exploration, read-only, no file changes
- Plan — non-trivial tasks, see plan before approving
- Agent — active coding, multi-file changes
- Debug — errors and failures
- Factor right mode into task planning each week

### Private folder updates

- seven-week-plan.md updated — Week 2 complete, Week 3 reordered, new decisions
- pr-workflow.md created — team-adoptable agentic PR workflow
- original-plan.md — historical, no changes needed

### Seven-week plan updates

- Week 2 marked complete
- Sunday regeneration simplified
- Model updated to Opus 4.8
- Week 3 reordered: responsive rules → WCAG principles → SQLite → component library → incident module → skills → tests → Playwright → WCAG pass
- Reusable component library as named Week 3 deliverable
- WCAG skill added to Week 3
- Evals added to Week 4
- AI impact story framing captured

### What I would not trust the agent to do unsupervised

- Run /review without the custom command — built-in behaviour overrides the skill
- Merge without running /review — discipline broke on first PR of the day
- Chain git commands — individual commands only, each step intentional

### Ideas and observations

- Only 10 working days in — 54 tests, CI pipeline, custom skills, structured PR workflow, CLAUDE.md driving agent behaviour. The acceleration is the story for Week 6.
- pr-workflow.md is proposable as a Radar team standard from day one
- AI evals identified as a gap — added to Week 4
- Week 3 is ambitious at ~34 hours — if pressure builds, slip from the bottom not the top

## Day 9 — 28 May 2026

### Code review findings

- `/review` command now working correctly with code-reviewer skill
- HIPAA jurisdiction error caught by `/review` — HIPAA applies to US
  operations only, not Middle East
- Duplicate "never expose stack traces" rule caught and merged
- Redundant step 5 in review.md caught and removed
- Running `/review <PR number>` before merging is now part of the workflow
- Automated PR review via GitHub Actions planned for Week 5

### GDPR and AI session

- GDPR principles for AI development: lawfulness, data minimisation,
  privacy by design
- Prompt hygiene is the practical control — strip everything not needed
  to solve the technical problem before sending to an agent
- HIPAA adds PHI-specific technical safeguards — encryption at rest
  and in transit, audit logs, minimum necessary access
- HIPAA training is a personal strength relevant to Radar's US expansion
- GDPR and HIPAA section added to CLAUDE.md — legal framework behind
  the existing no-PII rules now explicit
- Key addition: HIPAA applies to US operations only — Middle East
  jurisdictions have their own requirements

### Program.cs — error handling fixes

- Redundant per-endpoint try/catch blocks removed — global exception
  handler already covers unhandled exceptions
- `Results.Created((string?)null, item)` — fixed RFC 9110 violation,
  Location header was pointing to non-existent `/items/{id}` endpoint
- `(string?)null` cast required to resolve C# overload ambiguity
- CLAUDE.md C# convention updated — global exception handler is the
  pattern, do not add per-endpoint try/catch
- 13/13 tests passing after changes

### Custom /review command

- Created `.claude/commands/review.md` — custom command that loads
  the code-reviewer skill and enforces the structured findings template
- Fixes the issue where `/review` used built-in behaviour instead of
  the skill
- Output now follows exact template: Blocker/Major/Minor/Suggestion
  severity levels, Where/Rule/Issue/Suggested fix structure, closes
  with "I have not made any code changes."
- `/review <PR number>` before merging is now the workflow
- Automated version planned for Week 5 via GitHub Actions

### Claude Project setup

- Project created: "Radar Practice — Agentic Learning"
- Files: `seven-week-plan.md`, `jd.md`, `cv.md`, `learning-notes.md`,
  `cto-emails.md`
- RAG verified — correctly reads context from attached files
- From Day 10 onwards, daily sessions run inside the Project
- End of day pattern: notes PR merged, update Project files, verify,
  delete chat

### .claude folder — capabilities noted

- `.claude/commands/` — custom slash commands, Week 4 plan item
- `.claude/rules/` — always-on instructions, not needed yet
- `.claude/settings.json` — repo-level settings, not needed yet
- `.cursorrules` — Cursor equivalent of CLAUDE.md, deferred to Week 3

### GitHub CLI authenticated

- `gh auth login` required after install — Claude Code uses gh for
  PR status in `/review`
- Verify with `gh auth status`

### What I would not trust the agent to do unsupervised

- Follow the /review template without a custom command — built-in
  behaviour overrides the skill without explicit instruction
- Get HIPAA jurisdiction right without a legal prompt — assumed HIPAA
  applied to Middle East, it does not

### Ideas and observations

- `/review before merge` is a discipline that catches real issues —
  three findings in today's PRs that improved the codebase
- Automated PR review via GitHub Actions + Anthropic API is a natural
  Week 5 task alongside the daily digest
- Claude Project RAG is significantly more token-efficient than long
  chat sessions — confirmed by today's usage patterns

## Day 8 — 27 May 2026

### Code review findings

- No code issues on main — clean start to the day
- `/review` slash command in Claude Code runs structured review automatically
- First real use of `/review` caught two issues in CLAUDE.md PR: missing
  trailing newline and under-specified version discipline scope in skill files
- Both fixed in a follow-up PR same day — AI review more consistent than
  manual eyeballing
- Daily `/review` added to the daily structure going forward
- Note for tomorrow: verify code-reviewer skill triggers correctly on
  first `/review` run — confirm output follows structured findings template

### PR #7 — Context7 README badge finally merged

- CI not triggering across two days and multiple pushes on the original branch
- Root cause: accumulated messy commits from trigger attempts made the branch
  unclean
- Fix: close PR, fresh branch, single clean commit — CI triggered immediately
- Lesson: when CI is not triggering, start with a clean single-commit branch
  before debugging infrastructure

### CLAUDE.md updated — two PRs

- Duplicate Tooling section removed
- Version discipline added — versions must stay in sync with package.json,
  .csproj, and affected skill files including description frontmatter and
  code examples
- Idiomatic React migration rule added — never translate AngularJS patterns
  directly to React, rewrite using hooks and component composition. Based on
  real production experience at Radar where ModelCode.IO produced working
  but wrong-pattern code shipped past deadline
- Skills folder added to repo layout and agent guidance
- Context7 MCP added to AI tools list
- Trailing newline and version discipline scope fixed in follow-up PR

### dotnet-test-writer skill — rebuilt and shipped to repo

- Rebuilt from scratch with Python 3.14.5 installed and Context7 MCP active
- Saved directly to `.claude/skills/dotnet-test-writer/SKILL.md` in the repo
- Context7 fetched live xUnit and NSubstitute docs before writing
- Four new integration tests generated using the skill — all passing
- Skill self-corrected after a real failure: shared-state warning for
  `CreateDefaultClient` added to SKILL.md after `Get_NoItems` test failed
  due to seeded repository data from other tests
- Final test count: 13/13 passing

### code-reviewer skill — built and shipped to repo

- Created at `.claude/skills/code-reviewer/SKILL.md`
- Full-stack — three sections: universal rules, backend rules, frontend rules
- Review-only — never edits files, one file or diff at a time
- Uses Context7 for uncertain library or WCAG guidance
- Structured findings output: Blocker, Major, Minor, Suggestion severity levels
- Includes Mermaid review flow diagram — renders on GitHub
- Built manually in Cursor using dotnet-test-writer as a template — no skill
  creator needed for a documentation-only skill
- Self-reviewed before committing — two issues caught and fixed

### GET /items 500 test — relocated and fixed

- `Get_WhenRepositoryThrows_Returns500` already existed in PostItemsTests.cs
  — wrong file, missing Arrange/Act/Assert comments
- Plan mode in Cursor caught this before writing any new code
- Test relocated to GetItemsTests.cs with proper A/A/A comments
- Duplicate removed from PostItemsTests.cs — coverage unchanged
- 13/13 tests still passing
- First real Plan mode use in Cursor — worked identically to Claude Code

### Context7 MCP — fixed in Cursor

- Cursor MCP config file was empty — caused JSON syntax error
- Fixed by adding correct mcpServers config with npx command
- Context7 now active in both Claude Code and Cursor

### GitHub CLI installed

- `gh` CLI installed — `gh version 2.92.0`
- Future Cursor sessions can create PRs without leaving the editor

### Usage limit observations

- Two session lockouts in two days — all surfaces share the same limit
- Chat and Claude Code compete for the same Pro quota
- Fix: Sonnet for all working chat sessions, Opus for Sunday regeneration
- Check `claude.ai/settings/usage` at start of each session
- 5-hour rolling window starts when first message is sent
- Weekly limit: resets Sunday 8:00 PM — 36% used at end of Day 8
- Claude Project from Week 3 will significantly reduce token consumption
  via RAG — no more pasting context into every session

### Tool selection going forward

- Cursor for coding tasks Monday to Wednesday — separate token budget
- Claude Code reserved for Thursday and Friday — skill creator, Plan mode,
  heavier agentic sessions
- Exception: Plan mode in Cursor works well for focused coding tasks

### What I would not trust the agent to do unsupervised

- Start a skill creator task without confirming output location first —
  defaults to `~/.claude/` not the repo, wasted work if not redirected
- Use `CreateDefaultClient()` for tests asserting on data shape — shared
  repository singleton causes order-dependent failures

### Time saved today

- CLAUDE.md structured review caught two real issues before they caused
  agent confusion in future sessions
- dotnet-test-writer skill generated four passing tests and self-corrected
  — manually writing with correct conventions would have taken an hour
- Plan mode in Cursor caught a misplaced duplicate test before writing
  any new code — saved writing a duplicate and debugging the confusion
- Private notes rebuilt comprehensively — single source of truth for
  strategic context saves significant context-setting time every session

### Ideas and observations

- Claude Project with RAG is the right architecture for Week 3 onwards
- Weekly `week-N-summary.md` files as Project knowledge — efficient
  growing record without full notes file token cost
- Mermaid diagrams in skill files render on GitHub — good portfolio signal
- Morning standup structure transfers directly to team standup at Radar
- ModelCode.IO failure at Radar (working but wrong patterns, inferior
  visual quality, shipped past deadline) is a concrete AI impact story
  for Week 6 — know what good looks like and where AI fell short
- Two lockouts and CI trigger issue this week are stronger portfolio
  stories than a smooth week — real experience, real lessons, real
  discipline put in place to prevent recurrence

## Day 7 — 26 May 2026

### Code review findings

- No significant code changes today — process, tooling, and planning day
- Repo clean — 0 open PRs, 25 commits, CI green on main
- README solid — reads clearly as a learning project with intent

### Seven-week plan consolidated

- Original plan recovered from screenshots and transcribed
- Drift analysis completed — original vs current trajectory
- Weeks 3–5 have re-themed significantly — build happened early
- Phase 3 intent unchanged — articulate impact, demonstrate to director of engineering
- WCAG reclaimed from original plan into Week 3 — accessibility is non-optional in healthcare
- Weekly outcome statements added — the question at end of each week is did I deliver the outcome, not did I finish the tasks
- Model selection guidance added to `private/seven-week-plan.md` — Sonnet for pattern work, Opus for novel reasoning and synthesis

### Private folder convention established

- Three-tier file model for agentic projects:
  - Public, committed — README, CLAUDE.md, code. The demonstration.
  - Private, on disk — plans, scratch notes, raw observations. `.gitignore`d but agent-readable. Lives in `private/`
  - Outside the repo — anything sensitive or unrelated
- The middle tier is the one most workflows skip — most valuable for agent-augmented work
- `private/seven-week-plan.md` saved — agent-readable, never committed
- `.gitignore` updated via PR to enforce the convention

### File location should follow purpose

- Before deciding where something lives, ask: what is this file actually for?
- Continuity and discipline — `private/` on disk
- Demonstration — public, committed
- The location follows the purpose, not the other way around

### When to delegate to an agent vs do it yourself

- Useful test before reaching for an agent:
  - Is the work more than ~10 lines or files?
  - Would verification be non-trivial?
  - Is it repetitive or does it require synthesis across files?
- If no to all three — just do it yourself
- Editing a `.gitignore` entry is not an agent task — auditing `.gitignore` across five repos is
- Knowing the threshold is the skill

### Model selection discipline

- Default to Sonnet 4.6 for pattern-following work — code reviews, tests, mechanical tasks, notes
- Switch to Opus 4.7 for novel reasoning, synthesis, high-stakes articulation
- Decision rule: am I asking Claude to follow a pattern or reason about something novel?
- Opus-recommended moments: Wk 4 prompting deep-dive, Wk 5 modernisation refactor, Wk 6 AI impact story, Wk 7 portfolio polish, Plan mode plan-generation step
- Front-loading a comprehensive handover note on Opus burns quota fast — reserve for recovery or weekend regeneration sessions

### Weekend regeneration ritual

- Once per week on a weekend, start a fresh Opus session with `learning-notes.md`, `private/seven-week-plan.md`, and repo state
- Opus produces a comprehensive handover note for the coming week
- Full context, full depth, costs the weekend budget not the weekday budget

### Claude desktop app orientation

- Three surfaces: Chat, Cowork, Code
- Code surface has a Mode selector — Ask permissions, Accept edits, Plan mode, Auto mode
- Plan mode is in the Mode selector, not a slash command — `/plan` is not available in this environment
- Sonnet 4.6 is the default model in Code sessions — different from Chat which can default to Opus
- Model selector visible bottom right of Code surface — change per session as needed

### Slash commands in Claude Code

- Full list visible by typing `/` in the Code surface input
- Key commands for this project: `/review`, `/code-review`, `/security-review`, `/skill-creator`, `/init`, `/verify`, `/compact`, `/loop` (Week 4), `/remote-control` (Week 4)
- `/context7-mcp` confirmed in the list — Context7 installed correctly
- `/compact` useful for long sessions to free context without starting fresh
- `/loop` is the Ralph Loop pattern — noted for Week 4, not yet

### Context7 MCP setup

- Remote URL approach via desktop app Connectors UI failed with auth error
- Working method is the terminal wizard: `npx ctx7 setup`
- Installs at user level via `~/.claude.json` — available across all Claude Code sessions
- Connectors UI will not show it — expected, different config path
- `/context7-mcp` in slash command list confirms it is installed
- Usage: append `use context7` to any prompt to fetch live library docs
- To verify: confirm tools visible at session start and that a prompt with `use context7` fetches live docs

### Plan mode — first real use

- Task: add Context7 MCP badge and tooling note to README
- Agent read CLAUDE.md and README before producing the plan — no assumptions made
- Plan showed exact file, exact line, exact content before touching anything
- Approved the plan, agent executed — `+3 -0` diff, exactly as planned
- Sub-agent model selection: Haiku 4.5 used automatically for file exploration — intelligent token management
- Plan mode is the correct default for any non-trivial agent task

### Skills — personal vs team vs repo

- Skills in `~/.claude/skills/` are personal — machine only, not available to others
- Skills in `.claude/skills/` in the repo are team-level — available to any agent on the project
- CLAUDE.md is the current team-facing convention layer — skills folder makes it more structured
- `dotnet-test-writer` built today lives in `~/.claude/` — to be moved into `.claude/skills/` in the repo tomorrow
- `react-test-writer` skill to be built in Week 3 after Vitest is set up — build directly into `.claude/skills/` in the repo
- Repo should showcase the full agentic workflow — skills, evals, and benchmark results visible to anyone browsing

### dotnet-test-writer skill

- Built using `/skill-creator` slash command
- Skill explored existing test patterns before writing anything — matched actual conventions
- Benchmarked with 6 parallel agents — 3 with skill, 3 without (baseline)
- Results: WITH skill 100% pass rate, WITHOUT skill 83% pass rate, delta +17%
- Sole differentiator: Arrange/Act/Assert comments — skill enforces them every time, baseline never writes them
- Skill overhead: +777 tokens and +2 seconds per use — worth it for consistency
- Skill creator adapted to three obstacles without prompting: no Python, wrong directory structure, Write tool sandboxing
- Python 3.14.5 installed today — will improve future skill creator runs

### GitHub Actions CI issue

- PR #7 (Context7 README badge) triggered no CI runs across multiple pushes
- Workflow file correct, ruleset correct, Actions enabled, repo public — no config problem found
- GitHub Actions had 10 incidents in May 2026 — transient runner availability issue most likely cause
- PR left open overnight — will merge first thing Wednesday once CI triggers
- Lesson: CI issues on markdown-only PRs are frustrating but do not bypass branch protection

### Git observations

- `git branch -m old-name new-name` renames a local unpushed branch — free operation
- Auto-delete-on-merge means `git branch -d` is only needed if the local branch still exists after `git pull`
- Branch naming matters as documentation — `feature/gitignore-plan` is clearer than `feature/seven-week-plan` for a `.gitignore` change

### Ideas and observations

- Python on the machine reduces agentic token consumption — agents reach for Python for scripting tasks, without it they work harder
- Skills should be visible in the repo alongside CLAUDE.md — part of the portfolio story
- `react-test-writer` skill to build in Week 3 after Vitest setup — add to `.claude/skills/` in repo directly
- Move `dotnet-test-writer` into `.claude/skills/` in repo — first task Wednesday before code review
- Weekend task: regenerate and update handover note using Opus with full context

### Time saved today

- Seven-week plan consolidated and drift-analysed in under an hour — manually would have taken most of a morning
- Context7 MCP set up in minutes once correct method found — desktop UI approach wasted time, terminal wizard was the answer
- Plan mode README update: planned, executed, and verified in one approved flow — no back and forth
- dotnet-test-writer skill built and benchmarked with 6 parallel agents — manually writing and testing this skill would have taken hours

## Day 6 — 25 May 2026

### Code review findings

- No significant code changes today — process and configuration day
- Reviewed CLAUDE.md in depth — every section understood and justified
- Package versions confirmed from package.json and .csproj files
- TypeScript 6.0.2 is notably new — most projects are on 5.x
- Nullable and ImplicitUsings enabled in .NET project — modern C# defaults

### Prettier auto-fix

- Switched from `prettier --check` to `prettier --write` on staged files
- Auto-fix is better for developer experience — no blocked commits for formatting
- CI still uses `prettier --check` — correct, should fail if formatting wrong in pipeline
- `lint-staged.config.js` updated — runs `prettier --write` on all staged file types

### Branch protection and PR workflow

- Repo made public — rulesets only enforced on public repos on free GitHub plan
- `main-protection` ruleset created with:
  - Restrict deletions
  - Require pull request before merging
  - Require .NET Tests CI check to pass
  - Block force pushes
- React tests check to be added in week 3 when Vitest is in CI
- No bypass list — solo project, always go through PR process

### CLAUDE.md multi-repo observation

- CLAUDE.md is powerful but gets complex across multiple repos
- Conflicting conventions between teams is a real unsolved problem
- Different squads may have different styles — one CLAUDE.md cannot serve all
- Industry has not fully solved this yet
- Opportunity to propose a thoughtful approach when back at Radar

### What I would not trust the agent to do unsupervised

- Large refactors across multiple files without a clear goal
- Any changes near PII handling or data access
- Committing or pushing without explicit instruction
- Generating multiple tests in one prompt — stalls consistently

### Time saved today

- Branch protection and PR workflow set up in under an hour — manually researching and configuring this would have taken half a day
- CLAUDE.md written and filled in collaboratively — a standing brief that saves explaining context on every future session

### Ideas and observations

- PR workflow from phone works perfectly — GitHub Android app
- CLAUDE.md is a living document — will grow as the project grows
- Exact package versions in CLAUDE.md prevent agent making wrong version assumptions
- TypeScript 6.0.2 is very new — worth being explicit about
- Multi-repo CLAUDE.md complexity is an unsolved industry problem — opportunity to propose a thoughtful approach at Radar

## Day 5 — 23 May 2026

### Code review findings

- Assembly files were being tracked in git — fixed with .gitignore cleanup
- xUnit integration tests are more expensive than unit tests — deliberate balance needed at scale
- Testing pyramid: lots of unit tests, fewer integration, fewer e2e
- Agent defaulted to integration tests — correct for an API but does not scale without a unit test layer underneath

### GitHub Actions CI pipeline

- First time seeing GitHub Actions in practice
- Pipeline runs on every push to main — `dotnet test` on `ubuntu-latest`
- Green in 39 seconds — 9 tests passing in the cloud automatically
- CI badge live on GitHub README — visible proof of passing tests
- Every push now verified without manual intervention

### Pre-commit hooks

- Husky installed with lint-staged — only checks staged files, keeps it fast
- Blocks on: `no-explicit-any`, unused imports, unused vars, `no-non-null-assertion`, explicit return types, React hooks rules, `no-console`, `no-debugger`, `no-secrets`
- Deliberate decision not to run tests in the hook — tests belong in CI
- Pre-commit hooks should be fast — milliseconds not seconds
- Tested with deliberate `any` type — blocked with two specific errors
- Semicolons added back to Prettier config — personal preference, consistent with C# background

### Responsive design

- Agent found real issues — iOS zoom bug on inputs under 16px, cramped content width on mobile
- Fixed with media queries and proper flex layout
- PostCSS breakpoint variables explored then reverted — clever solution but unnecessary complexity for project size
- Fluid responsive design with proper breakpoint tiers planned for week 3

### Working with Claude

- Screenshots more effective than pasting text for validating visual outcomes
- Use screenshots for: CI badges, GitHub repo state, terminal output
- Use pasted text for: code and terminal output that needs actioning

### Ideas and observations

- Incident reporting module to be added in week 3 — Radar-relevant domain
- Playwright e2e tests — week 3
- Vitest unit tests for React — week 3
- Fluid responsive design with breakpoint tiers — week 3
- xUnit deep dive — week 3 or 4
- GDPR and AI session — week 2 or 3
- Daily AI digest email — GitHub Actions, week 5

### Time saved today

- CI pipeline set up in under 10 minutes — manually would take an hour
- Pre-commit hooks configured with 8 rules — manually would take 2–3 hours
- Responsive fixes applied and tested in minutes — manually 1–2 hours

## Day 4 — 22 May 2026

### Code review findings

- The `record` type is new to me — modern .NET shorthand for immutable data classes
- In-memory repo with hardcoded `nextId` starting at 4 — fragile, goes away when we add SQLite in week 3
- `Program.cs` minimal API pattern is different to controller pattern I am used to — not legacy thinking, just a different approach, will encounter both at Radar
- Responsive design not checked — flagged for next frontend session

### Anthropic engineering blog observations

- Long-running agents lose context between sessions — like a developer with no handover notes
- Solution: initialiser agent sets up environment once, coding agent picks up each session using progress file and git history
- One feature at a time is critical — agent tries to do too much otherwise
- Agent needs to test its own work end to end, not just assume it worked
- `claude-progress.txt` is the handover mechanism — relevant to week 4 multi-agent work
- Descriptive git commits are part of the agent workflow, not just good practice

### Healthcare scenarios

- Never debug against live production data — reproduce locally, check logs first
- Never connect Claude Code to a production database — queries leave your environment via the API
- Patient IDs and names are personal data under GDPR — sanitise before pasting anything
- Use Bogus (.NET) or Faker (JS) for synthetic test data — never real records
- Non-production databases should always have PII redacted — agents safe on dev/staging, never production

### Prompt sanitisation

- Only include what the agent needs to solve the technical problem
- Strip names, IDs, NHS numbers, hospital names — irrelevant to fixing bugs
- Check code snippets for hardcoded sensitive values before pasting

### Code review as safety layer

- Does it do what I asked? — test and verify, do not assume
- Does it do anything I did not ask for? — check the diff before committing
- Can I explain every line? — if not, ask the agent to explain first
- Read every changed line in GitLens before committing — not skim, read

### Safety position statement

> In a healthcare environment, AI agents must never consume identifiable patient data — names, NHS numbers, dates of birth, or any other personal identifiers. The consequences are severe: ICO fines, client trust destroyed, reputational damage, and potential criminal liability under the Data Protection Act.
>
> Claude Code sends prompts to Anthropic's API over the internet — anything in a prompt leaves your environment. Non-production databases should always have PII redacted which helps, but sanitising prompts must be consistent regardless of environment.
>
> The practical habit is simple — only give the agent what it needs. When debugging an endpoint, strip all patient data from the prompt. Use synthetic data libraries like Bogus for test data, never real records.
>
> Staff training matters too. The biggest risk is not malicious intent — it is a developer pasting a stack trace without thinking. Building safe prompt habits across the whole team is as important as any technical control.

### Ideas and observations

- Build a daily AI digest — GitHub Actions, Anthropic API, email delivery
- Morning coffee format: title, date, link, paragraph summary, no subscription articles
- Build in week 5 as the routines and loops exercise
- Estimated cost: ~$1–2/month

### Time saved today

- No coding today by design — thinking and safety work
- Safety position statement drafted, polished and ready for interviews and conversations

## Day 3 — 21 May 2026

### Code review findings

- Claude gave a good account of what to look for and why it made smart choices, specifically the guards confirming the front and backend data typings matching
- Strongly typed types in TypeScript is good for preventing shipping bugs
- The CSS patterns are a good base for a starting point
- The media queries for dark mode was a welcome surprise
- We did not check media queries for responsive design — make a note to prompt and check

### London keynote observations

- Followed on from the San Francisco talk
- Mostly the same speakers with the same message
- The product discussion did add some additional points about new beta features including tunnelling
- Boris echoing the message that this is all available now, go and do it

### Prompt chaining observations

- One focused prompt beats one large prompt every time
- Agent stalled on 3+ tests in one go, succeeded on one at a time
- Agent made architectural decisions unprompted — promoted `nextId` to public static to enable testability, then removed it entirely when the repository pattern made it unnecessary
- Agent explained its reasoning on every non-obvious decision
- 9 tests total, all passing

### Repository pattern refactor

- Completed in 3m 5s, all 9 tests passing
- Agent removed its own previous static hacks unprompted
- Recognised NSubstitute as the right mocking library
- No intervention needed — got it right first time
- Estimated manual time: 2–3 hours

### Where the agent hit its limits

- Stalled on multiple test generation in one prompt
- Solution: one focused prompt at a time

### What I would not trust the agent to do unsupervised

- Still at the beginning and learning — enjoyed the terminal choices to be in control (accept changes or discard) so I can see the stack trace of events
- Did not particularly like the code the agent produced before we added DI and SOLID principles including for testing — Claude admitted this was a hack
- Would not let Claude do much unsupervised until more confident in agentic AI capabilities

### Time saved today

- Approximately 4–6 hours of manual development compressed into under an hour of agent-directed work

## Day 2 — 20 May 2026

### Cursor vs Claude Code observations

**What felt different about working in the editor vs the terminal?**

The Cursor editor was fun but a bit chaotic coming into it blind — feels like a Swiss army knife of exciting tools I need time to get my head around. Without an external monitor it is difficult to fit everything on screen: chat, code, browser, developer tools, and possibly other things not discovered yet. I need to spend time looking at the code; for now I am trusting it did a good job by validating the steps set up via Claude and testing the endpoints.

**Which felt more natural for this kind of task?**

Comfortable with both Claude and Cursor, but still early days. Would prefer Claude terminal in the IDE (VS Code) rather than a separate application. Using the chat agent within the IDE is a positive step, presuming it is helping and not hindering progression of work.

**Where did Cursor's awareness of the full project help?**

Assuming the workspace set up as context, Cursor was able to scan what was generated yesterday and get the frontend talking to the backend. It did well and more — built everything without a hitch, verifying steps as it went.

**What did I have to correct?**

Nothing — worked first time, although a boilerplate project so not to get too excited yet.

**Which tool would I reach for first on a real Radar ticket?**

Difficult to say based on tasks so far — Radar is a complex beast. Would experiment with both before committing to a real ticket; going straight in would be dangerous.

### What surprised me today

- How quickly Cursor built the frontend, including fixing the CORS issue — everything built in a few minutes
- Liked that it asked before installing Node packages and tested the work before declaring job done

### What the agent did beyond what I asked

- Cursor went well beyond the brief both times
- Asked for a React frontend — added a proper API layer, TypeScript types, and solved CORS before noticing it was a problem
- Asked for error states — created typed errors, runtime type guards, a dedicated component, and user-friendly error messages that even tell you how to fix the issue
- Made architectural decisions not asked for — and got them right

### Time saved today

- Frontend built in under 10 minutes — Cursor's own logs show ~1.5 minutes for the Vite scaffold and `npm install`, with full wiring of the API layer, TypeScript types, CORS and proxy on top
- Manually this would have been 2–3 hours of setup, configuration and debugging
- Whole new world for development, especially scaffolding — need to review the code tomorrow with a clear head

## Day 1 — 19 May 2026

### First session observations

**What did the agent do that surprised me?**

Surprised how quickly it generated the project — may need to dive deeper into jargon it outputs while thinking in the background. Might be good to spend an hour or two before day two to get more familiar with Claude Code. The UX of Claude in the terminal is impressive.

**Where did it go wrong and how did it fix itself?**

Task was to get everything up and running and generate the command-line command for the APIs. It generated errors but fixed them automatically. Good to have control and be asked to continue rather than the agent going off on a tangent too quickly to understand.

**What would I have done differently?**

This version of .NET is new to me and the syntax is different to what I am used to — having tests confirms it is working; manually testing the APIs via curl builds confidence. Still early days, just one file, not to get too excited yet. Would like to ditch PowerShell and use the VS Code terminal so code and terminal live in one app.

**How long would this have taken to write manually?**

Not overly complicated what we asked the agent to build, but faster than a human would code — tests written in 2–3 minutes was great. Would have taken an hour or two manually.

**What would I not trust the agent to do unsupervised?**

Like that when setting up Claude it will never delete important code like tables without confirmation — tragic if that happened in an organisation. Would not want everything without a human; developers need to review at some point.

### Errors the agent hit and fixed automatically

Two issues came up during the build:

1. **Mangled output path** — `dotnet new` was called via the Bash tool with `-o C:\Users\jamie\code\radar-practice\ItemsApi`, but the Windows path got corrupted into a single token, so the project landed in a folder named `Usersjamiecoderadar-practiceItemsApi` instead of `ItemsApi`. Fixed by renaming the folder with `Rename-Item`.

2. **Locked binary blocking the test build** — when tests were first run, `ItemsApi.exe` was still held open by a `dotnet run` process (PID 37776) from an earlier session. MSBuild could not overwrite it and failed after 10 retries. Fixed by killing that process with `Stop-Process` before re-running tests.

The code itself compiled and all tests passed on the first attempt — both issues were environment/tooling problems rather than code errors, and both were resolved by the agent without manual intervention.
