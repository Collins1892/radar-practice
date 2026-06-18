# CLAUDE.md

This file provides guidance for AI agents working in this repository. It defines the project context, conventions, and boundaries that should be followed in every session. Read this before taking any action.

## Project overview

This is a full-stack learning project built to demonstrate agentic AI 
development practices. It is not a production system.

**Domain:** Items catalogue — a simple API and frontend used as a safe, 
realistic practice domain. No patient data, no production dependencies.

**Purpose:** To demonstrate how AI agents can be directed to scaffold, 
extend, test, and maintain a real application under human direction — 
mirroring the kind of work done on a healthcare SaaS modernisation programme.

**Incident reporting module added in Week 3** as a standalone IncidentsApi 
project — separate API, separate IncidentsDbContext, separate incidents.db. 
Mirrors microservices direction without over-engineering.

**Repo layout:**
- `ItemsApi/` — .NET 8 minimal API
- `ItemsApi/Data/AppDbContext.cs` — EF Core DbContext for ItemsApi (`DbSet<Item>` only)
- `ItemsApi/Repositories/EfItemsRepository.cs` — EF Core repository implementation
- `ItemsApi/Migrations/` — EF Core migrations
- `ItemsApi.Tests/` — xUnit integration tests
- `ItemsApi.Tests/TestWebApplicationFactory.cs` — SQLite in-memory test factory
- `IncidentsApi/` — standalone .NET 8 minimal API for incident reporting
- `IncidentsApi/Data/IncidentsDbContext.cs` — dedicated DbContext (incidents.db)
- `IncidentsApi/Repositories/EfIncidentRepository.cs` — EF Core repository implementation
- `IncidentsApi/Migrations/` — EF Core migrations
- `IncidentsApi.Tests/` — xUnit integration tests
- `IncidentsApi.Tests/TestWebApplicationFactory.cs` — SQLite in-memory test factory
- `client/` — React TypeScript Vite frontend
- `client/src/components/ui/` — shadcn generated components (vendor, ESLint-ignored)
- `client/src/components/` — hand-authored app components (Badge, LoadingState, EmptyState, ErrorState, FormField, SelectField, DatePickerField, DataTable, Pagination, ComponentsView, IncidentsView, IncidentForm, IncidentCreateView, IncidentDetailView, IncidentEditView, IncidentPageChrome, InlineAlert, Modal)
- `client/src/api.ts` — typed fetch layer for ItemsApi (fetchItems, createItem)
- `client/src/api/incidents.ts` — typed fetch layer for IncidentsApi (fetchIncidents, createIncident, getIncident, updateIncident, shared helpers incidentUserMessage, parseIncidentId)
- `client/src/types.ts` — shared TypeScript types (e.g. `Item`, `CreateItemRequest`)
- `client/src/errors.ts` — `ApiClientError` and `toUserMessage` error mapping
- `client/src/guards.ts` — runtime type guards for API response parsing
- `client/src/componentRegistry.tsx` — registry of all components for the components view (has file-level eslint-disable — see decisions log)
- `client/src/components/formFieldUtils.ts` — shared form utility (formFieldErrorId)
- `client/src/components/incidentDisplay.ts` — shared incident display helpers — badge variants, status label, reported-date formatter, severity/status/filter option lists
- `client/src/pageTitle.ts` — per-route document.title helper (SITE_TITLE, formatPageTitle)
- `client/src/lib/utils.ts` — shadcn `cn()` utility (vendor, ESLint-ignored)
- `client/components.json` — shadcn configuration
- `client/src/**/*.test.{ts,tsx}` — Vitest tests
- `client/src/test/setup.ts` — Vitest setup
- `client/e2e/` — Playwright e2e tests
- `package.json` (repo root) — scripting-only Node package for repo automation scripts. Scripts: `npm run pr-review` (automated PR review), `npm run nightly-agent` (autonomous backlog agent), `npm test` (runs `pr-review.test.js` + `nightly-agent.test.js`). Unrelated to the `client/` workspace — do not confuse the two or add client dependencies here; frontend packages belong in `client/package.json`.
- `.github/scripts/` — repo automation scripts: `pr-review.js` (automated PR review), `nightly-agent.js` (nightly autonomous agent), `pr-review.test.js`, `nightly-agent.test.js`
- `docs/nightly-agent-backlog.md` — open tasks for the nightly agent (authoritative source; T-numbers, difficulty, stack, category, attempts, notes)
- `docs/nightly-agent-completed.md` — completed tasks log (moved from backlog on merge)
- `.github/workflows/` — GitHub Actions CI
- `.claude/skills/` — repo-level agent skills
- `.claude/commands/` — Claude Code slash commands (`/review`, `/standup`, `/observations`, `/tidy`)
- `.cursor/rules/` — Cursor agent conventions (mirrors CLAUDE.md)
- `learning-notes.md` — daily observations from the build
- `docs/workflow-friction.md` — running workflow friction log (feeds Week 6 AI impact narrative)
- `private/seven-week-plan.md` — master plan, decisions log, daily structure (private file: agent-readable, not committed)
- `private/phase-1-foundation.md` — Weeks 1–2 complete (private file: agent-readable, not committed)
- `private/phase-2-build.md` — Weeks 3–5, Week 3 complete; Week 4 in progress (private file: agent-readable, not committed)
- `private/phase-3-articulate.md` — Weeks 6–7 (private file: agent-readable, not committed)
- `private/original-plan.md` — original plan shared (private file: agent-readable, not committed)
- `private/job-advert.md` — live job advert (June 2026), (private file: agent-readable, not committed)

