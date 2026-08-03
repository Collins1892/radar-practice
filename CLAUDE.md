# CLAUDE.md

Agent boot guide for this repository. Read this first. It is the **canonical**
source of truth for what this project is, where things live, the conventions to
follow, and the boundaries not to cross. `.cursor/rules/project.mdc` is a thin
pointer back to this file — do not treat it as a second source.

Keep this file an orientation guide, not an encyclopedia. Exhaustive file lists
and code patterns live in `.claude/skills/`; exact dependency versions live in
the manifests (see [Tech stack](#tech-stack)).

## Orientation

This is a full-stack learning project that demonstrates **agentic AI
development** — using AI coding agents (Claude Code and Claude.ai) to scaffold,
extend, test, and maintain a real application under human direction. It is **not
a production system**.

It contains three vertical-slice modules behind a shared React client, plus a
skill library, slash commands, and CI/automation that together make the agentic
workflow itself the thing on display. Every change runs through a human review
gate: the agent proposes and implements; the developer reviews, tests, and
decides what to commit.

## Golden rules (boundaries)

Do:

- Use **Plan mode** for any non-trivial task — show the plan before touching files.
- Make small, focused changes; run the [verification commands](#verification) after each and confirm they pass.
- Match existing patterns; use the repository pattern for all new data access.
- Add tests for new endpoints or business logic — **one test per prompt**.
- Ask for clarification when a task is ambiguous rather than guessing.
- Check `.claude/skills/` and `.claude/commands/` for relevant skills/commands before starting (see the [index](#skills-and-commands)).

Don't:

- **Commit or push without being explicitly asked** — show changes only; the developer commits.
- Force-push (`git push --force` / `--force-with-lease`) without explicit instruction.
- Raise PRs via `gh pr create` or post reviews via `gh pr review` unless the task says so.
- Run destructive operations (delete files, drop tables) without confirmation.
- Expose stack traces or internal errors to clients.
- Use `any`, non-null assertions (`!`), or disable ESLint rules.
- Put PII, patient data, or NHS numbers anywhere (see [Data protection](#data-protection)).
- Over-engineer or make large unsupervised multi-file refactors.

## Reference-module decision rule

When building or migrating anything, pick the structural template by this rule —
it matters more than any other layout note here:

- **Incidents / Audits → the structural template.** Copy their shape for any new
  feature module (standalone API, repository pattern, screens/forms/route shells,
  shared component library).
- **Items → demo learning scaffold only. Never a template.** It exists for
  agentic-workflow practice; the `/items` route carries a warning banner. Do not
  model new work on it.
- **`legacy/` → behaviour reference only.** It tells you *what* a feature does
  (fields, validation, copy) — never *how* to structure the new code. Porting
  AngularJS / .NET 4 patterns 1:1 reproduces the smell the migration exists to
  remove.

## Repo map (by pattern)

The backend is three independent .NET 8 minimal APIs, each following the same
shape. The `RadarPractice.sln` solution groups all six .NET projects — build/test
the whole backend with `dotnet ... RadarPractice.sln` (new projects must be added
manually via `dotnet sln add`).

Each feature API repeats this pattern:

```
XApi/
  Program.cs                       # endpoints, CORS + connection string from appsettings.json, DI, Database.Migrate()
  IXRepository.cs                  # repository interface (controllers depend on this, never the DbContext)
  Data/XDbContext.cs               # dedicated DbContext + model config
  Repositories/EfXRepository.cs    # EF Core implementation (scoped; AsNoTracking() reads)
  Migrations/                      # EF Core migrations
XApi.Tests/
  TestWebApplicationFactory.cs     # per-class in-memory SQLite DB
  *Tests.cs                        # xUnit integration tests
```

Modules, ports, and databases (each API owns its own DbContext and SQLite file;
all DBs are local-only and never committed):

| Module | Project | Port | DB | Role |
|--------|---------|------|----|------|
| Items | `ItemsApi/` (`AppDbContext`) | 5133 | `app.db` | demo scaffold |
| Incidents | `IncidentsApi/` | 5134 | `incidents.db` | reference feature module |
| Audits | `AuditsApi/` | 5135 | `audits.db` | reference module, migrated from `legacy/` |

`legacy/` holds the original .NET 4 / AngularJS Audits implementation, retained
permanently as the before-state for the modernisation migration — not dead code.

Frontend (`client/`, React + TypeScript + Vite):

```
client/
  src/
    App.tsx, main.tsx      # routing (BrowserRouter); "/" redirects to "/components"
    components/            # hand-authored app components (build here)
    components/ui/         # shadcn/ui vendor components — ESLint-ignored; never hand-author here
    hooks/                 # useAudits, useAudit (data-fetching hooks)
    api/                   # typed fetch layers (incidents.ts, audits.ts); api.ts for Items
    componentPreviews.tsx  # gallery preview components (components only)
    componentRegistry.ts   # gallery entry array (no JSX)
    pageTitle.ts, errors.ts, guards.ts, types.ts
  e2e/                     # Playwright specs — sibling of src/, not inside it
```

For exhaustive, current file inventories of any area, read the relevant skill in
`.claude/skills/` — those files are kept in sync with the code and are the place
to look rather than duplicating the list here.

## Tech stack

Framework majors, for orientation only:

- **Backend:** .NET 8, C# minimal APIs, EF Core 8 + SQLite, repository pattern + built-in DI; xUnit + `TestWebApplicationFactory`, NSubstitute.
- **Frontend:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`), shadcn/ui (Nova) on Radix, react-router-dom 7; date-fns, react-day-picker, sonner. Vitest + Testing Library; Playwright (Chromium) for e2e.
- **Tooling:** Node 24 (LTS), Husky + lint-staged pre-commit, GitHub Actions, Context7 MCP for live library docs.

**Version policy — point to the manifests, don't duplicate pins here.** Exact
pinned versions live in [`client/package.json`](client/package.json) and the
`.csproj` files; those are authoritative. The `.claude/skills/` files carry exact
versions deliberately, because they need them for API-accurate code generation.
This file names framework majors only so there is one fewer place to drift. When
upgrading a dependency, update the manifest and any affected skill file in the
same change.

## Conventions

**TypeScript:** no `any`; no unused imports/vars; explicit function return types;
no non-null assertion (`!`); semicolons, single quotes, trailing commas.

**React:** function components; hooks rules enforced (no conditional hooks,
exhaustive `useEffect` deps); no `console.log` / `debugger`. Data-fetching state:
AuditsApi consumers use the centralized hooks `useAudits` / `useAudit`;
IncidentsApi screens still use inline `useState`/`useEffect` (legacy pattern,
retrofit tracked as T58 — see [known gaps](#known-gaps)). New modules follow the
hooks pattern.

**C#:** controllers depend on repository interfaces, not concrete classes; DI via
the built-in container. A **global exception handler** covers unhandled
exceptions and returns a consistent `{ error: "..." }` shape — do **not** add
per-endpoint try/catch, and never leak stack traces.

**Soft delete (`RecordStatus`)** — used in IncidentsApi and AuditsApi; reuse this
pattern for any new soft delete:

- `RecordStatus` enum (`Active`, `Deleted`) on the entity, stored as int; excluded from all wire DTOs.
- `Add` always sets `Active`; `Update` never touches `RecordStatus` and targets active rows only.
- All reads (`GetAll`/`GetPaged`, `GetById`) unconditionally exclude `Deleted`.
- DELETE calls repository `SoftDelete`; a second delete returns not found, not 204.

**CSS:** new components use Tailwind + shadcn only; OKLCH theme tokens in
`src/index.css` under `@theme inline`; compose with `cn()`. Items' legacy
`ItemsList.css` / `App.css` are an expected demo-scaffold exception — do not add
new legacy CSS. Dark mode keeps three sync points aligned (`.dark` class, media
query, `@custom-variant dark`).

## Verification

Run after every change and confirm passing before declaring done.

```bash
# Backend — all six .NET projects at once
dotnet test RadarPractice.sln
# or per project:
dotnet test ItemsApi.Tests/ItemsApi.Tests.csproj
dotnet test IncidentsApi.Tests/IncidentsApi.Tests.csproj
dotnet test AuditsApi.Tests/AuditsApi.Tests.csproj

# Frontend — Vitest (from client/)
cd client && npm test

# End-to-end — Playwright (from client/; webServer boots all 3 APIs + Vite)
cd client && npx playwright test
```

Gotchas: Vitest needs `pool: 'threads'` on Windows; each `TestWebApplicationFactory`
gives a test class its own in-memory SQLite DB; Vitest only runs files under
`src/` (`e2e/` is Playwright-only); e2e does not run on PR CI (nightly only).

## Skills and commands

Check these before starting relevant work. Read a skill's `SKILL.md` and follow
it when its trigger applies.

**Skills (`.claude/skills/`):**

| Skill | Use when |
|-------|----------|
| `dotnet-test-writer` | Writing an xUnit integration test for Items/Incidents/Audits API — one `[Fact]` per request. |
| `react-test-writer` | Writing a Vitest test in `client/` — one `it()` per request. |
| `playwright-test-writer` | Writing a Playwright e2e/journey test — one `test()` per request. |
| `component-builder` | Building a hand-authored React component, screen, or route shell in `client/`. |
| `modernisation` | Migrating/porting legacy code from `legacy/` (e.g. the Audits migration). |
| `wcag` | A dedicated WCAG 2.2 AA accessibility audit or build guide (report only). |
| `code-reviewer` | Reviewing a file or diff — full-stack, advisory, no edits. |

**Commands (`.claude/commands/`):**

| Command | Does |
|---------|------|
| `/standup` | Daily session start: derives current week/day, summarises yesterday, lists open PRs. |
| `/observations` | Interactive workflow-friction capture; appends a categorised entry to `docs/workflow-friction.md`. |
| `/add-backlog-item` | Interactive capture of a new nightly-agent task; assigns the next T-number and appends a row to `docs/nightly-agent-backlog.md`. |
| `/review` | Structured code review against the `code-reviewer` skill. |
| `/tidy` | **Deprecated — do not run or suggest.** Task state lives in the backlog files and PRs, not in a phase-file tidy list. Use `/add-backlog-item` to add work. Retained only because older docs still reference it. |

## Automation

All work flows through feature branches and PRs; CI must pass before merge.

- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) — on push/PR to `main`, runs `dotnet test` for all three APIs and Vitest in `client/`. No Playwright on PR builds.
- **PR review bot** ([`.github/workflows/pr-review.yml`](.github/workflows/pr-review.yml) → [`.github/scripts/pr-review.js`](.github/scripts/pr-review.js)) — on every PR, runs its own test job, then reviews the diff against the `code-reviewer` skill. Auto-fixes Blockers and Majors (up to 3 attempts), runs the full test suite before committing each fix, demotes Minors to advisory, and posts findings as a single PR comment. On test failure or unresolved findings it discards changes and marks the PR a draft.
- **Nightly agent** ([`.github/workflows/nightly-agent.yml`](.github/workflows/nightly-agent.yml) → [`.github/scripts/nightly-agent.js`](.github/scripts/nightly-agent.js)) — cron `0 2 * * *` UTC (3 AM UK under BST, 2 AM under GMT) + `workflow_dispatch`. Two-phase plan-then-act: a JSON plan is produced before any file is written. Picks the lowest-ID open backlog task matching `TASK_MODE` (script default `easy`; optional `TASK_CATEGORY` filter), both overridable via GitHub repository variables without a commit — check the repository variables for the values actually in force. Note the `workflow_dispatch` input `task_mode` carries `default: 'easy'`, which wins over the repository variable on manual runs — tracked as T77 in [`docs/nightly-agent-backlog.md`](docs/nightly-agent-backlog.md). **Implement payload guard:** before each implement API call, file content must not exceed `MAX_IMPLEMENT_FILE_BYTES` (102400 bytes / 100 KiB UTF-8); oversize files return `{ ok: false, reason: 'file_too_large' }` — the run skips that task (increments attempts, appends a backlog note), resets the agent branch, and tries the next eligible task in the same run (bounded by open tasks for the mode and the 10-call API budget). On success: moves the task to completed and raises a normal PR (including any skip notes accumulated in backlog). On implement/test failure (non-oversize): discards code, increments the attempt counter, and raises a draft PR. If every eligible task is skipped for oversize in one run: commits backlog updates to a `nightly-agent/backlog-skips-*` branch and pushes — no PR. PR-history exclusion (`gh pr list --state all`) prevents re-picking a task that already has any PR. Hard cap of **10 Anthropic API calls** per run; up to **3** test/fix attempts per task.
- **Nightly e2e** ([`.github/workflows/nightly-e2e.yml`](.github/workflows/nightly-e2e.yml)) — same schedule; restores/builds the three APIs, then runs the Playwright suite via the four-server `webServer`; publishes JUnit results. Not on PR builds.
- **Sensitive-path guard** ([`.github/scripts/sensitive-paths.js`](.github/scripts/sensitive-paths.js)) — shared by both bots; agentic scripts may not auto-modify: `.github/`, `.husky/`, `package.json`, `package-lock.json`, `*.csproj`, `*.sln`, `tsconfig.json`, `Dockerfile`, `.npmrc`, `.env*`, and any EF `Migrations/` directory. Findings touching these are demoted to advisory.

**Backlog protocol:** open tasks live in
[`docs/nightly-agent-backlog.md`](docs/nightly-agent-backlog.md) (authoritative —
T-numbers, difficulty, stack, category, attempts, notes). When working a backlog
task, update its row (status, attempts, notes) in the same commit as the code
change. Completed tasks move to
[`docs/nightly-agent-completed.md`](docs/nightly-agent-completed.md).

**Agent eligibility:** tasks targeting files over 100 KiB in the implement prompt are not agent-runnable until the file is split or the task scope changes — the guard skips them cleanly rather than failing silently. Use `blocked` status (with a note) for tasks that remain human-only after T73; do not expect the agent to complete them. **Skip notes:** when the guard fires, `attempts` increments and `notes` appends a `Skipped: file exceeds implement payload limit (...)` entry via `applyOversizedTaskSkip` — no draft PR for that skip alone.

## Known gaps

Kept visible deliberately — do not paper over:

- **Lint and secret-scanning coverage gap** — ESLint (including `eslint-plugin-no-secrets`) is configured only in `client/eslint.config.js` and matches `**/*.{ts,tsx}`. There is no root ESLint config, so neither the .NET projects nor `.github/scripts/*.js` are linted or secret-scanned at the code level. The `// eslint-disable-next-line no-console` comments in those scripts are inert — no ESLint run ever reaches them. Flag likely secrets in backend and automation-script source manually.
- **Large single-file docs** — `learning-notes.md` is well over the nightly agent implement limit (100 KiB); docs-only backlog tasks that require sending the full file remain human-only until the file is split or the task is re-scoped.
- **T58 — IncidentsApi hooks retrofit** — Incidents screens still use inline `useState`/`useEffect` instead of the `useAudits`/`useAudit`-style hooks. Tracked in the backlog.
- **Items legacy CSS** — `ItemsList.css` / legacy `App.css` classes remain by design (demo scaffold). Not a gap to close unprompted.

## Data protection

This project sits in a healthcare context; GDPR and HIPAA principles apply.

- **No real data, ever** — no NHS numbers, patient IDs, dates of birth, real client/organisation names, or realistic personal fixtures in prompts, code, tests, or sample data. Use synthetic or redacted data only.
- **Data minimisation** — include only what is strictly necessary in a prompt; strip identifiers from logs and stack traces before sharing.
- **No production access** — never connect to or query production databases; no production connection strings or credentials in source.
- **The practical rule:** if in doubt, leave it out.
