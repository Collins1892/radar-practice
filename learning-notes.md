## Week 5 Day 2 — Tuesday 16 June 2026

### Summary

Automated PR review shipped end to end. Three PRs: #90 (the review script,
merged), #91 (the GitHub Actions workflow, merged), and #92 (the autonomous
Blocker/Major fix loop — built, hardened, but NOT merged; left open and
marked draft by its own loop, to finish Day 3). The bot now reviews every PR
to main after tests pass and posts findings as an upserted comment. The fix
loop extends this to autonomously fix Blockers/Majors, run tests before
committing, and push back to the branch — with the morning PR review as the
human gate. Test suite grew from 12 to 35 unit tests. Heavy API spend day
(~$1+), driven by PR #92 reviewing its own growing diff across many iterations.

### What was built

- **PR #90** — `pr-review.js`: fetches PR diff, loads code-reviewer skill,
  calls Anthropic API, parses JSON findings, upserts a grouped comment by
  severity using a hidden marker. 12 unit tests, root package.json.
- **PR #91** — `pr-review.yml`: full test suite (.NET + root node:test +
  client Vitest) gated behind needs:test; pr-review job runs only on
  pull_request events; fork guard, concurrency control, job-level
  permissions, timeouts. Validated green in daylight, bot comment confirmed.
- **PR #92 (not merged)** — autonomous fix loop. Actions-only; local runs stay
  advisory. Fixes actionable Blockers/Majors (extractable path, in diff, not
  sensitive), runs the full test suite on the working tree BEFORE committing,
  pushes only if tests pass, discards changes and marks draft on test failure.
  Up to 3 attempts; marks draft if demoted Blockers remain or attempts exhaust.

### Key decisions and learnings

- **Cursor Auto for all coding** — Claude session tokens hit the limit twice
  on Day 1 using Claude Code for coding. From Day 2: Cursor handles all
  implementation, commits, pushes, PR creation. Claude (chat) handles
  planning, design, review assessment.
- **Fix loop autonomy + the human gate** — the reviewer repeatedly flagged
  autonomous commit/push as a tension with the "AI code human-reviewed before
  merge" rule. Decision: proceed. The human gate is the morning PR review
  before merge, not per-fix approval. The capability being demonstrated IS
  autonomous code-changing under a clear human merge gate. Deliberate,
  articulated position for the CTO.
- **Run tests before commit, not after** — the original fix-loop ordering
  committed and pushed, then tested. Inverted so tests run on the working
  tree first; broken fixes never reach the branch. Last fix of the day.
- **PR_HEAD_REF not GITHUB_REF_NAME** — Actions sets GITHUB_REF_NAME to the
  merge ref (92/merge) on pull_request events, breaking the Contents API file
  fetch. A custom env var must use a non-colliding name.
- **Reviewer reviewing its own diff** inflates findings — PR #90 and #92 both
  hit this. Bounded real feature PRs won't.
- **Opus /review > Sonnet automated reviewer** — Opus gave materially better
  output (no false Majors, honest advisory-vs-blocking). Two-review discipline
  (Cursor + Claude Code) validated again.