## Tech stack

**Backend:**
- .NET 8.0 minimal API
- C# with repository pattern and dependency injection
- Entity Framework Core 8.0.27 with SQLite (`Microsoft.EntityFrameworkCore.Sqlite`)
- `AppDbContext` — ItemsApi only. IncidentsApi uses its own IncidentsDbContext 
  in `IncidentsApi/Data/`. Two separate SQLite databases: `app.db` (items), 
  `incidents.db` (incidents). Severity and Status enums stored as int for 
  correct sort order and query performance.
- `EfItemsRepository` implements `IItemsRepository` — scoped lifetime, `AsNoTracking()` for reads
- `Price` stored as TEXT via `HasConversion<string>()` for exact decimal precision
- `Name` has `HasMaxLength(100)` in `OnModelCreating` — enforced at app layer, documented in schema
- Database file: `app.db` (local only, never committed — `.gitignore` covers `*.db`, `*.db-shm`, `*.db-wal`)
- xUnit 2.5.3 for integration tests using `TestWebApplicationFactory`
- `TestWebApplicationFactory` — ItemsApi.Tests and IncidentsApi.Tests each swap their DbContext for a kept-open `DataSource=:memory:` SQLite connection; schema applied via `Database.Migrate()`
- NSubstitute 5.1.0 for mocking
- Microsoft.AspNetCore.Mvc.Testing 8.0.0

**Frontend:**
- React 19.2.6 with TypeScript 6.0.2
- Vite 8.0.12 for bundling
- `react-router-dom` 7.16.0 — client-side routing (`BrowserRouter` in `main.tsx`, `NavLink` and `Routes` in `App.tsx`). Routes: `/` (items), `/components`, `/incidents`, `/incidents/create`, `/incidents/:id`, `/incidents/:id/edit`
- Tailwind CSS 4.3.0 via `@tailwindcss/vite` 4.3.0 plugin
- shadcn/ui — Nova preset, Radix component library, `components.json` config
- `radix-ui` 1.4.3 and `@radix-ui/react-slot` 1.2.4 (Radix primitives)
- `class-variance-authority` 0.7.1, `clsx` 2.1.1, `tailwind-merge` 3.6.0 (shadcn utilities)
- `lucide-react` 1.17.0 (icons)
- ESLint 10.3.0 with typescript-eslint
- Prettier 3.8.3 with semicolons enabled, single quotes, trailing commas
- Vitest 4.1.7 for component, integration, and unit tests (RTL where UI is involved) with @testing-library/react 16.3.2, @testing-library/jest-dom 6.9.1, @testing-library/user-event 14.6.1, and jsdom 29.1.1
- `@playwright/test` 1.60.0 — e2e tests, Chromium only. Key user journeys deferred to Week 5.
- `date-fns` 4.4.0 — date formatting utilities
- `react-day-picker` 10.0.1 — calendar component used by shadcn Calendar
- `sonner` 2.0.7 — toast notifications; mount `<Toaster />` from `@/components/ui/sonner` at app shell level

**CSS approach:**
New components use Tailwind CSS and shadcn/ui. Items catalogue components (`App.tsx`, `ItemsList`) are partially migrated — some Tailwind classes are in use, but `ItemsList.css` and legacy classes in `App.css` remain. Do not add new legacy CSS. Theme tokens defined as CSS variables (OKLCH) in `src/index.css` under `@theme inline`. Use `cn()` (clsx + tailwind-merge) for class composition.
The global `button {}` rule has been removed from `App.css` — all buttons now carry explicit Tailwind classes.
Dark mode: `@custom-variant dark` uses the Tailwind v4 block form responding to both `.dark` class and `prefers-color-scheme: dark`. All three sync points (`.dark` class, media query, `@custom-variant`) must be kept in sync when tokens change.

