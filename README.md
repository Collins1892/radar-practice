# radar-practice

[![CI](https://github.com/Collins1892/radar-practice/actions/workflows/ci.yml/badge.svg)](https://github.com/Collins1892/radar-practice/actions/workflows/ci.yml)
[![Docs: Context7](https://img.shields.io/badge/docs-Context7-blue)](https://context7.com)

A full-stack practice project built to explore **agentic AI development** — using AI coding agents (Claude Code and Cursor) to scaffold, extend, test, and maintain a real application under human direction.

This is not a production system. It is a deliberately small codebase that demonstrates how AI-assisted workflows behave in practice: what agents do well, where they stall, and why human review remains essential.

The project covers two domains: an **items catalogue** (the initial safe practice domain) and an **incident reporting module** (healthcare-relevant, added in Week 3) — built as a standalone API and full React frontend using a shared reusable component library.

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

## Architecture

Illustrative layout — not an exhaustive file inventory. See [CLAUDE.md](CLAUDE.md) for the full agent-oriented repo map.

```
radar-practice/
├── ItemsApi/              # .NET 8 minimal API (GET/POST /items), EF Core + SQLite
├── ItemsApi.Tests/        # xUnit integration tests (13 tests)
├── IncidentsApi/          # .NET 8 minimal API (GET/POST/PUT /incidents, GET /incidents/{id}), EF Core + SQLite
├── IncidentsApi.Tests/    # xUnit integration tests (23 tests)
├── client/                # React + TypeScript + Vite frontend
│   ├── src/api/incidents.ts               # Typed fetch layer for IncidentsApi
│   ├── src/components/IncidentsView.tsx   # Incident list with filters, sort, pagination
│   ├── src/components/IncidentForm.tsx    # Shared create/edit form (mode prop)
│   ├── src/components/IncidentCreateView.tsx # Thin wrapper — mode=create
│   ├── src/components/IncidentDetailView.tsx # Read-only detail view
│   ├── src/components/IncidentEditView.tsx   # Thin wrapper — mode=edit
│   ├── src/components/IncidentPageChrome.tsx # Shared page chrome (h1 + back link)
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
│   └── component-builder/
├── .github/workflows/     # GitHub Actions CI
└── learning-notes.md      # Daily observations from the build
```

| Layer | Stack |
|-------|-------|
| Items API | .NET 8, minimal APIs, repository pattern, EF Core + SQLite (`app.db`) |
| Incidents API | .NET 8, minimal APIs, repository pattern, EF Core + SQLite (`incidents.db`), Severity/Status as int enums |
| Backend tests | xUnit, `TestWebApplicationFactory` (in-memory SQLite per project), NSubstitute — 13 ItemsApi + 23 IncidentsApi tests |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, react-router-dom — routes include `/`, `/components`, `/incidents`, and incident create/detail/edit |
| Frontend tests | Vitest, `@testing-library/react`; Playwright e2e (smoke test, key journeys Week 5) |
| CI | GitHub Actions — `dotnet test` (both APIs) and `npm test` (Vitest) on push/PR to `main` |

> **Note:** Each API uses its own SQLite database (`app.db` for items, `incidents.db` for incidents). Both are local only and not committed.

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
- Six repo-level skills: `dotnet-test-writer`, `react-test-writer`, `playwright-test-writer`, `code-reviewer`, `wcag`, `component-builder`.
- Test-writer skills are built after real code exists — the agent reads real patterns before writing anything. Build-guide skills (e.g. wcag) should be built before feature work to prevent retrofitting.
- Skills drive consistent output across sessions and developers — the direct fix for the confirmed Core team reusable-patterns problem.

**Two independent reviews catch different things**
- Claude Code `/review` and Cursor review consistently flag different issues on the same diff. Running both for significant PRs is now a firm discipline — neither alone is complete.

**WCAG 2.2 AA — layered accessibility approach**
- Accessibility was built in four layers: component primitives, screen composition, app shell, and interaction patterns.
- A dedicated `wcag` skill drives systematic audits — one component or screen at a time, findings-only report, then targeted fix prompts.
- Building the wcag skill before screen-level work would have been more efficient — components would have been built correctly from the start rather than retrofitted.
- WCAG at screen and shell level is substantially more work than component-level fixes. Budget accordingly.

**Radix/shadcn testing gotchas**
- Radix Select requires `Element.prototype.scrollIntoView = vi.fn()` in jsdom tests (now global in `setup.ts`).
- Any component using `Link`, `NavLink`, or `useNavigate` must be wrapped in `MemoryRouter` in tests.
- UTC date serialization: use `format(date, 'yyyy-MM-dd')` (local date) not UTC getters — affects users in UTC+ timezones.

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

### Run the tests

```bash
dotnet test ItemsApi.Tests/ItemsApi.Tests.csproj
dotnet test IncidentsApi.Tests/IncidentsApi.Tests.csproj
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

Currently a smoke test only (app loads, title correct) — requires only the Vite dev server. Key user journeys (Week 5) will require ItemsApi (5133) and IncidentsApi (5134).

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

Both APIs allow CORS from `http://localhost:5173`. Incidents routes use direct CORS fetch — not proxied like `/items`.

### CI

Pushes and pull requests targeting `main` trigger the [CI workflow](.github/workflows/ci.yml), which runs `dotnet test` and `npm test` (Vitest) on Ubuntu. The workflow fails if any test fails.
