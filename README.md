# radar-practice

[![CI](https://github.com/Collins1892/radar-practice/actions/workflows/ci.yml/badge.svg)](https://github.com/Collins1892/radar-practice/actions/workflows/ci.yml)
[![Docs: Context7](https://img.shields.io/badge/docs-Context7-blue)](https://context7.com)

A full-stack practice project built to explore **agentic AI development** — using AI coding agents (Claude Code and Cursor) to scaffold, extend, test, and maintain a real application under human direction.

This is not a production system. It is a deliberately small codebase that demonstrates how AI-assisted workflows behave in practice: what agents do well, where they stall, and why human review remains essential.

The project covers three domains: an **items catalogue** (the initial safe practice domain), an **incident reporting module** (healthcare-relevant, added in Week 3), and a **clinical audits module** (added in Week 5 as a legacy-to-modern migration — see below) — each built as a standalone API and full React frontend using a shared reusable component library.

## What this project demonstrates

### Agent-directed development over multiple sessions

The application was built incrementally across several days, mirroring how real agentic workflows unfold:

1. **Scaffolding** — An agent generated the .NET 8 minimal API, initial endpoints, and xUnit test project.
2. **Frontend wiring** — A separate session connected a React + TypeScript + Vite client to the API, including CORS and a dev proxy.
3. **Refactoring** — The agent introduced the repository pattern and dependency injection, replacing earlier testability hacks with proper abstractions.
4. **Test-driven iteration** — Integration tests were added one focused prompt at a time; the agent stalled when asked for too many tests at once. Frontend Vitest tests followed the same pattern — component tests for `ItemsList`, guard unit tests for `guards.ts`, error-mapping unit tests in `errors.test.ts`, and App integration tests mocking `api.ts`, built one test per prompt.
5. **CI and hygiene** — `.gitignore`, build-artifact cleanup, and a GitHub Actions pipeline were added to keep the repo maintainable.

### Human-in-the-loop as a feature, not a bug

Every stage followed the same principle: the agent proposes and implements, the developer reviews, tests, and decides what to commit. Agents made useful architectural decisions unprompted (typed API layer, runtime type guards, NSubstitute for mocking) but also produced shortcuts that needed correction before the repository pattern refactor.

### A realistic but safe codebase

The domain is a simple **items catalogue** — no patient data, no production dependencies. That keeps the focus on tooling and workflow rather than healthcare-specific complexity, while still reflecting habits that matter in regulated environments (prompt sanitisation, never pasting PII, reviewing every diff before commit).

### Legacy modernisation, demonstrated

The Audits module simulates a realistic legacy-to-modern migration: a believable .NET 4 / AngularJS 1.6 implementation (`legacy/`) migrated to .NET 8 / EF Core and a React 19 client reusing the existing shared component library. The legacy code is retained permanently as the before-state — both versions are preserved so the diff itself tells the migration story.

The methodology mattered more than the mechanics: legacy code is a reference for *what* a feature does (fields, validation, behaviour), never *how* the new code should be structured. The structural template is always the most recent correctly-built equivalent module already in the repo — porting AngularJS's `$scope` god-controller pattern 1:1 onto React state would have reproduced the exact smell the migration exists to fix.

## Architecture

Illustrative layout — not an exhaustive file inventory. See [CLAUDE.md](CLAUDE.md) for the full agent-oriented repo map.

```
radar-practice/
├── ItemsApi/              # .NET 8 minimal API (GET/POST /items), EF Core + SQLite
├── ItemsApi.Tests/        # xUnit integration tests (13 tests)
├── IncidentsApi/          # .NET 8 minimal API (GET/POST/PUT /incidents, GET /incidents/{id}), EF Core + SQLite
├── IncidentsApi.Tests/    # xUnit integration tests (25 tests)
├── AuditsApi/             # .NET 8 minimal API (GET/POST/PUT/DELETE /audits), EF Core + SQLite — migrated from legacy/
├── AuditsApi.Tests/       # xUnit integration tests
├── client/                # React + TypeScript + Vite frontend
│   ├── src/api/incidents.ts               # Typed fetch layer for IncidentsApi
│   ├── src/api/audits.ts                  # Typed fetch layer for AuditsApi
│   ├── src/components/IncidentsView.tsx   # Incident list with filters, sort, pagination
│   ├── src/components/IncidentForm.tsx    # Shared create/edit form (mode prop)
│   ├── src/components/IncidentCreateView.tsx # Thin wrapper — mode=create
│   ├── src/components/IncidentDetailView.tsx # Read-only detail view
│   ├── src/components/IncidentEditView.tsx   # Thin wrapper — mode=edit
│   ├── src/components/IncidentPageChrome.tsx # Shared page chrome (h1 + back link)
│   ├── src/components/AuditsView.tsx      # Audit list with filters, sort, pagination
│   ├── src/components/AuditForm.tsx       # Shared create/edit form (mode prop)
│   ├── src/components/AuditCreateView.tsx # Thin wrapper — mode=create
│   ├── src/components/AuditDetailView.tsx # Read-only detail view
│   ├── src/components/AuditEditView.tsx   # Thin wrapper — mode=edit
│   ├── src/components/AuditPageChrome.tsx # Shared page chrome (h1 + back link)
│   ├── src/hooks/useAudits.ts             # List fetch/state hook for AuditsView
│   ├── src/hooks/useAudit.ts              # Single-record fetch hook for detail/edit
│   ├── src/components/Modal.tsx           # Accessible dialog component (Radix Dialog)
│   ├── src/components/InlineAlert.tsx     # Inline status alert, four variants
│   ├── src/pageTitle.ts                   # Per-route document.title helper
│   ├── src/App.test.tsx                   # Vitest App integration tests
│   ├── src/components/ItemsList.test.tsx  # Vitest component tests
│   ├── src/guards.test.ts                 # Vitest unit tests
│   ├── src/errors.test.ts                 # Vitest unit tests
│   ├── src/test/setup.ts                  # Vitest setup
│   └── e2e/app.spec.ts                    # Playwright smoke test
├── .claude/skills/        # Repo-level agent skills
│   ├── dotnet-test-writer/
│   ├── react-test-writer/
│   ├── playwright-test-writer/
│   ├── code-reviewer/
│   ├── wcag/
│   ├── component-builder/
│   └── modernisation/
├── .claude/commands/      # Claude Code slash commands (/review, /standup, /observations, /tidy)
├── legacy/                # .NET 4 / AngularJS 1.6 Audits module — before-state for modernisation migration
├── docs/                  # Workflow friction log, agent backlog, and supporting documentation
│   ├── nightly-agent-backlog.md   # Open tasks for the nightly agent
│   └── nightly-agent-completed.md # Completed tasks log
├── .github/workflows/     # GitHub Actions CI
└── learning-notes.md      # Daily observations from the build
```

| Layer | Stack |
|-------|-------|
| Layer | Stack |
|-------|-------|
| Items API | .NET 8, minimal APIs, repository pattern, EF Core + SQLite (`app.db`) |
| Incidents API | .NET 8, minimal APIs, repository pattern, EF Core + SQLite (`incidents.db`), Severity/Status as int enums |
| Audits API | .NET 8, minimal APIs, repository pattern, EF Core + SQLite (`audits.db`), soft delete via `RecordStatus` — migrated from `legacy/` (.NET 4 / AngularJS 1.6) |
| Backend tests | xUnit, `TestWebApplicationFactory` (in-memory SQLite per project), NSubstitute — 13 ItemsApi + 25 IncidentsApi + 52 AuditsApi tests |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, react-router-dom — routes include `/`, `/components`, `/incidents`, `/audits`, and create/detail/edit for both modules |
| Frontend tests | Vitest (239 tests), `@testing-library/react`; Playwright e2e (smoke test, key journeys Week 5) |
| CI | GitHub Actions — `dotnet test` (all three APIs) and `npm test` (Vitest) on push/PR to `main` |

> **Note:** Each API uses its own SQLite database (`app.db` for items, `incidents.db` for incidents, `audits.db` for audits). All are local only and not committed.

## AI tooling observations

These are practical lessons from building this project with Claude Code (terminal) and Cursor (IDE):

**What agents do well**
- Rapid scaffolding of boilerplate — API, tests, and frontend setup in minutes rather than hours.
- Fixing environment issues autonomously (locked binaries, path mangling, CORS).
- Making sensible architectural choices when given clear, focused prompts.
- Explaining non-obvious decisions when asked.

**Where agents hit limits**
- Overly long prompts that ask for too much at once (e.g. generating several tests in one go) cause stalls; one focused task per prompt works reliably.
- Early code before DI/refactoring included shortcuts the agent itself later acknowledged as hacks.
- Agents should not be left unsupervised on unfamiliar or high-stakes codebases without review.

**Cursor vs Claude Code**
- **Cursor** excels when full workspace context matters — wiring the frontend to the backend, adding typed error handling, and verifying changes in-editor.
- **Claude Code** suits terminal-driven workflows — generating projects, running tests, and iterating on backend logic with explicit accept/reject control.
- Both benefit from the same discipline: small prompts, verify output, read the diff before committing.

**Context7 MCP**
— fetches live library documentation into agent context so agents work from current API references rather than training-data snapshots.

**Skill-specific agents (`.claude/skills/`)**
- Seven repo-level skills: `dotnet-test-writer`, `react-test-writer`, `playwright-test-writer`, `code-reviewer`, `wcag`, `component-builder`, `modernisation`.
- Test-writer skills are built after real code exists — the agent reads real patterns before writing anything. Build-guide skills (e.g. wcag) should be built before feature work to prevent retrofitting.
- Skills drive consistent output across sessions and developers — the direct fix for the reusable patterns problem.
- All seven skills include effort calibration — **think hard** for complex work (multi-file diffs, a11y-heavy UI, journey tests); **standard** for pattern-following tasks.
- Formal evals across the original six skills confirmed the delta is test quality and convention consistency, not just pass rate. Skill agents refused duplicate tests, used higher-priority RTL queries, and caught cross-stack issues that no-skill agents missed. The real measure is variance reduction — skills narrow the agent's output possibility space toward convention-consistent, high-quality results.

**Slash commands (`.claude/commands/`)**
- `/standup` — runs the daily session start: reads learning notes and the active phase file, derives the current week and day, summarises yesterday, and lists open PRs.
- `/observations` — interactive workflow friction capture: asks eight structured questions and appends a categorised entry to `docs/workflow-friction.md`.
- `/tidy` — status check against today's task list and the Week 7 tidy list; matches T0X identifiers in PR titles for deterministic status detection.
- `/review` — structured code review against the `code-reviewer` skill.

**Nightly autonomous agent**
- A GitHub Actions workflow (`nightly-agent.yml`) runs on a nightly cron schedule (3 AM Perth / UTC+8) and `workflow_dispatch`, and picks the lowest-priority open task from `docs/nightly-agent-backlog.md` matching `TASK_MODE` (default: `easy`).
- Two-phase plan-then-act: a planning call returns a structured JSON plan; implementation calls execute per file. The agent never acts without a valid plan.
- Runs the full 4-command test suite before committing — broken fixes never reach the branch. Up to 3 retry attempts with test-failure feedback to the model between attempts.
- On success: moves the task row from backlog to `docs/nightly-agent-completed.md`, commits code + backlog update in one commit, raises a normal PR.
- On failure: discards code changes, increments the attempt counter, adds a failure note, raises a draft PR for human review.
- Hard cap of 10 Anthropic API calls per run. Sensitive path guard rejects plan changes to `.github/`, `.husky/`, `package.json`.
- `TASK_MODE` controlled via GitHub repository variable — change difficulty without a commit.
- Three genuine completions so far (T02, T03, T05), selection verified to follow the lowest-ID-matching-difficulty rule exactly across all three.

**Two independent reviews catch different things**
- Claude Code `/review` and Cursor review consistently flag different issues on the same diff. Running both for significant PRs is now a firm discipline — neither alone is complete.
- On a large migration PR, the automated review loop itself shows diminishing returns — later rounds increasingly re-surface findings already deferred or already confirmed correct. The fix is a stopping rule: once two independent reviewers converge on suggestion-tier-only findings, the bot's next pass becomes the final gate, not another round of manual fixes.

**Legacy migration — reference for *what*, never *how***
- Legacy code being migrated should inform what a feature does (fields, validation, behaviour) — never how the new code is structured. The structural template is always the most recent correctly-built equivalent module already in the repo. Mapping legacy control flow onto new code 1:1 reproduces the legacy smell the migration exists to fix, even when the framework changes underneath it.
- Reusable component reuse has to be provable, not assumed. A migration prompt needs a hard constraint mapping every UI need to an existing shared component, plus a self-check requiring the agent to justify any new component file it creates.

**WCAG 2.2 AA — layered accessibility approach**
- Accessibility was built in four layers: component primitives, screen composition, app shell, and interaction patterns.
- A dedicated `wcag` skill drives systematic audits — one component or screen at a time, findings-only report, then targeted fix prompts.
- Building the wcag skill before screen-level work would have been more efficient — components would have been built correctly from the start rather than retrofitted.
- WCAG at screen and shell level is substantially more work than component-level fixes. Budget accordingly.

**Radix/shadcn testing gotchas**
- Radix Select requires `Element.prototype.scrollIntoView = vi.fn()` in jsdom tests (now global in `setup.ts`).
- Any component using `Link`, `NavLink`, or `useNavigate` must be wrapped in `MemoryRouter` in tests.
- UTC date serialization: use `format(date, 'yyyy-MM-dd')` (local date) not UTC getters — affects users in UTC+ timezones.
- Radix Dialog overlay has no ARIA role and is portaled — use `document.querySelector('div[data-state="open"]:not([role="dialog"])')` to locate it in tests. Fire `pointerDown` not `click` — Radix dismisses on pointer events at the document level, not click events.

**Safety habits (especially relevant to healthcare work)**
- Never paste identifiable patient data into prompts — anything in a prompt leaves your environment via the API.
- Strip names, IDs, and NHS numbers from stack traces and code snippets before sharing with an agent.
- Use synthetic test data (e.g. Bogus for .NET) rather than real records.
- Treat code review as a safety layer: does it do what you asked, does it do anything extra, and can you explain every changed line?

See [`learning-notes.md`](learning-notes.md) for the full daily log.

## Setup

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 24](https://nodejs.org/)

### Run the APIs

```bash
cd ItemsApi
dotnet run
```

The Items API listens on `http://localhost:5133`.

```bash
cd IncidentsApi
dotnet run
```

The Incidents API listens on `http://localhost:5134`.

```bash
cd AuditsApi
dotnet run
```

The Audits API listens on `http://localhost:5135`.

### Run the tests

```bash
dotnet test ItemsApi.Tests/ItemsApi.Tests.csproj
dotnet test IncidentsApi.Tests/IncidentsApi.Tests.csproj
dotnet test AuditsApi.Tests/AuditsApi.Tests.csproj
```

From `client/`:

```bash
cd client
npm test
```

### Run e2e tests

```bash
cd client
npx playwright test
```

Currently a smoke test only (app loads, title correct) — requires only the Vite dev server. Key user journeys (Week 5) will require ItemsApi (5133), IncidentsApi (5134), and AuditsApi (5135).

### Run the frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/items` requests to the API on port 5133.

To call the APIs directly from the browser (without the Vite proxy), copy `client/.env.example` to `client/.env` and uncomment as needed:

- `VITE_API_URL=http://localhost:5133` — Items API base URL (defaults to empty string so `/items` uses the Vite proxy)
- `VITE_INCIDENTS_API_URL=http://localhost:5134` — Incidents API base URL (defaults to `http://localhost:5134` if unset)
- `VITE_AUDITS_API_URL=http://localhost:5135` — Audits API base URL (defaults to `http://localhost:5135` if unset)

All three APIs allow CORS from `http://localhost:5173`. Incidents and Audits routes use direct CORS fetch — not proxied like `/items`.

Copy root `.env.example` to `.env` and add your `ANTHROPIC_API_KEY` for local Claude Code and direct Anthropic API usage.

### CI

Pushes and pull requests targeting `main` trigger the [CI workflow](.github/workflows/ci.yml), which runs `dotnet test` and `npm test` (Vitest) on Ubuntu. The workflow fails if any test fails.

The [PR review workflow](.github/workflows/pr-review.yml) runs after CI passes on every PR — it reviews the diff against the `code-reviewer` skill, autonomously fixes Blockers and Majors (up to 3 attempts), and posts findings as a PR comment.

The [nightly agent workflow](.github/workflows/nightly-agent.yml) runs on a nightly cron schedule (3 AM Perth / UTC+8) and `workflow_dispatch` — it picks a backlog task, implements it, runs the full test suite, and raises a PR. Three completions so far (T02, T03, T05).
