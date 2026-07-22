# Radar Practice — Frontend

React 19 + TypeScript + Vite frontend covering three domains: an **items catalogue** (demo learning scaffold — list and add only; warning banner on `/items`), an **incident reporting module** (create, view, edit, delete, and filter incidents), and an **audits module** (full CRUD shape, migrated from a legacy .NET 4 / AngularJS implementation), backed by three .NET 8 minimal APIs. The Items module is a demo learning scaffold — included for agentic-workflow practice only, not intended for production use. Incidents and Audits are the reference feature modules.

## Prerequisites

- Node.js 24

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Items API must be running on port 5133. Incidents API must be running on port 5134. Audits API must be running on port 5135. The Items API is required for `/items` and the items e2e journey (`/` redirects to `/components` and does not need Items API); it is not a finished production module.

## Test

```bash
npm test
```

Runs the Vitest suite — component, integration, and unit tests.

## E2E tests

```bash
npx playwright test
```

Runs Playwright e2e tests from `e2e/`. Nine Playwright tests: 3 smoke (`app.spec.ts`) plus items, components, 3 incidents, and 1 audit journey specs under `e2e/journeys/`. Playwright's `webServer` config boots all four servers automatically — ItemsApi (5133), IncidentsApi (5134), AuditsApi (5135), and Vite (5173). In CI, the [nightly e2e workflow](../.github/workflows/nightly-e2e.yml) runs the same suite on a 3 AM UK (BST) cron (`workflow_dispatch` + schedule), with explicit `dotnet restore`/`build` before `dotnet run --no-build` for cold-start hardening; `dorny/test-reporter` publishes JUnit results.

## Documentation

See the [root README](../README.md) for full project documentation, architecture, and AI tooling observations.
