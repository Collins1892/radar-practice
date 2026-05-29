# radar-practice

[![CI](https://github.com/Collins1892/radar-practice/actions/workflows/ci.yml/badge.svg)](https://github.com/Collins1892/radar-practice/actions/workflows/ci.yml)
[![Docs: Context7](https://img.shields.io/badge/docs-Context7-blue)](https://context7.com)

A full-stack practice project built to explore **agentic AI development** — using AI coding agents (Claude Code and Cursor) to scaffold, extend, test, and maintain a real application under human direction.

This is not a production system. It is a deliberately small codebase that demonstrates how AI-assisted workflows behave in practice: what agents do well, where they stall, and why human review remains essential.

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

```
radar-practice/
├── ItemsApi/              # .NET 8 minimal API (GET/POST /items)
├── ItemsApi.Tests/        # xUnit integration tests (12 tests)
├── client/                # React + TypeScript + Vite frontend
│   ├── src/App.test.tsx              # Vitest App integration tests — 8 tests
│   ├── src/components/ItemsList.test.tsx  # Vitest component tests — 5 tests
│   ├── src/guards.test.ts              # Vitest unit tests — 20 tests
│   ├── src/errors.test.ts              # Vitest unit tests — 9 tests
│   └── src/test/setup.ts             # Vitest setup
├── .github/workflows/     # GitHub Actions CI
└── learning-notes.md      # Daily observations from the build
```

| Layer | Stack |
|-------|-------|
| API | .NET 8, minimal APIs, in-memory repository |
| Backend tests | xUnit, `WebApplicationFactory`, NSubstitute (12 tests) |
| Frontend | React 19, TypeScript, Vite |
| Frontend tests | Vitest, `@testing-library/react` — `client/src/App.test.tsx`, `client/src/components/ItemsList.test.tsx`, `client/src/guards.test.ts`, `client/src/test/setup.ts` (42 tests) |
| CI | GitHub Actions — `dotnet test` and `npm test` (Vitest) on push/PR to `main` |

> **Note:** Items are stored in-memory via `InMemoryItemsRepository` and are lost when the API restarts. SQLite persistence is planned for a future session.

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

### Run the API

```bash
cd ItemsApi
dotnet run
```

The API listens on `http://localhost:5133`.

### Run the tests

```bash
dotnet test ItemsApi.Tests/ItemsApi.Tests.csproj
```

From `client/`:

```bash
cd client
npm test
```

### Run the frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/items` requests to the API on port 5133.

To call the API directly from the browser (without the proxy), copy `client/.env.example` to `client/.env` and uncomment `VITE_API_URL`. The API already allows CORS from `http://localhost:5173`.

### CI

Pushes and pull requests targeting `main` trigger the [CI workflow](.github/workflows/ci.yml), which runs `dotnet test` and `npm test` (Vitest) on Ubuntu. The workflow fails if any test fails.