**Tooling:**
- Node.js 24 (LTS)
- Husky 9.1.7 pre-commit hooks — ESLint, Prettier, TypeScript check
- lint-staged 17.0.5 — only checks staged files
- GitHub Actions CI — `dotnet test` and `npm test` (Vitest) on every push and PR to main
- Branch protection — all changes via PR, CI must pass before merge

**AI tools used:**
- Claude Code for terminal-based agentic tasks
- Cursor for editor-based agentic work
- Context7 MCP for live library documentation

**Version discipline:**
The versions listed above must stay in sync with `package.json` and
`.csproj` at all times. When upgrading any package, update this file
and any affected skill files in `.claude/skills/` as part of the same
task. Stale versions here cause agents to use wrong API assumptions.
When updating a skill file, update any version strings in the
description frontmatter and any code examples that reference the
changed library API.

## Code conventions

**TypeScript:**
- No explicit `any` types — enforced by ESLint
- No unused imports or variables — enforced by ESLint
- Explicit function return types required
- No non-null assertion operator (`!`)
- Semicolons on, single quotes, trailing commas

**React:**
- React hooks rules enforced — no conditional hooks
- Exhaustive useEffect dependencies required
- No console.log in committed code
- No debugger statements

**C#:**
- Repository pattern — controllers depend on interfaces, not concrete classes
- Dependency injection via .NET built-in DI container
- Global exception handler covers unhandled exceptions — do not add
  per-endpoint try/catch; the handler returns a consistent
  `{ error: "..." }` shape and never exposes stack traces to the client

**General:**
- Small focused commits with descriptive messages
- All changes via feature branch and PR — no direct pushes to main
- AI-generated code must be reviewed before committing
- Positive examples preferred over negative rules — show the pattern, not just what to avoid

## Testing approach

**Backend — xUnit integration tests:**
- Use TestWebApplicationFactory to spin up real in-process API
- One focused prompt per test generation — never ask for multiple tests at once
- Tests should cover happy path and all failure cases
- Use NSubstitute for mocking repository dependencies
- Run ItemsApi tests with: `dotnet test ItemsApi.Tests/ItemsApi.Tests.csproj`
- Run IncidentsApi tests with: `dotnet test IncidentsApi.Tests/IncidentsApi.Tests.csproj`

**Frontend — Vitest:**
- Vitest is the React test runner; run from `client/` with `npm test` (`vitest run`)
- Test setup file: `client/src/test/setup.ts` — registers jest-dom matchers, `afterEach(cleanup)` from React Testing Library, and global `Element.prototype.scrollIntoView = vi.fn()`
- Vitest config lives in `client/vite.config.ts` — `pool: 'threads'` is required on Windows (the default forks pool times out)
- Vitest only runs files under `src/` — `e2e/` is excluded via the `include` config
- Test behaviour not implementation details

**Frontend — component tests** (e.g. `client/src/components/ItemsList.test.tsx`):
- Render the component in isolation with props; no API calls
- Cover key UI states — loading, error, empty, populated
- Use a small render helper when the same props recur

**Frontend — App integration tests** (e.g. `client/src/App.test.tsx`):
- Render full `App` and mock `./api` with `vi.mock` — do not mock presentational children
- Exercise mount → fetch → list states, form validation, submit, and refresh through the real component tree
- Use `vi.mocked(...).mockReset()` in `beforeEach` and `findBy*` for async UI

**Frontend — unit tests** (e.g. `client/src/guards.test.ts`, `client/src/errors.test.ts`):
- Pure functions; no RTL; no `vi.mock('./api')`
- Same Arrange / Act / Assert comments and explicit `(): void` return types as other Vitest tests
- When changing `api.ts` parsing or `guards.ts`, add or update tests in `client/src/guards.test.ts`
- When changing `errors.ts`, add or update tests in `client/src/errors.test.ts` using the same style as guards — one test per prompt, AAA, no RTL

**End-to-end — Playwright 1.60.0:**
- Installed with Chromium only. Smoke test: app loads, title correct (`client/e2e/app.spec.ts`)
- Key user journeys deferred to Week 5
- Nightly cron schedule deferred to Week 5 — e2e tests do not run on PR builds
- Run from `client/` with `npx playwright test`; start ItemsApi and IncidentsApi first for journey tests

