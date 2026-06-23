---
name: playwright-test-writer
description: Write Playwright end-to-end tests for the React TypeScript client in this project. Use when the user asks to write, add, generate, or create an e2e test, Playwright spec, browser test, or user journey under client/e2e/. One test() per request. Uses @playwright/test 1.60.0 (Chromium only), Arrange/Act/Assert comments, and the page object pattern under client/e2e/pages/. Playwright webServer boots ItemsApi, IncidentsApi, AuditsApi, and Vite automatically. Run npx playwright test from client/ after adding or changing a test. Confirm the suite passes before declaring done. Synthetic data only; no PII. Calibrate effort: think hard for journey tests, page objects, API seeding, or Radix e2e interactions.
---

# Playwright Test Writer

Guides writing Playwright end-to-end tests for the `client/` React TypeScript app.

## Core rules

- **One test per request.** Write one `test(...)` at a time — not a batch. Offer the next test separately.
- **Run tests and confirm pass.** After any change, run `npx playwright test` from `client/` and confirm the suite passes before declaring done.
- **Start APIs when the journey needs data.** Playwright's `webServer` array starts ItemsApi (5133), IncidentsApi (5134), AuditsApi (5135), and Vite (5173) automatically — see [Run tests](#run-tests) and [Playwright gotchas](#playwright-gotchas). Manual `dotnet run` is only needed when debugging API startup outside Playwright.
- **Use Context7** when you need to verify Playwright locator, `expect`, or `webServer` API details:
  1. `mcp__context7__resolve-library-id` with library name + question
  2. `mcp__context7__query-docs` with the resolved ID
- **Test behaviour, not implementation.** Assert what the user sees and can do — not React internals or network call counts unless the scenario explicitly requires it.
- **TypeScript conventions:** no `any`, explicit return types on every test callback and page object method, single quotes, semicolons, trailing commas. No `console.log` or `debugger`.
- **Synthetic data only** — no PII, patient data, or realistic-looking personal identifiers in fixtures (e.g. `E2E Widget`, `E2E spill in corridor B`).
- **Do not remove or edit existing tests** without explicit instruction.
- **Do not change `playwright.config.ts`** unless the user explicitly requests CI or `webServer` work.

## Recommended effort level

Calibrate reasoning depth and runtime setup:

| Situation | Guidance |
|-----------|----------|
| Journey test (items/incidents/audits CRUD), new page object, Radix Select/DatePicker interaction, API seeding via `e2e/support/api.ts`, or API-dependent assertions | **think hard** — confirm which APIs the journey needs (all three are started by default) |
| First spec in a new `*.journey.spec.ts` or shared locators across routes | **think hard** |
| Smoke test (title, nav shell, route loads) following [app.spec.ts](../../../client/e2e/app.spec.ts) | Standard effort — full webServer stack still boots; smoke tests need no live data |