- **Recurring false positives to dismiss**: actions/*@v5 "don't exist" (they
  do; ci.yml passes), package-lock.json integrity "malformed" (verified clean),
  IncidentsApi.Tests "missing" (exists, passes).

### Carried to Day 3 (FIRST TASK after standup)

PR #92 has one genuine remaining issue: `fail()` calls process.exit(1) rather
than throwing, and `runGitOutput` has a `return ''` after fail() — so a failed
`git status --porcelain` reads as "no changes", a silent failure. Flagged by
the reviewer on nearly every run; it is real, not a false positive. Fix:
make fail() throw, propagate from git/API helpers, then one clean review pass,
then merge PR #92. Full detail in the disposable handover scratch file.

## Week 5 Day 1 — Monday 15 June 2026

### Summary

Week 5 Day 1 — foundation day. No legacy code touched, no automation 
built — this was the day to put everything in place before the headline 
builds start. Anthropic API orientation completed, billing and API key 
set up at console.anthropic.com, modernisation skill built and reviewed 
(PR #84, #85), implement-test-review loop pattern designed and documented 
(PR #86), and the loop tested interactively against a real backlog item 
(PR #87). Loop pattern improvement raised and merged same day after the 
first test run revealed a gap (PR #88). Nightly agent backlog consolidated 
from phase-2-build.md into phase-3-articulate.md as T26–T42. 5 PRs merged.

### Anthropic API orientation

Covered the five essentials for the unattended builds: authentication 
(Bearer token, `x-api-key` header, `anthropic-version` required), messages 
endpoint request/response structure (`POST /v1/messages`, text response at 
`content[0].text`), model selection (`claude-sonnet-4-6` as default, 
`claude-opus-4-8` for novel reasoning only), passing secrets via GitHub 
Actions environment variables (`${{ secrets.ANTHROPIC_API_KEY }}`), and 
error handling (400 insufficient credits, 401 bad key, 429 rate limit, 500/529 
server errors — fail loudly on non-transient errors, retry with backoff on 
transient ones).

For local testing, the API key goes in `.env` (gitignored). `.env.example`
with a placeholder is already in the repo root. `npm ci` is required in
`client/` before tests on a clean checkout — 
noted as a gap in docs/loop-pattern.md after the first loop run.

### API key vs Agent SDK billing decision

From 15 June 2026, paid Claude plans receive a monthly Agent SDK credit 
(~$20/month on Pro) covering Agent SDK / Claude Code GitHub Actions usage. 
Raw API key calls — direct HTTP to `api.anthropic.com` — do NOT draw from
this credit; they bill at standard pay-as-you-go rates. Both unattended builds
use the raw API path, so the Agent SDK monthly credit does not apply — budget
for pay-as-you-go API usage on the GitHub runner. Deliberate Day 1 decision,
not an accident; both builds share the same billing path.

## Week 4 Day 6 — Sunday 14 June 2026

### Summary

Week 4 close and Week 5 pre-flight. No code, no PRs — a design and
decision session. Week 4 confirmed complete (outcome met and exceeded).
All three Week 5 headline builds designed in detail, with the reasoning
behind each decision captured here because the *why* is what demonstrates
judgement for the conversation and the Week 6 impact story. Monday's
sequence locked. Closing with a fresh chat to start Week 5 clean.

### Week 4 outcome — met and exceeded

The outcome was "advanced agentic patterns under control, multi-agent
workflows demonstrated, evals running." Against that: parallel agents
across worktrees shipping 8 PRs in a day, formal evals across all six
skills, the two-review discipline, durable slash commands, and a reframe
of what evals even measure. Not just met — exceeded. The pattern of
"revealing new things each week" isn't scope creep; it's the evidence of
moving up the learning curve and keeping pace with a fast-moving field.

### Automated PR review — design and rationale

A single agent reviews the PR diff against code-reviewer, fixes Blockers
and Majors itself, and logs Minors for morning review.

**Why build it first.** Originally framed as the "safe, comment-only
plumbing validator." That framing broke once the decision was made to
let it *fix* code (Option A) rather than only comment (Option B) — fixing
code is autonomous code-changing, same risk class as the nightly agent,
so it isn't risk-free. The real reason to build it first is that its
input is *bounded*: it works on one known diff in front of it, whereas
the nightly agent has the harder job of *choosing* what to work on from a
backlog. Bounded input is a simpler problem, so it's the right first
build — but it gets the same daylight-first safety discipline.

**Option A vs B — and the "two agents" confusion.** Worth recording
because it was a genuine point of clarification: neither option is two
agents working together. Both are a single agent. The only difference is
whether that one agent *edits code* (A) or *only comments* (B). Chose A
because it's the real time saver — an agent that fixes Blockers/Majors
itself removes work rather than just flagging it.

**The bounded-retry safety valve.** Loops up to 3 attempts to resolve
Blockers/Majors. If still not clean, marks the PR as draft with a note
rather than looping forever or merging something unsafe. 3 is a starting
value, tuned from standup observations. Draft status is the signal a
human is needed — same language as the nightly agent, so both builds
behave consistently.

**Other locked decisions.** Triggers on every push; review job gated
behind `needs: test` so it only runs on green code (the agent never
spends calls on broken code); single PR comment for the Minors log,
updated in place; loud fail on API/key failure.

### Nightly autonomous agent — design and rationale

**Done condition — scope, not size.** Initial instinct was a line-count
cap (e.g. refuse to PR if >150 lines). Rejected it: line count is a poor
proxy for risk. A clean 200-line change that adds a fix plus its tests is
fine; a 40-line change touching an unrelated file is not. The real gate
is scope and coherence — tests pass (including added tests), the diff
touches only task-relevant files, and it's one coherent change. This is
the same boundary discipline that stopped Cursor Auto wandering in Week 4.

**Always raises something — draft when stuck.** A silent night with
nothing to show is a bad start. So the agent always produces something to
review: a normal PR if confident, a *draft* PR with a note if it
struggled. Draft status instantly signals "this needs my judgement" vs
"this is ready." Same mechanism as the PR review's 3-attempts-then-draft.

**The tidy-list management answer.** The key management question was how
to stop the tidy list going stale. The answer is exactly one deliberate
manual step: the agent puts the T0X identifier in the PR title and only
moves the item to "In PR" — it never marks its own work done. On merge,
the developer ticks the item ✅ in phase-3-articulate.md. That tick is the
human gate. Everything else is automated or surfaced by `/tidy`.
Consistent with the whole discipline: agents show changes, the developer
commits and confirms.

**Build safely — daylight first.** The first-ever run must not be
unattended at 2am. Build with a manual trigger (`workflow_dispatch`),
watch it pick a task, implement, test, and raise the PR in daylight
across 2–3 runs, and only then schedule the cron. The first overnight run
should be one already trusted.

**Guardrails tuned, not fixed.** The guardrails can't be perfected on
paper before the agent has run. Each Week 5 morning standup includes a
nightly-agent review — what it picked, did it stay in scope, was the done
condition right — and the guardrails are tightened from observed
behaviour. This is also a strong interview narrative: not "built it and
hoped" but "ran it, reviewed every morning, tuned from what I saw."

### Modernisation refactor — Audits module

**The slice.** An Audits module — a CRUD screen with table and
pagination, mirroring the Incidents module's shape. One believable
vertical slice migrated well beats a half-migrated big app. It reuses
everything already built: repository pattern, EF Core + SQLite, the
shared component library (DataTable, Pagination, FormField).

**Legacy retained as evidence.** The `legacy/` folder (.NET 4 /
AngularJS Audits) stays in the repo permanently as the before-state.
Crucially, the migration is raised as a PR so the *diff* captures the
transformation — the legacy folder shows the starting point, the PR shows
the change. Both preserved for the interview walkthrough. Concrete,
honest before/after that maps onto the real modernisation brief.

**Tooling.** Cursor Auto for the legacy build and the conversion —
mechanical, pattern-following work that protects the Claude allowance for
higher-value synthesis. Model routing tracked explicitly.

### The shared loop pattern

The implement-test-review loop (make change → run the right suite →
review the diff → fix Blockers/Majors and re-loop → propose Minors for
review, NOT auto-added) is designed once and used twice: interactively
in-session (ephemeral) and as the nightly agent's core logic (durable).
Same brain, two wrappers. Minors are *proposed* not auto-written, keeping
the human as the gate on what becomes durable backlog work.

### Monday sequence locked

1. Anthropic API orientation (fresh, clean view)
2. API key vs Agent SDK billing decision (the fork that gates everything
  — decided after the orientation, not pre-committed)
3. Build the automated PR review (bounded input, built first)

### Ideas and observations

- The strongest discipline today was resisting additions. The instinct
  that surfaces new ideas each week can also expand scope mid-week. Week
  5's strength comes from doing three builds well, not adding a fourth.
  The bounded-backlog discipline applies to the week itself.
- "Scope not size" and "draft when stuck" both came from rejecting a
  first instinct (line cap; always-raise-a-normal-PR). Worth noting that
  the better design came from interrogating the first answer, not
  accepting it.
- Two autonomous builds now share the same safety patterns
  (3-attempts-then-draft, daylight-first, T0X tracking). Consistency
  across them makes both easier to reason about and to demo.
- Deliberately deferred the API key vs Agent SDK decision to Monday with
  a clean view rather than forcing it at the end of a design session.
  Better decisions come from fresh attention on a real fork.

## Week 4 Day 5 — Saturday 13 June 2026

### Summary

Week 4 Day 5 (Saturday). Friday 12 June was a planned day off — moving
out of the house and a long drive to stay with family for the next few
weeks. Picked the programme back up today: introduction to loops
(ephemeral vs durable), Week 5 plan strengthened with two design
decisions, and the progress update written and logged. No PRs — a
design and consolidation day.

### Loops — ephemeral vs durable

The core distinction for the Week 5 nightly agent. **Ephemeral** means it
exists only for the lifetime of the session — a `/loop` in Claude Code
runs inside the active session and vanishes when the session closes; no
schedule, no persistence. **Durable** means it survives session
boundaries — a GitHub Actions cron job lives on GitHub's servers, fires
on schedule whether or not the laptop is on, and runs unattended.

The nightly agent must run with no session open, so it has to be durable
(GitHub Actions), not `/loop`. `/loop` is the right tool for tight
in-session iteration ("keep fixing until the build passes" while you
watch), the wrong tool for the overnight headline build.

### Ran two ephemeral loops

**Newline check-and-stop.** Ensure learning-notes.md ends with exactly
one trailing newline. The loop checked, found the condition already met
(file ends CR LF — Windows line endings), and stopped without editing.
Demonstrated the loop terminating correctly on the done condition. Also
a reminder: any file-formatting task in the nightly agent needs to be
CRLF-aware or it will "fix" line endings that aren't broken.

**DataTable implement-test-stop.** Add an accessible name to the
DataTable `<table>` element (a real WCAG backlog item). The agent made
the change, ran the suite (9/9 passed), and stopped — 1 iteration.

**Key insight: a loop only iterates when something fails.** Both runs
completed in one pass because the work was correct first time. The loop
construct is insurance, not a guarantee of repetition — iterations are a
cost, not a goal. The nightly agent should converge fast and stop, not
churn. This is exactly the behaviour to want.

### Discarded the DataTable fix on purpose

The DataTable change passed cleanly but was discarded rather than
committed — deliberately. The WCAG backlog items are the nightly agent's
first real tasks. Hand-fixing them now would spend the agent's best
demonstration material. Protecting the backlog as fuel for the headline
build is the right discipline: it gives the agent real, verifiable work
for its first run, and gives a genuine "here's a PR it raised overnight"
to show at interview.

### Durable wrapper — the GitHub Actions skeleton

Saw what the nightly agent's durable wrapper looks like. The YAML is
boilerplate: a `cron` trigger (`0 2 * * *` = 2am daily), checkout, Node
setup, a step that runs the agent script, and a step that raises the PR.
The single line `on.schedule.cron` is the entire difference between
ephemeral and durable.

The real design work is not the YAML — it's the agent script
(`nightly-agent.js`): how it picks a bounded task safely, how it knows
when to stop, and what guardrails prevent a bad PR. The loop logic from
the in-session runs lives inside this script, except the prompt is sent
to the API programmatically rather than typed in a session. Same brain,
different life support.

### Week 5 design decisions

**API key vs Agent SDK billing path.** The nightly agent and automated
PR review both call the Anthropic API directly (not via Claude Code or
Cursor, which abstract auth away). An unattended script on a GitHub
runner needs an API key as its credential, stored as a GitHub secret.
From 15 June 2026, paid Claude plans receive a monthly Agent SDK credit
(Pro ~$20/month) covering Agent SDK usage and apps built on it — but raw
API-key calls do NOT receive this credit and bill at standard
pay-as-you-go rates. Both unattended builds share whichever path is
chosen, so this is a deliberate Day 1 decision, not an accident. Added
to the Week 5 plan.

**Build sequencing — PR review first.** The automated PR review and the
nightly agent share the same API + GitHub Actions + secrets plumbing.
The PR review is lower-risk (bounded diff input, fixes Blockers/Majors
under the loop), so building it first validates the whole foundation with
a simpler autonomous surface before the nightly agent. The nightly agent
builds second, on proven plumbing.

**The implement-test-review loop pattern.** Designed once, used twice:
the loop that bundles make-change → run the right suite (frontend or
backend) → review the diff → fix Blockers/Majors and re-loop → propose
Minors for review (NOT auto-added to the backlog). Run interactively
in-session (ephemeral), then reused as the nightly agent's core logic
(durable). Minors are proposed not auto-written, keeping the human as
the gate on what becomes durable work and protecting the backlog's
quality.

### Ideas and observations

- The loop only iterating on failure is the cleanest demonstration that
  the nightly agent's value is convergence-then-stop, not activity for
  its own sake.
- Discarding a passing fix felt counterintuitive but was the right
  portfolio call — the backlog is more valuable as agent fuel than as
  ticked items.
- The billing fork (API key vs Agent SDK) is a good example of "keeping
  up with the frontier" — the 15 June credit change is days old and
  directly shapes an architecture decision.
- Document consolidation discipline held: every change today went into
  existing files (phase-2-build.md, seven-week-plan.md, private email log),
  no new files spawned.

## Week 4 Day 4 — Thursday 11 June 2026

### Summary

Week 4 Day 4 (Thursday). Full day across multiple bursts — three custom
slash commands built and iterated through four review passes, dotnet-test-writer
skill extended to cover IncidentsApi, Modal test gaps closed, phase files
updated, README updated, and Sunday plan review checklist drafted. 172 Vitest,
25 IncidentsApi xUnit, 13 ItemsApi xUnit at close. PRs #78, #79, #80 merged.

### Custom slash commands (PR #78)

Three commands built in `.claude/commands/`: `/standup`, `/observations`,
`/tidy`. Each went through four review passes — two Cursor, two Claude Code.
The commands started as basic templates and ended as sophisticated,
deterministic tools. Key findings across the passes:

**Cursor found http:// links masquerading as file paths.** The initial
draft used markdown link syntax (`[file.md](http://file.md)`) which agents
interpret as HTTP fetch attempts. Replaced with bare paths throughout.

**Phase file selection was ambiguous.** "Whichever is not yet marked
complete" matched multiple files simultaneously. Fixed by tying selection
to explicit date ranges from the programme calendar.

**D-task and T0X status rules need separate logic.** `/tidy` initially
applied T0X matching (identifier in PR title) to today's tasks too. D-tasks
have no pre-defined identifiers — they're numbered sequentially from phase
file bullets. The two rule sets are now separate blocks with "apply in order;
stop at first match" guards.

**DoesNotContain on body.Error gives false confidence.** The 500-test
assertion pattern in dotnet-test-writer checked `Assert.DoesNotContain`
against `body.Error` — which had already been asserted equal to the generic
string, making the check redundant. Fixed to assert against `raw` (the full
response string via `ReadAsStringAsync()`).

**T0X identifier convention established.** All PRs addressing Week 7 tidy
list items must include the T0X identifier in the PR title (e.g.
`fix(T14): replace skip link pattern`). This makes `/tidy` matching
deterministic and means the nightly agent's PR titles must follow the same
convention.

### Eval measurement reframe

The +17% pass rate from Week 2 Day 2 (dotnet-test-writer) was an emergent
result, not a designed benchmark. Attempting to produce equivalent numbers
across all six skills in Week 4 would have missed the point. A skill's
purpose is to narrow the variance in agent output — without a skill, the
agent has a wider possibility space and more of those possibilities produce
suboptimal results. The skill constrains that space toward convention-consistent,
high-quality output. This applies across all six skills regardless of type.
Documented in the decisions log as the authoritative framing for Week 6.

### dotnet-test-writer scope extended (PR #79)

The Week 4 Day 3 eval exposed that dotnet-test-writer was scoped to ItemsApi
only. Extended to cover IncidentsApi in full: separate project layout,
IncidentsDbContext boilerplate with JsonOptions and JsonStringEnumConverter,
mock vs real-persistence decision table, PUT round-trip guidance, raw JSON
StringContent pattern for invalid enum values, complete endpoint reference
with all 400 messages, and enum storage gotcha (int in DB, string over wire).
Two review passes — Cursor and Claude Code — with a substantive fix to the
500-test DoesNotContain assertion across both reviews.

### Modal test gaps closed (PR #80)

Two gaps identified in the Week 4 Day 3 eval and PR #76 reviews:

**Backdrop dismiss.** Radix Dialog overlay has no ARIA role and is portaled
to the document body — a `data-radix-dialog-overlay` attribute does not exist
in this Radix version. Located structurally: `document.querySelector('div[data-state="open"]:not([role="dialog"])')`. Radix dismisses on
`pointerDown` at the document level, not `click` — a plain click event would
not trigger dismissal in jsdom. The DOM inspection approach (writing a temp
test to log all div attributes) was the right way to discover the correct
selector before writing the real test.

**aria-describedby suppression.** When no `description` prop is passed,
`aria-describedby` should not appear on the dialog element. Radix would
auto-link a description ID if the prop were present — the test confirms
the attribute is genuinely absent.

`@testing-library/user-event` was missing from `node_modules` (present in
package.json but not installed) — `npm install` in `client/` restored it.
Logged to workflow-friction as a context gap finding for the backlog.

### Anthropic API gap identified

The nightly autonomous agent and automated PR review (both Week 5 headline
builds) call the Anthropic API directly — not via Claude Code or Cursor.
The programme to date has worked through these tools which abstract the raw
API away. A half-session orientation on the API is needed before any Week 5
agent design work begins. Added as the opening item on Week 5 Day 1.

### Document consolidation discipline

A pattern emerged of creating new .md files without clear standards. Agreed
that all programme documentation consolidates into the existing plan files
(seven-week-plan.md, phase files) rather than spawning new files. The
`docs/workflow-friction.md` is the one deliberate exception — public,
committed, feeds the Week 6 AI impact story.

### Ideas and observations

- Four review passes on the slash commands was the right call — each pass
  caught different substantive issues. Cursor and Claude Code consistently
  find different things even on the same diff.
- The `/tidy` output on first run correctly identified that the phase file
  marked Week 4 complete prematurely — the command exposed the gap in the
  source data, which is exactly what it's for.
- The Week 5 pre-flight checklist is the most important thing on the Sunday
  agenda. Week 5 is the showcase week — everything needs to be ready before
  Monday.
- Slash commands are durable agentic patterns that persist across sessions.
  The `/standup` command already feels like a genuine daily workflow tool
  rather than a demo.

## Week 4 Day 3 — Wednesday 10 June 2026

### Summary

Week 4 Day 3 (Wednesday). Full day — date fix pass across all .md files,
formal evals across all six skills, Modal and InlineAlert components built
and merged (PR #76), job application submitted to organisation, and
Week 5 reshaped around the nightly autonomous agent. 169 Vitest, 25
IncidentsApi xUnit, 13 ItemsApi xUnit at close.

### Date fix pass (PR #75)

Global day numbers (Day 17, Day 18 etc.) replaced with Week X Day Y format
across all .md files in a dedicated pass. House-sitting date corrected from
Friday 13 June to Friday 12 June. Two Majors and three Minors from the
Cursor review fixed before merge — broken markdown on the Toaster bullet,
ESLint glob path with early backtick close, and HasConversion generic type
dropped accidentally. Trailing newline and blank line between list items
also fixed. List continuation indent stripping logged to the nightly agent
backlog rather than fixed in this PR.

### Formal evals — all six skills

Ran skill vs no-skill eval runs across all six repo skills using parallel
worktrees. Key findings:

**Auto-loading invalidates the pass/fail baseline.** `.claude/skills/`
auto-loads in all Claude Code sessions — a clean no-skill baseline is not
achievable. The eval question shifts from skill-present vs skill-absent to
skill coverage completeness. The dotnet-test-writer scope mismatch
(scoped to ItemsApi, tested against IncidentsApi) is the first concrete
example — the agent flagged the gap, adapted, and produced a
real-persistence round-trip test rather than a duplicate.

**The delta is quality, not pass rate.** Skill agent refused to write
duplicate tests (react-test-writer prompt 1 — identified existing coverage,
offered genuine gaps instead). Skill agent used `getByRole('button', { name: label })` over `getByLabelText` — higher-priority RTL query, with
explicit justification against the skill's §6 guidance. No-skill agent
used the lower-priority query. Both tests passed; the skill agent's test
was more deliberate and rigorous.

**Playwright file placement consistency.** Skill agent placed both tests
in `app.spec.ts` — correct per the skill's smoke test convention. No-skill
agent created a new `incidents.spec.ts` on the first prompt (rejected),
then correctly used `app.spec.ts` on the second. Inconsistent structural
decisions across identical task types is the finding.

**code-reviewer cross-stack Blocker.** Skill agent caught the PascalCase
serialisation Blocker in PR #46 — IncidentsApi serialises in PascalCase
by default, frontend guards check camelCase, so every API response silently
failed. No-skill agent missed it entirely. The skill agent read both the
backend serialisation config and the frontend type guards together and
connected the dots. No-skill agent reviewed each layer independently.

**wcag contrast calculations.** Skill agent computed exact OKLCH luminance
values for the DataTable focus ring (2.53:1 against thead background) and
elevated the finding to a Major with proof. No-skill agent flagged the same
concern as an unconfirmed Suggestion. In a healthcare context, confirmed vs
unconfirmed matters.

**component-builder directory violation.** No-skill agent wrote Modal to
`src/components/ui/` on prompt 1 — the shadcn vendor directory, explicitly
forbidden in CLAUDE.md. Skill agent wrote to `src/components/` correctly
both times. This is exactly the kind of convention drift that shared skills and
CLAUDE.md are designed to prevent.

**Time cost.** Skill agent consistently took longer on complex tasks:
DataTable wcag audit 8m 20s vs no-skill 3m 26s; code-reviewer PR #46
5m 50s vs 2m 35s. For pattern-following tasks the difference was marginal.
Effort calibration matters most on genuinely complex work.

**Skill enforces conventions over user instructions.** The react-test-writer
skill overrode an explicit instruction to generate all InlineAlert tests at
once, enforcing the one-test-at-a-time convention from CLAUDE.md. The skill
cited both itself and CLAUDE.md as the source. This is appropriate strictness
— convention consistency matters more than prompt convenience.

### Nightly agent backlog established

A backlog of 16 small, well-defined, low-blast-radius tasks identified
during evals for the Week 5 nightly autonomous agent. Includes formatting
fixes from PR #75, DataTable WCAG fixes, and Pagination WCAG fixes. These
are ideal first tasks — contained, verifiable via diff, no logic involved,
easy to review in the morning.

### Modal and InlineAlert components (PR #76)

Two new accessible UI primitives built during the eval session and merged:

Modal — Radix Dialog wrapper with focus trap, aria-labelledby,
aria-describedby suppression when description omitted, WCAG-compliant
close button (aria-label, size="icon"), motion-reduce fallback. 5 Vitest
tests covering render, open, title/body, close button, and ESC key.
userEvent.keyboard used for the ESC test after eval confirmed fireEvent
is less reliable for Radix portal keyboard handling.

InlineAlert — 4 variants (success, warning, error, info) matching Sonner
toast colours. role="alert" for error only; role="status" and
aria-live="polite" for others. Decorative icons aria-hidden. 5 Vitest
tests. Both components registered in componentRegistry.

Two full review passes (Cursor then Claude Code) caught one Major
(aria-describedby suppression), two Minors (CLAUDE.md version drift,
component inventory), and a test coverage gap (aria-live assertion).
All fixed before merge.

### Week 5 reshaped

The original Week 5 task list was diffuse. Reshaped around three headline
items: modernisation refactor as the primary coding thread, automated PR
review as the CI foundation, and the nightly autonomous agent as the
headline build. The nightly agent is a GitHub Actions cron job calling
the Anthropic API directly, reading the backlog, picking a bounded task,
implementing it, running tests, and raising a PR for morning review. This
is the Boris Cherny direction — agents shipping code while the developer
sleeps.

### Job application submitted

Full Stack Engineer role at a healthcare software company submitted 10
June 2026. CV updated with agentic AI upskilling in the personal profile.
Cover letter written in three paragraphs: who I am and why I am applying,
what I built during the personal development plan, and why the
modernisation brief is where my passion lies.

### What I would not trust the agent to do unsupervised

- Produce a clean no-skill baseline in the current repo setup — skills
  auto-load; the baseline does not exist
- Write to the correct directory without the component-builder skill —
  no-skill agent defaulted to the vendor directory on prompt 1
- Confirm a WCAG finding without the wcag skill — no-skill flagged the
  DataTable ring contrast as an unconfirmed Suggestion; skill agent
  computed the ratio and confirmed it as a Major
- Place Playwright tests consistently across identical task types without
  the skill — no-skill was correct on prompt 2 but wrong on prompt 1
- Respect the one-test-at-a-time convention without the skill — no-skill
  wrote 9 tests unprompted on the InlineAlert component-builder prompt

### Ideas and observations

- The auto-loading finding is stronger portfolio material than a pass rate
  delta. It shows the workflow has matured to the point where skills are
  always present — the baseline has become the floor.
- The component-builder directory violation is the clearest single-prompt
  demonstration of skill value: one prompt, one critical convention error,
  one rejection. That is a story you can tell in 30 seconds.
- The time cost data (skill agent 2x slower on complex WCAG audits) is the
  honest side of the story — skills cost more to run, but the output is
  confirmable rather than probabilistic. That trade-off is worth naming
  explicitly in the Week 6 impact story.
- 207 tests, 6 skills formally evalled, 2 new components, application
  submitted, Week 5 reshaped — all in one day.

## Week 4 Day 2 — 9 June 2026

### Summary

Week 4 Day 2 (Tuesday). Full day — prompting guide deep-dive, all six
skills calibrated with effort levels, agent boundary rules established,
git worktrees demonstrated with parallel agents across 8 PRs (#66–#73),
and a four-run thinking budgets experiment. First real merge conflict
resolved via rebase. 158 tests at close. Hotspot for the afternoon — no
bandwidth issues in practice.

### Prompting guide deep-dive — effort levels replace budget_tokens

Read the live Anthropic Claude 4.x prompting guide. The headline finding
for this programme: `budget_tokens` extended-thinking is deprecated. The
current lever is the `effort` parameter plus adaptive thinking. Effort
ladder: low / medium / high / xhigh / max. Sonnet 4.6 defaults to high.
In Claude Code, effort is controlled via keywords: "think" / "think hard"
/ "think harder" / "ultrathink". xhigh is the recommended default for
coding and agentic work.

The plan's framing of "thinking budgets" was one version behind. Spotting
that immediately is exactly the "keeping up with the frontier" the
conversation calls for.

Other key extractions from the guide: subagent orchestration is native in
latest models (Opus 4.8 spawns fewer subagents than 4.6 by default);
code review harnesses should instruct for coverage and filter downstream
not suppress findings upfront; multi-window state via git and progress
notes matches documented best practice — the programme arrived at these
patterns independently.

### All six skills calibrated with effort levels — PRs #66 and #67

Added Recommended effort level sections to all six agent skills. Each
skill now specifies "think hard" for complex work (WCAG/a11y-heavy UI,
multi-file diffs, journey tests, screens/feature forms) and standard
effort for pattern-following tasks. Overtrigger-prone language (CRITICAL,
ALWAYS, NEVER, exactly) softened across all six to reduce Claude 4.x
over-application.

Three full review passes across two PRs: Cursor first, then Claude Code
`/review`, then fixes and re-review. Each pass caught different issues —
the code-reviewer skill's own workflow step for calibration was missing,
the wcag core rule conflicted with the new effort table, test-writer pass
gates had been removed. Documentation quality is as reviewable as code.

The no-commit/no-push rule was also tightened in this PR after Cursor
Auto committed without being asked on Week 4 Day 1. Both CLAUDE.md and
`.cursor/rules/project.mdc` updated.

### Agent boundary failures — Cursor Auto

Week 4 Day 2 produced the clearest evidence yet of Cursor Auto's tendency to
complete the full git workflow without instruction:

- Committed without being asked
- Pushed without being asked
- Raised pull requests via `gh pr create`
- Posted review comments via `gh pr review`
- Applied additional scope changes beyond the specified task

All four actions are now explicitly blocked in CLAUDE.md and `.cursor/rules`.
The pattern: agents treat "apply changes" as permission to complete the
full git workflow unless told otherwise. "Do not commit or push. Do not
raise pull requests." must be explicit in every prompt.

Force push was also added to the blocked list — Cursor Auto squashed
commits and force-pushed a branch during PR #70's review pass.

### Git worktrees for parallel agents

Set up three worktrees for the multi-agent demo:
`git worktree add ../radar-practice-wt1 -b feature/extract-incident-constants`
`git worktree add ../radar-practice-wt2 -b feature/remove-scrollintoview-mocks`
`git worktree add ../radar-practice-wt3 -b feature/resolve-page-title`

Each gets its own Claude Code session, its own branch, its own PR. The
developer acts as orchestrator — briefing agents in parallel, reviewing
sequentially. The parallelism is real: all three plans came back within
minutes of each other.

Key friction: each worktree has no node_modules. npm pulls from the
global cache (bandwidth near-zero) but install time is real and
disruptive mid-task. Established discipline: run `npm install` in each
worktree's `client/` folder immediately after `git worktree add`, before
briefing any agents.

Three worktrees was too many — coordination overhead was significant, and
the wt3 situation (merge conflict, scope overrun, mid-merge abort) added
unplanned complexity. Two is the confirmed practical ceiling for
manageable parallel orchestration.

### Multi-agent task — PRs #68–#73

Six PRs from parallel agents across two worktree runs:

**Run 1 (three worktrees):**

- #68 — Redundant scrollIntoView mocks removed from 5 test files
- #69 — resolvePageTitle moved to pageTitle.ts; 7 unit tests added
- #70 — Incident constants extracted to incidentPageCopy.ts

**Run 2 (two worktrees):**

- #71 — disabled prop added to SelectField and DatePickerField; aria-busy on form; controlled Popover open state; submit-lock integration test
- #72 — Severity/status display helpers extracted to incidentDisplay.ts; 14 unit tests; IncidentForm local options deduped
- #73 — formatReportedDate extracted to incidentDisplay.ts; 3 unit tests; CLAUDE.md and .cursor/rules synced

Six items from the Week 7 tidy list closed in one day via parallel agents.

### Thinking budgets experiment

Four plan runs of the same extraction task (formatReportedDate) at
increasing effort levels, comparing plan output:

- **No keyword** — complete plan: both locations, correct home module,
  unused import cleanup, tests included.
- **"think"** — structurally identical. Referenced the existing test
  assertion as a safety net; noted CLAUDE.md as optional.
- **"think hard"** — CLAUDE.md update added as a concrete plan step (not
  optional); three test cases vs two; pre-commit hook explicitly called
  out in verification.
- **"ultrathink"** — call sites confirmed explicitly ("Call site at line
  158 is unchanged"); `String(value)` faithfulness note added (subtle
  correctness observation the others missed). `ultrathink` highlighted in
  rainbow colour in the Claude Code terminal — visual signal the keyword
  is recognised.

Conclusion: effort calibration matters most on genuinely complex tasks.
For a mechanical extraction, the plans were structurally identical. The
gains from "think hard" to "ultrathink" are real but marginal. Default
effort is sufficient for pattern-following work — the skill effort tables
are calibrated correctly.

### First merge conflict

PR #69 (resolvePageTitle) and PR #70 (incident constants extraction) both
modified App.tsx. #70 merged first, which rewrote the import block. #69
then conflicted on merge.

Resolution: rebase #69 onto main, resolve the App.tsx conflict (keep both
sets of changes — resolvePageTitle removal from #69 and import alias fix
from #70), continue rebase, force-with-lease push.

`git fetch origin` → `git rebase origin/main` → resolve conflict in App.tsx → `git add client/src/App.tsx` → `git rebase --continue` → `git push --force-with-lease`

`git push --force-with-lease` is the correct tool after a rebase — safer
than `--force` as it only overwrites if no one else has pushed since your
last fetch. VS Code as git editor (`git config core.editor "code --wait"`)
prevents the vim surprise when the rebase commit message editor opens.

The conflict also surfaced a subtler logical dependency: pageTitle.ts
imported INCIDENT_*_HEADING from IncidentForm, but PR #70 had moved those
constants to incidentPageCopy. The import alias was correct but pointing
at a module that no longer exported those values. One test was passing
vacuously — both sides of the assertion were `undefined | Radar Practice`.
Fixed by updating pageTitle.ts and pageTitle.test.ts to import from
incidentPageCopy.

### What I would not trust the agent to do unsupervised

- Respect "do not commit or push" without the explicit phrase in the prompt
  — Cursor Auto completed the full git workflow on every task today until
  the boundary rules were added
- Raise PRs or post review comments without instruction — treated both as
  part of "apply changes"
- Know that a worktree needs npm install before tests can run — attempted
  to run tests immediately and discovered it mid-task
- Manage three parallel agents without coordination overhead — two is the
  practical ceiling
- Produce meaningfully different plans for pattern-following tasks at
  higher effort levels — four runs of the same extraction were structurally
  identical; effort calibration for mechanical work is wasted cost
- Detect that a test was passing vacuously — both expected and actual were
  `undefined | Radar Practice`; it looked green

### Ideas and observations

- 158 tests, 8 PRs (#66–#73), all six skills calibrated — in one day,
  mostly from home on a hotspot.
- The thinking budget experiment is strong Week 6 material — four concrete
  data points showing when effort calibration adds value and when it
  doesn't. That's a nuanced answer, not just "ultrathink everything."
- Six Week 7 tidy list items closed via parallel agents in a single
  afternoon session. The worktree pattern is the direct answer to the "agentic AI across the SDLC" requirement.
- The merge conflict is the best portfolio story from Week 4 Day 2 — it's not
  just "I used worktrees", it's "here's what went wrong, here's why, and
  here's exactly how I resolved it." That's the difference between having
  done it and having understood it.
- Cursor Auto's autonomous git workflow is a boundary problem now but a
  target capability by Week 5 — when agents work across worktrees on
  parallel tasks, autonomous commit and PR raising becomes the feature.
  Noted in decisions log.

## Week 4 Day 1 — 8 June 2026

### Summary

Week 4 Day 1 (Monday). Late start due to errands. Two PRs merged: component-builder skill (PR #63) and Sonner toast SC 4.1.3 (PR #64). 129 tests, 6 skills. Slash command exploration. Custom slash commands deferred to Wednesday.

### component-builder skill (PR #63)

Sixth project skill — covers all React building block types in the repo. Built by Cursor Auto from a task prompt (no `/skill-creator` command in v2.1.168). Three review passes before merge: Claude Code `/review`, Cursor review, then Claude Code on the final PR. Each pass caught different issues — confirms neither tool alone is complete on skill files as much as on code files.

Major finding from Cursor that Claude Code missed: `incidentUserMessage` verb literals documented as `'create'` / `'update'` when the actual TypeScript type uses `'creating'` / `'updating'`. Would have caused TypeScript failures in any agent following the skill. Fixed before merge.

Cursor Auto went beyond the specified scope and wrote the file without plan mode approval — clean branch saved it from being a problem. Scope instructions need to be more explicit with Cursor Auto.

### Review order — Cursor first, then Claude Code

Changed today from Claude Code first to Cursor first. Both tools consistently catch different things. Cursor stronger on code conventions, DRY, and internal consistency. Claude Code stronger on factual accuracy, WCAG SC mapping, and test coverage gaps.

### Sonner toast — SC 4.1.3 (PR #64)

Plugged the accessibility gap where create/edit success redirected silently with no confirmation for screen reader users. Sonner via shadcn CLI. Four variants (success, warning, error, info) with Badge-aligned colours, lucide icons, 3s auto-dismiss, close button bottom-right.

**Key findings:**

- `next-themes` added by shadcn CLI but unused — generated `sonner.tsx` imports `useTheme` from `next-themes` by default. This project doesn't use Next.js. Fix: hardcode `theme="system"`. Always check for unused dependencies after shadcn CLI installs.
- **CSS variable specificity** — Sonner's inline style CSS variables (`--success-bg` etc.) override Tailwind `classNames`. `toastOptions.classNames` for colours silently loses. Fix: define `--sonner-`* variables in `index.css` across all three dark mode sync points and wire through the `style` prop with `richColors` enabled.
- `**<Toaster />` DOM placement** — must sit after the skip link in DOM order. When placed first, the toast close button becomes the first Tab stop instead of the skip link (WCAG 2.4.1).
- **Sonner uses `aria-live="polite"` for all variants** including error. No assertive live region. Acceptable for this project but a known limitation for more critical error contexts.

**Test patterns:**

- Mock `sonner` at the top of test files: `vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() } }))`
- `window.matchMedia` mock required in `setup.ts` — Sonner reads `prefers-color-scheme` on mount
- `vi.useFakeTimers()` + `runOnlyPendingTimersAsync` needed to flush Sonner's `setTimeout(0)` mount and unmount delays
- **Mock pollution** — negative `toast.success` assertions fail without `vi.mocked(toast.success).mockReset()` in `beforeEach`
- Two tests per prompt now produced reliable output — the one-test-at-a-time rule was context-dependent on project maturity

### Slash command exploration

Explored Claude Code built-in commands in a fresh session: `/skills` (8 skills, ~1,310 tokens total per session), `/loop` (self-paced to 30min heartbeat when no interval given; session-bound — stops when Claude Code closes), `/memory` (project / user / auto-memory; user memory empty; auto-memory folder empty on fresh session). `/compact` requires existing messages to run.

`/loop` is not a cron replacement — ephemeral in-session monitoring only. GitHub Actions is the right tool for durable scheduling. Noted to explore `/loop` + `/review` during the worktrees/multi-agent session.

### Decision: stop recording test counts in README

Hardcoded test counts become maintenance toil as the suite grows. CI badge is the live proof. Removed from root README. client/README.md to follow.

### What I would not trust the agent to do unsupervised

- Respect "no other changes" scope instructions — Cursor applied additional audit fixes beyond the four specified
- Know that `next-themes` is unused after shadcn Sonner CLI install — requires explicit check
- Place `<Toaster />` correctly in DOM order without explicit instruction — defaulted before the skip link
- Know that Sonner CSS variables override `toastOptions.classNames` — silent failure with no error
- Respect plan mode in Cursor Auto — plan mode is ignored, direct execution assumed

### Ideas and observations

- Three review passes on a documentation file caught a Major, two Minors, and multiple Suggestions. Documentation quality is as reviewable as code — the discipline applies equally.
- The component-builder skill is the strongest single portfolio piece from
  Week 4 Day 1 — a universal React build guide that directly solves the
  reusable patterns problem.
- 129 tests, 6 skills, PRs #63–#65 in one day. Still accelerating despite a late start.

## Week 3 Day 6 — 6 June 2026

### Summary

Week 3 Day 6 (Saturday). Three WCAG PRs merged: refetch focus loss (PR #59), skip link and page titles (PR #60), validation focus and DataTable tab stop (PR #61). PR #58 (page chrome) completed on Week 3 Day 5. 125 tests. Browser session confirmed all fixes working.

### WCAG work — four layers confirmed

Week 3 Days 5–6 confirmed that WCAG accessibility operates in four distinct layers, each building on the previous:

1. **Component layer** (PRs #55–57) — Badge, state components, form/data components. Fast, targeted fixes. The building blocks.
2. **Screen layer** (PRs #58–59) — How components compose together on a screen. State machine complexity surfaces here. Focus loss on refetch required a meaningful architectural change (isInitialLoad / isRefetching split, overlay LoadingState).
3. **App shell layer** (PR #60) — Skip link, per-route document.title. Affects every route. Dynamic detail title required two-owner coordination between App.tsx and IncidentDetailView.
4. **Interaction layer** (PR #61) — Validation focus, DataTable tab stop. Small targeted changes with disproportionate impact on keyboard users.

Each layer is meaningfully different in scope and approach. Component fixes are additive; screen fixes require state machine reasoning; shell fixes affect every route; interaction fixes require focus management patterns.

### WCAG underestimation

The original plan allocated ~3h for the WCAG final pass. The actual work ran across two full days (Week 3 Days 5–6). Component layer is fast — screen and shell layer is substantially more complex. Budget accordingly in future projects. Noted in the decisions log.

### wcag skill timing

Building the wcag skill before screen-level feature work would have been more efficient. The skill is a build-guide, not just a checker — if it had existed before the incident module was built, components and screens would have been built correctly from the start rather than retrofitted. Rule: build-guide skills before features; test-writer skills after real code exists.

### Tailwind v4 dark mode — @custom-variant block form

The dark variant must respond to both the `.dark` class and OS `prefers-color-scheme`. Tailwind v4 requires the block form with `@slot` — the single-line selector form silently no-ops for media queries. Two failed attempts (inline selector, then `&:where(@media ...)`) before the correct block form was found via Context7. The failure was silent in both cases — no error, just no effect.

### IncidentsView refetch — overlay pattern

The table-unmount-on-refetch problem required splitting a single `loading` flag into three derived booleans: `isInitialLoad`, `isRefetching`, and `showEmpty`. The overlay `LoadingState` variant keeps the table mounted while signalling activity via `role="status"`, `aria-live="polite"`, and `aria-busy` on the wrapper. `pointer-events-none` preserves keyboard focus while blocking mouse interaction on stale data. Refetch failure now keeps stale table visible with an inline `role="alert"` rather than clearing `result` — a meaningful UX improvement discovered during the review process.

### Page chrome pattern

`IncidentPageChrome` — shared h1 + back link component — emerged from the WCAG audit finding that detail and edit routes had no heading or navigation during loading/error/invalid states. Create mode had the pattern already; the fix was making it consistent. The component is small (~30 lines) but solves a real screen-level accessibility gap. Shared constants (`INCIDENT_CREATE_HEADING`, `INCIDENT_EDIT_HEADING`, `INCIDENT_DETAIL_HEADING`) ensure JSX ids and focus targets stay in sync.

### What I would not trust the agent to do unsupervised

- Get the Tailwind v4 `@custom-variant` block form syntax correct without Context7 — two attempts failed silently before the correct form was found
- Identify that refetch focus loss required a state machine split rather than a simple CSS fix — the architectural approach needed human direction
- Know that `pointer-events-none` was the right choice for the overlay (preserves keyboard focus, blocks mouse) — the distinction between keyboard and pointer event handling needed explicit framing

### Ideas and observations

- 125 tests, 5 skills, 61 PRs, WCAG 2.2 AA across four layers — all in 16 working days. The compound effect is now very visible.
- The four-layer WCAG model is a strong Week 6 talking point — it demonstrates systematic thinking, not just ticking boxes.
- Future idea (Week 8+): use the wcag skill as the foundation for an automated accessibility audit pipeline — scan an existing project, generate a prioritised findings report, drive fixes through targeted agent prompts.

---

## Week 3 Day 5 — 5 June 2026

### Summary

Week 3 Day 5 (Friday). Six PRs merged: playwright-test-writer skill (PR #53), WCAG 2.2 AA skill (PR #54), WCAG pass Badge (PR #55), WCAG pass state components (PR #56), WCAG pass form and data components (PR #57), WCAG incident page chrome (PR #58). Playwright setup and smoke test also landed the previous evening. Browser session deferred to Week 3 Day 6. Long day — started mid-morning and worked into the evening.

### Playwright setup

Installed `@playwright/test` 1.60.0 with Chromium only. `playwright.config.ts` with Vite dev server (`webServer`), `baseURL`, `reuseExistingServer: !process.env.CI`. Smoke test: app loads, title correct. Key decision: e2e tests do not run on PR builds — slow, flaky tests in the PR build are an anti-pattern that frustrates developers. Nightly cron deferred to Week 5 when key user journeys land. Vitest scoped to `src/` only to prevent Playwright test files being picked up by the wrong runner.

### playwright-test-writer skill

Built into `.claude/skills/playwright-test-writer/SKILL.md`. Covers: config, `baseURL`, Vite-only `webServer`, API wiring (Items via proxy, Incidents via direct CORS), page object pattern for Week 5, journey catalog. Key gotcha documented: Items API uses Vite proxy, IncidentsApi uses direct CORS fetch — agents will get this wrong without explicit documentation. Skill is Week 5-ready even though journeys haven't been written yet.

### WCAG 2.2 AA skill

Built into `.claude/skills/wcag/SKILL.md` — the fifth repo skill. Dual-mode: audit existing code (findings-only report) and build guide (new components). Full WCAG 2.2 Level AA spec across all four principles. Radix/shadcn coverage matrix distinguishes what primitives handle automatically from what app code must verify. 13-step systematic checklist. Blocker/Major/Minor/Suggestion severity calibration with repo-specific examples. Notable: built against WCAG 2.2 not 2.1 — the difference is meaningful in healthcare (2.5.8 target size, 2.4.11 focus not obscured, 3.3.8 accessible authentication).

### WCAG component passes (PRs #55–57)

Three PRs covering nine components:

**Badge (PR #55):** One Blocker — default variant light-mode text contrast was 4.35:1, below the 4.5:1 AA minimum. Fixed by switching from `text-muted-foreground` to `text-foreground`. All semantic variants already passed (6.78:1–7.15:1 light, 8.15:1–10.39:1 dark). Decorative borders removed (1.1:1–1.6:1 against fill, below 3:1 SC 1.4.11 threshold). Default variant retains a border for visual boundary on light backgrounds — documented inline as a conscious tradeoff (border-to-fill ratio is low, but identification uses text + icon not border).

**State components (PR #56):** `h3` → styled `p` in EmptyState and ErrorState (orphaned heading-level skip). ErrorState migrated from custom `bg-[var(--app-accent)]` button to shadcn Button (token-based colours, standard focus ring). "Retry" renamed to "Try again" across ErrorState for consistency with ItemsList. Dark mode fixed: `@custom-variant dark` updated to Tailwind v4 block form responding to both `.dark` class and OS preference. `setResult(null)` removed from IncidentsView catch to keep stale table visible on refetch failure.

**Form and data components (PR #57):** Pagination "Prev" renamed to "Previous" (SC 2.5.3 Label in Name — visible text must be contained in accessible name). DataTable `ariaLabel` prop added for contextual naming when multiple tables on a page. `IncidentsView` passes `ariaLabel="Incidents list, scrollable"`. DataTable JSDoc documents the keyboard contract — at least one sortable or interactive column required for keyboard accessibility of overflowing content.

### WCAG incident page chrome (PR #58)

All four interim states on detail and edit routes (loading, error, invalid ID, null incident) now render `IncidentPageChrome` — h1 + back link — above the state component. Create mode already had this pattern; the fix made it consistent. Invalid ID states omit the subtitle (no Incident #id to display). Edit interim states show "Edit incident" chrome; detail interim states show "Incident detail" + "Incident #id" subtitle. Heading/subtitle strings exported as named constants from `IncidentForm.tsx` (`INCIDENT_CREATE_HEADING`, `INCIDENT_EDIT_HEADING`, `INCIDENT_DETAIL_HEADING`) to keep JSX ids and focus targets in sync.

### Two-review discipline — scale

Week 3 Day 5 was the most extensive test of the two-review pattern. Every PR went through both Claude Code `/review` and Cursor review. Findings were consistently different between the tools — Claude Code strong on factual accuracy (contrast ratios, WCAG SC mapping, test coverage gaps); Cursor strong on code conventions, DRY, and internal consistency. Neither alone was complete on any PR. Total review cycles across the six PRs: approximately 18 individual review runs.

### WCAG skill before feature work

The wcag skill took ~2h to build. If it had existed before the incident module, the WCAG pass would have been much faster. The audit identified gaps that required retrofitting — page chrome, refetch focus loss, dark mode tokens — that a build-guide pass upfront would have prevented. Lesson recorded in decisions log: build-guide skills before features, test-writer skills after real code exists.

### What I would not trust the agent to do unsupervised

- Correctly identify which Tailwind v4 form is valid for `@custom-variant` with media queries — two failed silently
- Deduplicate heading/subtitle strings across form and view files without explicit instruction — INCIDENT_CREATE_SUBTITLE changed silently during extraction
- Choose the right severity for accessibility findings without the wcag skill calibration table — early drafts were over-reporting Suggestions as Majors

### Ideas and observations

- Five skills in the repo by end of Week 3 Day 5 (dotnet-test-writer, react-test-writer, playwright-test-writer, code-reviewer, wcag). Each skill is a reusable agent pattern — the portfolio value compounds with each addition.
- The wcag skill audit of five complex components in one pass (PR #57) with zero blockers and zero majors is strong evidence that the component library is well-built. The audit confirmed it; it didn't just generate noise.
- Grouping simple components (Badge, LoadingState, EmptyState, ErrorState) vs complex (FormField, SelectField, DatePickerField, DataTable, Pagination) for WCAG audits worked well — simple batch validates the skill before complex batch where Radix gotchas matter most.

## Week 3 Day 4 — 4 June 2026

### Summary

Week 3 Day 4. Five PRs merged: IncidentsApi standalone backend (PR #46), 23 backend integration tests (PR #47), incident list view with server-side filtering/sorting/pagination (PR #48), incident create form (PR #49), and incident detail/edit views with shared IncidentForm component (PR #50). 147 tests total — 36 xUnit (13 ItemsApi, 23 IncidentsApi) and 111 Vitest. Started at 12:35pm, worked into the evening. Two independent reviews (Claude Code + Cursor) ran on every significant PR and caught different things each time.

### IncidentsApi — standalone backend

Built as a separate .NET 8 project with its own IncidentsDbContext and incidents.db — not added to ItemsApi. Mirrors the microservices direction the target employer is moving toward. Incident entity with Severity and Status stored as int enums for correct sort order and query performance. CRU (no DELETE): GET /incidents (server-side filter/sort/paginate), POST /incidents, GET /incidents/{id}, PUT /incidents/{id}. Global exception handler, Enum.IsDefined validation, page size cap at 100. CI updated to run both test projects.

### Backend tests — 23 in one day

All four endpoint groups covered before raising the first PR. Proactively filled gaps before review rather than waiting for findings — this paid off: the reviewer had no major test findings to report. Key pattern: POST and PUT 500 tests explicitly assert the generic error message and `DoesNotContain` the internal exception string. The IncidentsApi tests ran in 5s vs 26s for ItemsApi — fewer tests and a lighter test surface, both using in-memory SQLite.

### Incident frontend — full module in one day

List view: DataTable with six columns, server-side filtering by severity/status (separate SelectField dropdowns), server-side sort and pagination (25/page), Badge for severity and status, LoadingState/EmptyState/ErrorState states, timezone-safe date formatting using date-fns `parseISO` + `format`.

Create form: FormField, SelectField, DatePickerField wired to POST /incidents. Client-side validation matching server messages exactly. Client-only "Reported date is required." documented as intentional exception to server parity. UTC date serialization fixed to use local calendar date (`format(date, 'yyyy-MM-dd')`) after review caught the Perth timezone bug.

Detail and edit views: shared `IncidentForm` component with `mode: 'create' | 'edit'` discriminated union prop eliminates the classic create/edit code duplication. Thin wrapper views (`IncidentCreateView`, `IncidentEditView`) handle routing only. `IncidentDetailView` is read-only with Badge, formatted date, back/edit links.

### Two-review discipline — confirmed again

Week 3 Day 4 was the most thorough validation of the two-review pattern yet. Claude Code caught: enum out-of-range validation gap on GET list, dead mock setup in PUT validation tests, stale-response concern, exception not logged. Cursor caught: loading flash on refetch (WCAG — table unmounts drops keyboard focus), title link only visible on hover (WCAG accessibility), toUserMessage duplicated, parseIncidentId duplicated across two files, POST returns null Location header. Neither review alone was complete on any PR. This is now a firm discipline for significant frontend PRs.

### Architecture decisions

- **Standalone IncidentsApi** — not shared AppDbContext. Deliberate microservices-direction decision. CLAUDE.md updated.
- **Int enum storage** — `HasConversion<int>()` for Severity and Status. Native DB-level sort, correct logical order. String storage gives alphabetical order (Critical, High, Low, Medium) which is wrong for a healthcare severity ranking.
- **Shared IncidentForm** — `mode: 'create' | 'edit'` discriminated union prop. One component, two modes, no duplicated form markup. The pattern to use whenever create/edit forms share the same fields.
- **parseIncidentId** — strict integer-string parsing: `id !== String(n)` rejects leading zeros and other non-canonical forms. Extracted as a shared helper.

### Test patterns learned — Week 3 Day 4

- **MemoryRouter required when Link is in the tree** — adding a `Link` to IncidentsView broke all existing tests with a React context error. Wrap any component that uses `Link`, `NavLink`, or `useNavigate` in `MemoryRouter` in tests.
- **Radix Select needs scrollIntoView shim** — `Element.prototype.scrollIntoView = vi.fn()` in `beforeEach` prevents jsdom throw when opening a SelectField dropdown.
- **UTC date serialization** — use `format(date, 'yyyy-MM-dd')` (local date) not UTC getters. Perth is UTC+8; picking "4 June" with UTC methods would POST "3 June".
- **vi.mock with importOriginal** — partial mocks that expose shared helpers (incidentUserMessage, parseIncidentId) need `async (importOriginal) => ({ ...await importOriginal(), ...overrides })` pattern to keep real implementations available.

### What I would not trust the agent to do unsupervised

- Choose the correct architecture (standalone vs shared context) without explicit direction — the first plan proposed adding everything to ItemsApi
- Know that Radix Select needs a scrollIntoView shim — this breaks silently until the test runs
- Use local date methods for form submission — UTC getters are the natural default and the bug is invisible until you're in a UTC+ timezone
- Keep enum sort order correct with string storage — the agent suggested HasConversion() without flagging the alphabetical sort trap
- Identify that MemoryRouter is needed when a Link is added — the error message is clear but non-obvious to trace back to the missing router context

### Ideas and observations

- 147 tests in 14 working days across 19 test files — the compound effect of the test-writing discipline is now very visible
- The IncidentsApi test run (5s vs 26s for ItemsApi) is a good data point for the Week 6 impact story — fast tests are a product of good isolation discipline
- The shared IncidentForm is the strongest demonstration yet that the component library approach works: one component, informed by reusable primitives, covering two screens without duplication
- Proactive test coverage before raising a PR (adding 5 more tests after "are we sure we have enough?") prevented every single Major test finding across the five PRs. This is now the established pattern.
- The Perth timezone bug in date serialization is an example of a subtle correctness issue the agent would never catch — it passed all tests because the CI runner is UTC. Real-world impact discovered only by thinking through the user's actual context.

## Week 3 Day 3 — 3 June 2026

### Summary

Week 3 Day 3. Four PRs merged: react-test-writer skill + dotnet-test-writer alignment (PR #41), simple component tests — Badge, LoadingState, EmptyState, ErrorState (PR #42), complex component tests — FormField, SelectField, DatePickerField, DataTable, Pagination (PR #43), and Node.js 20 CI deprecation fix (PR #44). 80 tests total, up from 51 at the start of the day. Multiple Claude Code and Cursor review cycles on each PR — findings grew across rounds. EmptyState got a real accessibility fix driven by a failing test. School run break mid-afternoon; DataTable and Pagination completed after returning.

### react-test-writer skill

Built into `.claude/skills/react-test-writer/SKILL.md` after the 9 components existed — following the "skills after real code" rule. Covers six Vitest test types: unit, component, integration, form, router, accessibility. Dedicated shadcn/Radix gotchas section: SelectTrigger aria placement, autoFocus not initialFocus, DataTable generic typing. Mirrors dotnet-test-writer structure exactly. Two issues found during skill build: dotnet-test-writer said "never run dotnet test" which contradicted CLAUDE.md — fixed as part of the same PR. Benchmark deferred to Week 4 to avoid burning Week 3 Day 3 session budget.

### Two-branch strategy for component tests

Simple presentational components (Badge, LoadingState, EmptyState, ErrorState) on one branch; complex Radix/shadcn components (FormField, SelectField, DatePickerField, DataTable, Pagination) on a second. Simple branch validated the skill before tackling the complex components. Each review cycle on the simple branch improved the skill for the complex ones. Two focused PRs were significantly easier to review than one large PR would have been.

### Test-driven accessibility fix

EmptyState.tsx lacked `role="status"`. The react-test-writer skill produced a test asserting `role="status"` which failed, surfacing a real accessibility gap. Added `role="status"` and `aria-live="polite"` to match LoadingState. This is the skill working as intended — a test drove a component fix rather than just verifying existing behaviour. The two sibling state components are now consistent.

### Review cycle findings — component tests

Both Claude Code and Cursor reviews caught real issues across PR #42 and #43:

- Badge danger variant test added no coverage (identical to first test) — fixed to assert `data-variant="danger"`
- EmptyState `aria-live="polite"` inconsistency vs LoadingState — fixed
- DataTable `aria-label` on region wrapper, not `<table>` — accessibility table corrected in skill
- FormField label nesting (implicit vs explicit `htmlFor`) — clarified in skill
- DatePickerField trigger aria-invalid/aria-describedby missing from error test — added
- DataTable aria-sort descending not asserted — added
- Pagination Prev/Next callback coverage gaps — added

Each review round improved both the tests and the skill documentation. Final test count grew from 19 planned to 29 through review cycles.

### DatePickerField autoFocus in jsdom

The autoFocus assertion in Test 4 (focus moves into the portaled calendar after open) was flagged as a risk — focus behaviour inside Radix portals doesn't always match browser behaviour in jsdom. It worked correctly. The test uses `closest('[data-slot="calendar"]') ?? closest('.rdp-root')` which couples to vendor markup — flagged as a known brittleness for Week 7 refactor.

### DatePickerField accessible name finding

The trigger button's accessible name comes from label association (`htmlFor`/`id`), not the placeholder text. `getByLabelText('Incident date')` is the correct query, not `getByRole('button', { name: 'Pick incident date' })`. Label association overrides placeholder — a subtle but important RTL behaviour.

### Cursor Auto mode and quota

Day started with Cursor API credit pool at 100% exhausted from Week 3 Day 2's heavy component work. Auto mode confirmed as unlimited — does not draw from the credit pool. Cursor Auto used for all coding throughout the day; Claude Code used for reviews (separate quota). Quality held well for pattern-following test work. Cursor Plan & Usage screen (Settings) is the place to check quota.

### gh pr create on Windows PowerShell

`--body` flag with multi-line strings, backticks, and em dashes fails in PowerShell — shell parses them as separate arguments. Raised PRs manually on GitHub for today. To investigate on Week 3 Day 4: `--fill` (uses commit message) or `--body-file` (temp file approach).

### GitHub Actions Node.js 20 deprecation

`actions/setup-node@v4` was running on deprecated Node.js 20. GitHub Actions forces Node.js 24 by default from 16 June 2026 — 13 days away at time of fix. Upgraded to `actions/setup-node@v5` in `.github/workflows/ci.yml`. CI annotations warning cleared. Quick fix, ~15 minutes including PR and verification.

### Prompts as code blocks not widget artifacts

The copy button in visualiser widgets is unreliable in the Claude.ai interface. Switched to plain code blocks for all Cursor prompts — the code block copy button works natively. Applied from mid-session onwards.

### What I would not trust the agent to do unsupervised

- Start implementing without explicitly being told "plan mode, no files" — Pagination tests were built without plan mode because the user pressed build rather than selecting plan. The output was correct but the planning step was skipped.
- Identify the right Cursor mode without being told — no mode, plan, agent, ask, debug selector was shown; user had to know to choose.
- Correctly identify accessible name when label association is present — the agent initially proposed `getByRole('button', { name: 'Pick incident date' })` for the DatePickerField trigger, which would fail because label association overrides placeholder as the accessible name.
- Maintain consistent behaviour across two skill files without explicit alignment — dotnet-test-writer "never run test" contradiction with CLAUDE.md existed until it was surfaced today.

### Ideas and observations

- 80 tests in 13 working days across 13 test files — the react-test-writer skill drove 29 of them in a single day. Acceleration is visible and measurable.
- The skill benchmark (deferred to Week 4) will be the clearest delta story for Week 6 — skill vs no-skill pass rate across all three test writers.
- Two independent reviews (Claude Code + Cursor) on skill documentation files is as valuable as on code files — both caught accuracy errors that would have misled agents in future sessions.
- Button label inconsistency (ErrorState 'Retry' vs ItemsList 'Try again') surfaced through testing — another example of tests revealing UX issues, not just code correctness.
- The Node.js 20 deprecation fix took 15 minutes. Spotting it early from the CI annotation saved a potential CI break on 16 June.

## Week 3 Day 2 — 2 June 2026

### Summary

Week 3 Day 2. All 9 reusable components built, reviewed, and merged in a
single day: Badge, LoadingState, EmptyState, ErrorState, FormField,
SelectField, DatePickerField, DataTable, and Pagination. ComponentsView
scaffold with React Router also landed on Week 3 Day 2. Cursor Pro credit limit hit
mid-day; switched to Auto mode and continued. Progress update email sent to
the stakeholder. Heavy review back-and-forth — most PRs went through 2–3 review
cycles before merging. Token spend was significant. Documentation session at
end of day to capture decisions and update CLAUDE.md and .cursor/rules.

### Code review findings

- Two-review approach (Claude Code + Cursor) caught different issues
  consistently — neither review alone was complete
- Badge placed in `src/components/ui/` by agent — code-reviewer caught it.
  Vendor directory is ESLint-ignored; all hand-authored components must go
  in `src/components/`
- App.css global `button {}` rule overriding all Tailwind utility classes on
  buttons — caused active state styling failure in ComponentsView sidebar.
  Found by browser devtools computed styles after agent correctly diagnosed
  the cascade conflict
- react-day-picker v10 removed `initialFocus` — agent used the old API.
  Claude Code with Context7 caught this on PR review. CI passes because the
  prop is accepted and ignored, not rejected — a silent regression
- `react-refresh/only-export-components` fires on `componentRegistry.tsx` — 
  file-level eslint-disable added as interim fix. FormField.tsx was resolved 
  by extracting formFieldErrorId to formFieldUtils.ts instead; architectural
  fix deferred to Week 7

### React Router — replacing state toggle

- Replaced local state view toggle in App.tsx with react-router-dom 7.16.0
- BrowserRouter in main.tsx, Routes and NavLink in App.tsx
- ItemsView extracted from App — unprompted agent decision that was correct.
  Scopes the items fetch to the `/` route so it does not run on `/components`
- App.test.tsx needed MemoryRouter wrapper — review caught this before merge
- MemoryRouter renderApp() helper added with explicit `(): void` return type,
  consistent with existing Vitest conventions

### Component library — all 9 components (Item 4)

- Built standalone with a components view (mini-Storybook), not emerging from
  the incident module as originally planned. Clearer portfolio signal and
  decouples component quality from incident module pace
- Components view: sidebar nav with active state, preview pane, registry-
  driven. componentRegistry.tsx holds all entries; file-level eslint-disable
  for react-refresh pending Week 7 architectural fix
- All components live in `src/components/` not `src/components/ui/`
- Vitest tests deferred to item 8 — react-test-writer skill first (item 7)
- formFieldErrorId extracted to formFieldUtils.ts — pure module imported by
  both FormField and SelectField to avoid the react-refresh rule
- FormField uses cloneElement to auto-inject aria-describedby and aria-invalid
  onto child inputs — removes the magic string convention from consumers
- SelectField: Radix Select.Root renders no DOM node so aria-* must go on
  SelectTrigger directly, not on the Select root. Comment added explaining why
- DatePickerField: shadcn Calendar + Popover. react-day-picker v10 uses
  `autoFocus` not `initialFocus` — version discipline catch
- DataTable: generic `DataTable<T extends Record<string, unknown>>`, sortable
  headers, aria-sort, overflow-x-auto keyboard-focusable region, controlled
  sort via onSort callback. No internal sort state
- Pagination: getPageTokens with 5-button ellipsis logic, aria-current="page",
  aria-label on each button, cn() for class composition

### App.css global button rule removal

- Removed `button { background: var(--app-accent); color: #fff; }` from App.css
- Rule was overriding all Tailwind utility classes on every button element
- Discovered when ComponentsView sidebar active state showed identical styling
  for active and inactive items despite correct Tailwind classes
- Agent added `!important` Tailwind modifiers as a workaround; after root cause
  was found the overrides were removed and the global rule deleted
- All three affected buttons (Add item, Refresh, Try again) updated with
  explicit Tailwind classes
- Lesson: browser devtools computed styles tab is the correct diagnostic tool
  for unexplained Tailwind class failures

### Cursor usage limits

- Hit the Pro plan credit ceiling mid-day. Cursor Pro includes a $20/month
  credit pool — exhausted by heavy agentic use across 9 components
- Downgraded silently to Auto mode (Cursor's smart router within the plan)
- Quality held up reasonably well for remaining components on Auto mode
- Key difference from Claude limits: Cursor degrades silently without
  notification; Claude issues a hard lock with a clear reset time
- Cursor limits do not reset daily — check usage at the start of each session
  not just when failures appear
- Lesson: save frontier model quota for complex tasks (DataTable, DatePicker);
  use manual edits or Auto mode for simple single-file changes

### What I would not trust the agent to do unsupervised

- Choose the correct directory for a new component without explicit instruction
  — agent defaulted to `src/components/ui/` (vendor directory) for Badge
- Know which library API version is current without Context7 — react-day-picker
  initialFocus was removed in v10 and the agent used the old API silently
- Notice CSS cascade conflicts — requires browser devtools investigation, not
  just reading the code
- Continue at consistent quality after Cursor credit exhaustion — degradation
  is silent and the drop can be gradual
- Run tsc reliably — the Cursor shell environment was unresponsive all day;
  tsc was run manually after every component

### Ideas and observations

- 9 components in one day is the evidence for the Week 6 impact story — the
  component library is the day-one contribution piece, now in the repo
- Token economy is real: 9 PRs × 2–3 review cycles each = significant Claude
  and Cursor budget. Tighter prompts upfront reduce review cycles downstream
- Two independent reviews consistently catch different things — Claude Code
  caught the test gap and ESLint violations; Cursor caught the fallback route,
  the stale h1, and the react-day-picker API regression. Run both for PRs that
  matter
- `react-refresh/only-export-components` is a structural problem with the
  componentRegistry pattern. The Week 7 fix (preview: React.ComponentType)
  eliminates it properly — do not keep adding file-level disables
- Cursor vs Claude usage model is a meaningful workflow difference. Cursor's
  silent degradation is more dangerous than Claude's hard lock for agentic
  work — you might not notice until the output is wrong

## Week 3 Day 1 — 1 June 2026

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
  `src/components/ui/`** and `src/lib/utils.ts` from linting. Vendor-generated
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
  vendor file exemption for `src/components/ui/`**
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

## Week 2 Day 5 — 29 May 2026

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
- pr-workflow.md is proposable as a team standard from day one
- AI evals identified as a gap — added to Week 4
- Week 3 is ambitious at ~34 hours — if pressure builds, slip from the bottom not the top

## Week 2 Day 4 — 28 May 2026

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
- HIPAA training is a personal strength relevant to healthcare US operations
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
- RAG verified — correctly reads context from attached files
- From Week 2 Day 5 onwards, daily sessions run inside the Project
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

## Week 2 Day 3 — 27 May 2026

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
  real production experience where AI-generated code produced working but
  wrong-pattern results shipped past deadline
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
- Weekly limit: resets Sunday 8:00 PM — 36% used at end of Week 2 Day 3
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
- Morning standup structure transfers directly to team standup
- AI-generated migration (working but wrong patterns, inferior
  visual quality, shipped past deadline) is a concrete AI impact story
  for Week 6 — know what good looks like and where AI fell short
- Two lockouts and CI trigger issue this week are stronger portfolio
  stories than a smooth week — real experience, real lessons, real
  discipline put in place to prevent recurrence

## Week 2 Day 2 — 26 May 2026

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

## Week 2 Day 1 — 25 May 2026

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
- Opportunity to propose a thoughtful approach to the team

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
- Multi-repo CLAUDE.md complexity is an unsolved industry problem — opportunity to propose a thoughtful approach at a new organisation

## Week 1 Day 5 — 23 May 2026

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

- Incident reporting module to be added in week 3 — healthcare-relevant domain
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

## Week 1 Day 4 — 22 May 2026

### Code review findings

- The `record` type is new to me — modern .NET shorthand for immutable data classes
- In-memory repo with hardcoded `nextId` starting at 4 — fragile, goes away when we add SQLite in week 3
- `Program.cs` minimal API pattern is different to controller pattern I am used to — not legacy thinking, just a different approach, will encounter both in enterprise codebases
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

## Week 1 Day 3 — 21 May 2026

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

## Week 1 Day 2 — 20 May 2026

### Cursor vs Claude Code observations

**What felt different about working in the editor vs the terminal?**

The Cursor editor was fun but a bit chaotic coming into it blind — feels like a Swiss army knife of exciting tools I need time to get my head around. Without an external monitor it is difficult to fit everything on screen: chat, code, browser, developer tools, and possibly other things not discovered yet. I need to spend time looking at the code; for now I am trusting it did a good job by validating the steps set up via Claude and testing the endpoints.

**Which felt more natural for this kind of task?**

Comfortable with both Claude and Cursor, but still early days. Would prefer Claude terminal in the IDE (VS Code) rather than a separate application. Using the chat agent within the IDE is a positive step, presuming it is helping and not hindering progression of work.

**Where did Cursor's awareness of the full project help?**

Assuming the workspace set up as context, Cursor was able to scan what was generated yesterday and get the frontend talking to the backend. It did well and more — built everything without a hitch, verifying steps as it went.

**What did I have to correct?**

Nothing — worked first time, although a boilerplate project so not to get too excited yet.

**Which tool would I reach for first on a real ticket?**

Difficult to say based on tasks so far. Would experiment with both before committing to a real ticket; going straight in would be dangerous.

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

## Week 1 Day 1 — 19 May 2026

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