**CI:**
- .NET tests and Vitest run on every push and PR to main
- Playwright e2e does not run on PR builds — nightly cron deferred to Week 5
- PR cannot merge until all checks pass

**Agent guidance:**
- Generate one test at a time — stalling occurs with multiple test requests
- Always verify tests pass after generation — run `dotnet test` for API changes, `npm test` in `client/` for frontend changes, `npx playwright test` in `client/` for e2e changes (start ItemsApi and IncidentsApi when the journey needs data)
- Integration tests are preferred for API endpoints
- Do not remove or edit existing tests without explicit instruction

## What the agent should do

- Make small, focused changes — one task at a time
- Use Plan mode for any non-trivial task — show the full plan before touching files
- Include `use context7` upfront in prompts when working with specific library APIs
- Run tests after every change and confirm they pass — `dotnet test` for API changes, `npm test` in `client/` for frontend changes, `npx playwright test` from `client/` for e2e changes (start ItemsApi and IncidentsApi first for journey tests)
- Match existing code style and patterns — repository pattern, typed responses, explicit return types
- Explain non-obvious architectural decisions unprompted
- Use the repository pattern for all new data access
- Add tests for any new endpoint or business logic
- Verify the build compiles before declaring a task done
- Ask for clarification if a task is ambiguous rather than guessing
- Use descriptive commit messages when asked to commit
- Follow the TypeScript conventions defined above — no any, explicit return types
- Check `.claude/skills/` for relevant skills before starting a task — available skills: `dotnet-test-writer`, `react-test-writer`, `playwright-test-writer`, `code-reviewer`, `wcag`, `component-builder`, `modernisation`
- When working on backlog tasks, read `docs/nightly-agent-backlog.md` to understand current task status and update the row (status, attempts, notes) as part of the same commit as the code change
- Check `.claude/commands/` for relevant slash commands — `/review`, `/standup`, `/observations`, `/tidy`
- Place hand-authored components in `client/src/components/` — never in `client/src/components/ui/` (shadcn vendor directory)

## What the agent should not do

- Never include PII, patient data, NHS numbers, or any identifiable information in prompts
- Never connect to or query production databases
- Never commit or push changes without being explicitly asked to. Show changes only — the developer commits.
- Never force push (`git push --force` or `--force-with-lease`) without explicit instruction
- Never raise pull requests via `gh pr create`
- Never post comments on pull requests via `gh pr review`
- Never run destructive operations (delete files, drop tables) without confirmation
- Never make large unsupervised refactors across multiple files without a clear goal
- Never generate multiple tests in one prompt — ask for one at a time
- Never skip the test run after making changes
- Never expose stack traces or internal error details to the client
- Never use `any` types, non-null assertions, or disable ESLint rules — the one documented exception is the file-level disable in `componentRegistry.tsx` (see decisions log)
- Never over-engineer — only add what is directly requested
- Always provide shell commands and code snippets in fenced code blocks
- Never assume a task is complete without verifying the build and tests pass
- Never translate AngularJS patterns directly to React — rewrite using
  idiomatic React (hooks, component composition, separation of concerns).
  Legacy code is a reference for *what* to build, not *how* to build it.

## GDPR and data protection

This project operates in a healthcare context. GDPR and HIPAA apply to
any system handling personal data about patients, staff, or clients.

**Key principles for AI-assisted development:**

- **Lawfulness** — there is no lawful basis for using real patient data
  in development. Use synthetic or redacted data only.
- **Data minimisation** — only include what is strictly necessary in
  prompts. Strip everything that isn't needed to solve the technical
  problem.
- **Privacy by design** — controls are built into the workflow, not
  added afterwards. Redacted databases, no production access, and
  prompt hygiene are the controls.

**Prompt hygiene checklist — before sending any prompt:**
- No NHS numbers, patient IDs, or dates of birth
- No real client or organisation names
- No stack traces or logs containing identifiable information
- No test fixtures with realistic-looking personal data

**International context:**
HIPAA applies to US operations. Middle East jurisdictions will have their own
requirements — confirm with legal before any data handling decisions
in those markets. Key HIPAA addition: Protected Health Information (PHI)
has specific technical safeguard requirements — encryption at rest and
in transit, audit logs, minimum necessary access. Prompt hygiene rules
apply equally under GDPR and HIPAA.

**Consequences of getting this wrong:**
ICO fines up to £17.5 million or 4% of global turnover. HIPAA
penalties up to $1.9 million per violation category per year. Client
trust destroyed. Reputational damage. Potential criminal liability
under the Data Protection Act 2018.

**The practical rule:** 
If in doubt, leave it out.
