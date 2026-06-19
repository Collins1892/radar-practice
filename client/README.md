# Radar Practice — Frontend

React 19 + TypeScript + Vite frontend covering three domains: an **items catalogue** (list and add items), an **incident reporting module** (create, view, edit, and filter incidents), and an **audits module** (the same CRUD shape, migrated from a legacy .NET 4 / AngularJS implementation), backed by three .NET 8 minimal APIs.

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

Items API must be running on port 5133. Incidents API must be running on port 5134. Audits API must be running on port 5135.

## Test

```bash
npm test
```

Runs the Vitest suite — component, integration, and unit tests.

## E2E tests

```bash
npx playwright test
```

Runs Playwright e2e tests from `client/e2e/`. Currently a smoke test only (app loads, title correct) — requires only the Vite dev server. Key user journeys (Week 5) will require ItemsApi (5133), IncidentsApi (5134), and AuditsApi (5135).

## Documentation

See the [root README](../README.md) for full project documentation, architecture, and AI tooling observations.
