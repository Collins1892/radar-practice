# Radar Practice — Frontend

React 19 + TypeScript + Vite frontend covering two domains: an **items catalogue** (list and add items) and an **incident reporting module** (create, view, edit, and filter incidents), backed by two .NET 8 minimal APIs.

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

Items API must be running on port 5133. Incidents API must be running on port 5134.

## Test

```bash
npm test
```

Runs the Vitest suite — component, integration, and unit tests (125 tests across 20 files).

## E2E tests

```bash
npx playwright test
```

Runs Playwright e2e tests from `client/e2e/`. Requires both APIs and the Vite dev server running. Key user journeys deferred to Week 5 — currently a smoke test only.

## Documentation

See the [root README](../README.md) for full project documentation, architecture, and AI tooling observations.
