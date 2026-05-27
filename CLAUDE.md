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

**Planned additions:** Incident reporting module (week 3) to add 
healthcare domain context relevant to the target production environment.

**Repo layout:**
- `ItemsApi/` — .NET 8 minimal API
- `ItemsApi.Tests/` — xUnit integration tests
- `client/` — React TypeScript Vite frontend
- `.github/workflows/` — GitHub Actions CI
- `.claude/skills/` — repo-level agent skills
- `learning-notes.md` — daily observations from the build

## Tech stack

**Backend:**
- .NET 8.0 minimal API
- C# with repository pattern and dependency injection
- xUnit 2.5.3 for integration tests using WebApplicationFactory
- NSubstitute 5.1.0 for mocking
- Microsoft.AspNetCore.Mvc.Testing 8.0.0

**Frontend:**
- React 19.2.6 with TypeScript 6.0.2
- Vite 8.0.12 for bundling
- ESLint 10.3.0 with typescript-eslint
- Prettier 3.8.3 with semicolons enabled, single quotes, trailing commas
- CSS with custom properties and breakpoint variables
- Vitest for unit tests (coming in week 3)
- Playwright for e2e tests (coming in week 3)

**Tooling:**
- Node.js 24 (LTS)
- Husky 9.1.7 pre-commit hooks — ESLint, Prettier, TypeScript check
- lint-staged 17.0.5 — only checks staged files
- GitHub Actions CI — dotnet test on every push and PR to main
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
- Explicit error handling with try/catch on all endpoints
- Global exception handler middleware — never expose stack traces to client

**General:**
- Small focused commits with descriptive messages
- All changes via feature branch and PR — no direct pushes to main
- AI-generated code must be reviewed before committing
- Positive examples preferred over negative rules — show the pattern, not just what to avoid

## Testing approach

**Backend — xUnit integration tests:**
- Use WebApplicationFactory to spin up real in-process API
- One focused prompt per test generation — never ask for multiple tests at once
- Tests should cover happy path and all failure cases
- Use NSubstitute for mocking repository dependencies
- Run tests with: `dotnet test ItemsApi.Tests/ItemsApi.Tests.csproj`

**Frontend — Vitest unit tests (coming week 3):**
- Component tests for key UI states — loading, error, empty, populated
- Test behaviour not implementation details

**End-to-end — Playwright (coming week 3):**
- Key user journeys — view items, add item, error state
- Runs nightly via GitHub Actions cron schedule

**CI:**
- .NET tests run on every push and PR to main
- Vitest and Playwright to be added in week 3
- PR cannot merge until all checks pass

**Agent guidance:**
- Generate one test at a time — stalling occurs with multiple test requests
- Always verify tests pass after generation with `dotnet test`
- Integration tests are preferred for API endpoints
- Do not remove or edit existing tests without explicit instruction

## What the agent should do

- Make small, focused changes — one task at a time
- Run tests after every change and confirm they pass
- Match existing code style and patterns — repository pattern, typed responses, explicit return types
- Explain non-obvious architectural decisions unprompted
- Use the repository pattern for all new data access
- Add tests for any new endpoint or business logic
- Verify the build compiles before declaring a task done
- Ask for clarification if a task is ambiguous rather than guessing
- Use descriptive commit messages when asked to commit
- Follow the TypeScript conventions defined above — no any, explicit return types
- Check `.claude/skills/` for relevant skills before starting a task

## What the agent should not do

- Never include PII, patient data, NHS numbers, or any identifiable information in prompts
- Never connect to or query production databases
- Never commit or push without being explicitly asked to
- Never run destructive operations (delete files, drop tables, force push) without confirmation
- Never make large unsupervised refactors across multiple files without a clear goal
- Never generate multiple tests in one prompt — ask for one at a time
- Never skip the test run after making changes
- Never expose stack traces or internal error details to the client
- Never use `any` types, non-null assertions, or disable ESLint rules
- Never over-engineer — only add what is directly requested
- Never assume a task is complete without verifying the build and tests pass
- Never translate AngularJS patterns directly to React — rewrite using
  idiomatic React (hooks, component composition, separation of concerns).
  Legacy code is a reference for *what* to build, not *how* to build it.