When **think hard** applies, classify smoke vs journey before writing; do not require manual API startup for `npx playwright test`. Prefer accessible locators from [react-test-writer §6](../react-test-writer/SKILL.md#6-accessibility-tests). Do not expand the journey catalog beyond the single `test` requested.

## Tech stack

| Library | Version |
|---------|---------|
| @playwright/test | 1.60.0 |
| Node.js | 24 (LTS) |
| Vite dev server | 8.0.12 (port 5173) |
| React | 19.2.6 |
| TypeScript | 6.0.2 |
| react-router-dom | 7.16.0 |

Run tests with `npx playwright test` from the `client/` directory.

There is no `test:e2e` npm script in `package.json` yet — use `npx playwright test` directly. A future repo change may add `"test:e2e": "playwright test"`.

**Browser:** Chromium only. Install once per machine with `npx playwright install chromium` from `client/`. Do not add Firefox or WebKit `projects` without an explicit repo decision.

## Project layout

```
client/
  playwright.config.ts        — testDir, baseURL, webServer array (3 APIs + Vite)
  vite.config.ts              — dev proxy /items → http://localhost:5133
  index.html                  — page title "Radar Practice" (smoke assertion)
  e2e/
    app.spec.ts               — smoke tests (reference)
    journeys/
      items.journey.spec.ts   — items journeys
      incidents.journey.spec.ts — incidents journeys
      audits.journey.spec.ts  — audits journeys (API seed + soft-delete)
      components.journey.spec.ts — components gallery
    pages/                    — page object classes
      ItemsPage.ts
      IncidentsPage.ts
      IncidentFormPage.ts
      IncidentDetailPage.ts
      AuditsPage.ts
      ComponentsPage.ts
    support/
      api.ts                  — createAudit, deleteAudit, createIncident helpers for e2e seeding
  src/
    App.tsx                   — routes and nav (Items, Incidents, Audits, Components)
    api.ts                    — items fetch (relative /items via Vite proxy)
    api/incidents.ts          — incidents fetch (default http://localhost:5134)
    api/audits.ts             — audits fetch (default http://localhost:5135)
```

### Local e2e dependency flow

```mermaid
flowchart LR
  pw[Playwright]
  vite[Vite_5173]
  itemsApi[ItemsApi_5133]
  incApi[IncidentsApi_5134]
  audApi[AuditsApi_5135]
  pw --> itemsApi
  pw --> incApi
  pw --> audApi
  pw --> vite
  vite -->|proxy_/items| itemsApi
  vite -->|CORS_fetch| incApi
  vite -->|CORS_fetch| audApi
```

## Config ([`client/playwright.config.ts`](../../../client/playwright.config.ts))

Source of truth — do not invent extra options unless the user explicitly requests CI changes:

```typescript
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'dotnet run ... ItemsApi', url: 'http://localhost:5133/items', name: 'ItemsApi', reuseExistingServer: !process.env.CI },
    { command: 'dotnet run ... IncidentsApi', url: 'http://localhost:5134/incidents', name: 'IncidentsApi', reuseExistingServer: !process.env.CI },
    { command: 'dotnet run ... AuditsApi', url: 'http://localhost:5135/audits', name: 'AuditsApi', reuseExistingServer: !process.env.CI },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      name: 'Vite',
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_INCIDENTS_API_URL: 'http://localhost:5134',
        VITE_AUDITS_API_URL: 'http://localhost:5135',
      },
    },
  ],
});
```

| Option | Meaning |
|--------|---------|
| `testDir: './e2e'` | Specs live under `client/e2e/` — separate from Vitest (`src/**/*.{test,spec}.{ts,tsx}`) |
| `use.baseURL` | Specs use relative paths: `page.goto('/')`, `page.goto('/audits')` — not full URLs |
| `webServer` | Playwright starts **four** processes: ItemsApi, IncidentsApi, AuditsApi, and Vite |
| `reuseExistingServer: !process.env.CI` | Locally, reuses already-running servers on their ports; in CI always starts fresh |

### API wiring (journey tests)

| Domain | Client fetch | Dev dependency |
|--------|--------------|----------------|
| Items | Relative `/items` when `VITE_API_URL` unset ([`client/src/api.ts`](../../../client/src/api.ts)) | Vite proxy → `http://localhost:5133` ([`client/vite.config.ts`](../../../client/vite.config.ts)) |
| Incidents | `http://localhost:5134` default ([`client/src/api/incidents.ts`](../../../client/src/api/incidents.ts)) | **IncidentsApi** via webServer; CORS allows `http://localhost:5173` — **no** Vite proxy |
| Audits | `http://localhost:5135` default ([`client/src/api/audits.ts`](../../../client/src/api/audits.ts)) | **AuditsApi** via webServer; CORS allows `http://localhost:5173` — **no** Vite proxy |

Optional manual API startup (debugging only):

```bash
dotnet run --project ItemsApi/ItemsApi.csproj      # http://localhost:5133
dotnet run --project IncidentsApi/IncidentsApi.csproj  # http://localhost:5134
dotnet run --project AuditsApi/AuditsApi.csproj      # http://localhost:5135
```

### CI reality

[`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) runs `dotnet test` and `npm test` (Vitest) only — **no Playwright on PR builds**. Playwright e2e runs nightly via [`.github/workflows/nightly-e2e.yml`](../../../.github/workflows/nightly-e2e.yml) (`workflow_dispatch` + cron). The nightly job pre-restores/builds APIs and uses the same four-server `webServer` config with readiness URLs on each API.

## Positive references

| Test type | Reference file |
|-----------|----------------|
| Smoke | [`client/e2e/app.spec.ts`](../../../client/e2e/app.spec.ts) |
| Items journey | [`client/e2e/journeys/items.journey.spec.ts`](../../../client/e2e/journeys/items.journey.spec.ts) |
| Incidents journey | [`client/e2e/journeys/incidents.journey.spec.ts`](../../../client/e2e/journeys/incidents.journey.spec.ts) |
| Audits journey | [`client/e2e/journeys/audits.journey.spec.ts`](../../../client/e2e/journeys/audits.journey.spec.ts) |
| API seeding helpers | [`client/e2e/support/api.ts`](../../../client/e2e/support/api.ts) |
| Vitest journey patterns (locators, copy) | [`client/src/App.test.tsx`](../../../client/src/App.test.tsx), [`client/src/components/IncidentCreateView.test.tsx`](../../../client/src/components/IncidentCreateView.test.tsx), [`client/src/components/AuditsView.test.tsx`](../../../client/src/components/AuditsView.test.tsx) |
| Page objects | [`client/e2e/pages/ItemsPage.ts`](../../../client/e2e/pages/ItemsPage.ts), [`client/e2e/pages/AuditsPage.ts`](../../../client/e2e/pages/AuditsPage.ts) |

## Return types

| Test kind | Signature |
|-----------|-----------|
| Playwright spec | `async ({ page }): Promise<void>` |
| Page object method | `async methodName(): Promise<void>` (or `Promise<Locator>` when returning a locator) |

## Arrange/Act/Assert pattern

Include the three comment markers in every `test`, even when Arrange is minimal:

```typescript
test('app loads', async ({ page }): Promise<void> => {
  // Arrange
  // (navigation is the act for smoke tests)

  // Act
  await page.goto('/');

  // Assert
  await expect(page).toHaveTitle(/Radar Practice/);
});
```

## Naming convention

Use a behaviour sentence for the test name — same style as the react-test-writer skill:

- `app loads`
- `shows name required when submitting empty name`
- `adds item and displays it in the list`
- `creates incident and shows it on the detail page`

Do **not** use the dotnet-test-writer `Verb_Scenario_Result` prefix.

## Run tests

```bash
# From client/ — once per machine
npx playwright install chromium

# Full suite (ItemsApi, IncidentsApi, AuditsApi, and Vite started by webServer)
npx playwright test
```

Run a single file or test when iterating:

```bash
npx playwright test e2e/app.spec.ts
npx playwright test e2e/journeys/audits.journey.spec.ts
npx playwright test -g "adds item"
```

When debugging API startup failures outside Playwright, start APIs manually in separate terminals (see [API wiring](#api-wiring-journey-tests)), then run `npx playwright test` with `reuseExistingServer` picking up running processes.

## 1. Smoke tests

Minimal checks that do not require pre-seeded API data — safe for quick validation once Playwright is wired.

### Boilerplate

```typescript
import { test, expect } from '@playwright/test';

test('app loads', async ({ page }): Promise<void> => {
  // Arrange
  // (none)

  // Act
  await page.goto('/');

  // Assert
  await expect(page).toHaveTitle(/Radar Practice/);
});
```

### Rules

- File: [`client/e2e/app.spec.ts`](../../../client/e2e/app.spec.ts) — append new smoke tests here unless the user asks for a separate file.
- Use `page.goto('/')` with `baseURL` — do not hard-code `http://localhost:5173` in specs.
- Assert user-visible outcomes: title, nav landmarks, route shell — not network responses.
- No page objects required for trivial smoke tests.

## 2. Page objects

Page objects live under `client/e2e/pages/`. Create the directory and classes when the first journey test needs shared locators — not before.

### Rules

- Page classes expose **locators and small actions** (`goto()`, `fillName()`, `submit()`) — **not** `expect` assertions.
- Specs hold **expect** calls and journey orchestration.
- Prefer **accessible locators** aligned with [react-test-writer](../react-test-writer/SKILL.md): `getByRole`, `getByLabel`, `getByRole('navigation', { name: 'Views' })`.
- Use `readonly` locator fields initialized in the constructor from `Page`.
- Export one class per file; file name matches class name (e.g. `ItemsPage.ts` → `ItemsPage`).

### Boilerplate

```typescript
import type { Locator, Page } from '@playwright/test';

export class ItemsPage {
  readonly nameInput: Locator;
  readonly priceInput: Locator;
  readonly addButton: Locator;

  constructor(private readonly page: Page) {
    this.nameInput = page.getByLabel('Name');
    this.priceInput = page.getByLabel('Price');
    this.addButton = page.getByRole('button', { name: 'Add item' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async fillItem(name: string, price: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.priceInput.fill(price);
  }

  async submit(): Promise<void> {
    await this.addButton.click();
  }
}
```

### AppNav

[`client/src/App.tsx`](../../../client/src/App.tsx) nav uses `aria-label="Views"` and `NavLink` targets:

| Link text | Route |
|-----------|-------|
| Items | `/` |
| Incidents | `/incidents` |
| Audits | `/audits` |
| Components | `/components` |

```typescript
export class AppNav {
  constructor(private readonly page: Page) {}

  async goToItems(): Promise<void> {
    await this.page.getByRole('navigation', { name: 'Views' }).getByRole('link', { name: 'Items' }).click();
  }

  async goToIncidents(): Promise<void> {
    await this.page.getByRole('navigation', { name: 'Views' }).getByRole('link', { name: 'Incidents' }).click();
  }

  async goToAudits(): Promise<void> {
    await this.page.getByRole('navigation', { name: 'Views' }).getByRole('link', { name: 'Audits' }).click();
  }
}
```

### Incident form locators

Match Vitest patterns in [`IncidentCreateView.test.tsx`](../../../client/src/components/IncidentCreateView.test.tsx):

- `page.getByLabel(/^Title/)`, `/^Description/`, `/^Location/`, `/^Reported date/`, `/^Severity/`, `/^Status/`
- Submit: `getByRole('button', { name: 'Create incident' })` (create) or `getByRole('button', { name: 'Save changes' })` (edit)
- Radix Select: click the combobox label first, then `getByRole('option', { name: '...' })` for the value

## 3. Key journey tests

Journey specs live under `client/e2e/journeys/`. This section defines the catalog and structure agents should follow.

### Journey catalog

| Journey | Route(s) | APIs required | High-level steps |
|---------|----------|---------------|------------------|
| Items list + add | `/` | ItemsApi | Nav → empty or list → fill form → submit → item visible |
| Items validation | `/` | Optional (client-side) | Empty name → `Name is required.` |
| Incidents list | `/incidents` | IncidentsApi | Nav → table or empty state |
| Create incident | `/incidents/create` | IncidentsApi | Fill form → submit → redirect/detail |
| View incident | `/incidents/:id` | IncidentsApi | List → row link → detail fields |
| Edit incident | `/incidents/:id/edit` | IncidentsApi | Detail → edit → save → updated UI |
| Audits list + detail | `/audits`, `/audits/:id` | AuditsApi | Seed via `createAudit` in [`e2e/support/api.ts`](../../../client/e2e/support/api.ts) → list → detail |
| Audits soft delete | `/audits` | AuditsApi | Seed → list/detail → `deleteAudit` → row hidden from list |

Routes from [`client/src/App.tsx`](../../../client/src/App.tsx): `/`, `/incidents`, `/incidents/create`, `/incidents/:id`, `/incidents/:id/edit`, `/audits`, `/audits/create`, `/audits/:id`, `/audits/:id/edit`.

### Known user-visible copy

| Scenario | Copy |
|----------|------|
| Items empty state | `No items yet. Add one above to get started.` |
| Items name validation | `Name is required.` |
| Items price validation | `Enter a valid price.` |
| Incidents API unreachable | `Cannot reach the server. Start IncidentsApi with dotnet run in IncidentsApi, then try again.` |
| Incidents list heading | `Incidents` |
| Audits API unreachable | `Cannot reach the server. Start AuditsApi with dotnet run in AuditsApi, then try again.` |
| Audits list heading | `Audits` |
| Audits list subtitle | `Clinical quality audits from the Audits API` |
| Audits loading | `Loading audits…` |

Cross-reference [react-test-writer §4 Form tests](../react-test-writer/SKILL.md) for additional validation copy.

### Journey spec boilerplate

```typescript
import { test, expect } from '@playwright/test';
import { ItemsPage } from '../pages/ItemsPage';

test.describe('items: add item', () => {
  test('adds item and displays it in the list', async ({ page }): Promise<void> => {
    // Arrange
    const itemsPage = new ItemsPage(page);
    await itemsPage.goto();
    await expect(page.getByText('No items yet. Add one above to get started.')).toBeVisible();

    // Act
    await itemsPage.fillItem('E2E Widget', '9.99');
    await itemsPage.submit();

    // Assert
    await expect(page.getByText('E2E Widget')).toBeVisible();
  });
});
```

### Rules

- One domain per spec file: `journeys/items.journey.spec.ts`, `journeys/incidents.journey.spec.ts`, `journeys/audits.journey.spec.ts`.
- `test.describe('domain: scenario', () => { ... })` — one `test` per agent request inside the describe.
- Use `test.beforeEach` only when every test in that describe needs the same navigation — do not add shared setup for unrelated tests.
- Prefer **UI-driven setup** for items/incidents; for audits soft-delete journeys, **API seeding** via [`e2e/support/api.ts`](../../../client/e2e/support/api.ts) (`createAudit`, `deleteAudit`) is established — follow [`audits.journey.spec.ts`](../../../client/e2e/journeys/audits.journey.spec.ts).
- Use `await expect(locator).toBeVisible()` / `toHaveText` — prefer role and label queries over CSS selectors.
- After API errors, assert `role="alert"` and preserved field values (see Vitest incident form tests).

## Playwright gotchas

| Gotcha | Guidance |
|--------|----------|
| **webServer is four-process** | ItemsApi (5133), IncidentsApi (5134), AuditsApi (5135), Vite (5173) — all started by `npx playwright test` |
| **baseURL** | Always relative `page.goto` paths |
| **reuseExistingServer** | Local dev may already have servers running; Playwright reuses them when not in CI |
| **CI / PR** | No Playwright in [ci.yml](../../../.github/workflows/ci.yml); nightly e2e in [nightly-e2e.yml](../../../.github/workflows/nightly-e2e.yml) |
| **Chromium only** | `npx playwright install chromium`; no WebKit/Firefox |
| **Vitest vs Playwright** | `npm test` runs Vitest only — e2e is `npx playwright test` |
| **Items without API** | List shows error with `Try again` button — not a passing journey test |
| **Incidents without API** | Error alert with IncidentsApi start message |
| **Audits without API** | Error alert with AuditsApi start message |
| **Radix / shadcn** | Portals and selects: open trigger, then `getByRole('option')` or `locator.waitFor()` — see [react-test-writer shadcn gotchas](../react-test-writer/SKILL.md) |
| **AuditsPage** | `role="region"` name `Audits list, scrollable`; filter via Status combobox |

## shadcn / Radix (e2e)

- **Select:** `aria-*` lives on `SelectTrigger` (combobox role), not `Select.Root`. Click the labelled combobox, then pick `role="option"`.
- **DatePicker:** Popover + Calendar — open via `getByLabel(/^Reported date/)`, wait for calendar grid before selecting a day.
- **DataTable / Pagination:** query `role="region"` with `name: 'Data table'` and `nav` with `aria-label="Pagination"` when asserting incidents list UI.

## Which file to write to

| User asks for | Target file |
|---------------|-------------|
| Smoke / app shell | [`client/e2e/app.spec.ts`](../../../client/e2e/app.spec.ts) (append) |
| Items journey | [`client/e2e/journeys/items.journey.spec.ts`](../../../client/e2e/journeys/items.journey.spec.ts) |
| Incidents journey | [`client/e2e/journeys/incidents.journey.spec.ts`](../../../client/e2e/journeys/incidents.journey.spec.ts) |
| Audits journey | [`client/e2e/journeys/audits.journey.spec.ts`](../../../client/e2e/journeys/audits.journey.spec.ts) |
| Components journey | [`client/e2e/journeys/components.journey.spec.ts`](../../../client/e2e/journeys/components.journey.spec.ts) |
| Shared locators | `client/e2e/pages/<Name>.ts` |
| API seed helpers | [`client/e2e/support/api.ts`](../../../client/e2e/support/api.ts) |
| Config / CI webServer | [`client/playwright.config.ts`](../../../client/playwright.config.ts) — only when user explicitly requests |

When **appending** to an existing spec, insert the new `test` inside the relevant `test.describe` block. When creating a journey file, include imports, describe wrapper, and any new page object in the same change if the test needs it.

## Workflow for each test request

1. **Classify and calibrate effort** — smoke vs page object vs journey; which domain (items/incidents/audits); apply [Recommended effort level](#recommended-effort-level).
2. Determine the target file (table above).
3. Look up any uncertain Playwright API details via Context7 before writing.
4. Write one `test` (and page object methods only if required for that test).
5. If the file exists, show only the new `test` (and any new page object) with a clear note about where to insert it. If it is a new file, show the complete file.
6. Run `npx playwright test` from `client/` — webServer starts all APIs and Vite automatically.
7. Confirm what was written and the test result. If tests fail, fix before offering the next test. Then ask: "Which e2e test or journey would you like next?"

## Related repo docs (follow-up)

Keep these aligned when Playwright usage grows — not required for the skill file alone:

| File | Update |
|------|--------|
| [client/package.json](../../../client/package.json) | Optional `"test:e2e": "playwright test"` script |
| [client/README.md](../../../client/README.md) | Optional e2e section with API prerequisites |
