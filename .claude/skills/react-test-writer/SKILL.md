---
name: react-test-writer
description: Write Vitest tests for the React TypeScript client in this project. Use whenever the user asks to write, add, generate, or create a frontend test — unit (guards, errors), component (ItemsList), App integration, form validation, routing, or accessibility. Always write exactly one test at a time. Uses Vitest 4.1.7, @testing-library/react 16.3.2, @testing-library/jest-dom 6.9.1, jsdom 29.1.1, React 19.2.6, react-router-dom 7.16.0, and Arrange/Act/Assert comments. Run npm test from client/ after every test.
---

# React Test Writer

Guides writing Vitest tests for the `client/` React TypeScript app.

## Core rules

- **One test per request.** Write exactly one `it(...)` method. When done, ask which test to write next — never generate a batch.
- **Always run `npm test`** from `client/` after writing the test. Do not declare the task done until the suite passes.
- **Use Context7** when you need to verify Vitest, React Testing Library, react-day-picker, react-router-dom, or WCAG technique details:
  1. `mcp__context7__resolve-library-id` with library name + question
  2. `mcp__context7__query-docs` with the resolved ID
- **Test behaviour, not implementation.** Do not mock presentational children in App integration tests.
- **TypeScript conventions:** no `any`, explicit return types on every test function, single quotes, semicolons, trailing commas. No `console.log` or `debugger`.
- **Synthetic data only** — no PII, patient data, or realistic-looking personal identifiers in fixtures.
- **Do not remove or edit existing tests** without explicit instruction.

## Tech stack

| Library | Version |
|---------|---------|
| Vitest | 4.1.7 |
| @testing-library/react | 16.3.2 |
| @testing-library/jest-dom | 6.9.1 |
| jsdom | 29.1.1 |
| React | 19.2.6 |
| TypeScript | 6.0.2 |
| react-router-dom | 7.16.0 |
| react-day-picker | 10.0.1 |
| Vite | 8.0.12 |

Run tests with `npm test` (`vitest run`) from the `client/` directory.

Vitest config is in `client/vite.config.ts`: `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`, and **`pool: 'threads'`** (required on Windows — the default forks pool times out).

## Project layout

```
client/
  vite.config.ts              — Vitest config (threads pool, jsdom, setup file)
  src/
    test/setup.ts             — jest-dom matchers; afterEach(cleanup) from RTL
    guards.ts                 — runtime type guards for API responses
    guards.test.ts            — unit tests (reference)
    errors.ts                 — ApiClientError, toUserMessage
    errors.test.ts            — unit tests (reference)
    api.ts                    — fetchItems, createItem (mock in App tests)
    App.tsx                   — items view + routing; form and list orchestration
    App.test.tsx              — integration, form, router tests (reference)
    types.ts                  — Item and shared types
    components/
      ItemsList.tsx           — loading / error / empty / ready states
      ItemsList.test.tsx      — component tests (reference)
      FormField.tsx           — label + cloneElement aria injection
      SelectField.tsx         — Radix Select wrapper (aria on SelectTrigger)
      DatePickerField.tsx     — Popover + Calendar (autoFocus)
      DataTable.tsx           — generic sortable table
      Pagination.tsx          — nav with aria-label / aria-current
      ui/                     — shadcn vendor (ESLint-ignored; test usage via wrappers)
    componentRegistry.tsx     — DataTable<RowType> preview example
```

## Positive references

Match patterns already used in this repo:

| Test type | Reference file |
|-----------|----------------|
| Unit | [`client/src/guards.test.ts`](../../../client/src/guards.test.ts), [`client/src/errors.test.ts`](../../../client/src/errors.test.ts) |
| Component | [`client/src/components/ItemsList.test.tsx`](../../../client/src/components/ItemsList.test.tsx) |
| Integration, form, router | [`client/src/App.test.tsx`](../../../client/src/App.test.tsx) |

## Return types

| Test kind | Signature |
|-----------|-----------|
| Sync unit or component | `(): void` |
| Async integration, form, router, or accessibility with `findBy*` | `async (): Promise<void>` |

## Arrange/Act/Assert pattern

Always include the three comment markers in every `it`, even when Arrange is minimal:

```typescript
it('returns false for null', (): void => {
  // Arrange
  const value = null;

  // Act
  const result = isRecord(value);

  // Assert
  expect(result).toBe(false);
});
```

When construction is the only action (e.g. `new ApiClientError(...)`), use `// (construction is the act)` in the Act section, as in `errors.test.ts`.

## Naming convention

Use a behaviour sentence for the test name — not a rigid `Method_Scenario_Result` prefix:

- `returns false for null`
- `shows loading state while items are being fetched`
- `loads and displays items after mount`
- `shows name required alert when submitting with empty name`

## 1. Unit tests

Pure functions and modules with **no** React, **no** RTL, **no** `vi.mock`.

### Boilerplate

```typescript
import { describe, expect, it } from 'vitest';
import { isRecord } from './guards';

describe('isRecord', () => {
  it('returns true for a plain object', (): void => {
    // Arrange
    const value = { id: 1, name: 'Sprocket' };

    // Act
    const result = isRecord(value);

    // Assert
    expect(result).toBe(true);
  });
});
```

### Rules

- Co-locate: `foo.ts` → `foo.test.ts` in the same directory.
- Import only from `vitest` (and the module under test). Never import `@testing-library/react`.
- Every `it` uses `(): void`.
- One `it` per agent request. A single `it` may contain multiple AAA blocks when testing closely related cases in one scenario (see `guards.test.ts` primitives test) — still only add **one** new `it` per request.
- Targets: `guards.ts`, `errors.ts`, `formFieldUtils.ts`, and future pure utility modules.

**WCAG and UI state rules do not apply** to unit tests.

## 2. Component tests

Presentational components rendered **in isolation** with props — no `vi.mock('./api')`.

### Boilerplate

```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ItemsList } from './ItemsList';

describe('ItemsList', () => {
  function renderItemsList(
    overrides: Partial<ComponentProps<typeof ItemsList>> = {},
  ): ReturnType<typeof render> & { onRetry: ReturnType<typeof vi.fn> } {
    const { onRetry: overrideOnRetry, ...rest } = overrides;
    const onRetry = overrideOnRetry ?? vi.fn((): void => {});
    const formatPrice = (price: number): string => `$${price.toFixed(2)}`;

    const view = render(
      <ItemsList
        items={[]}
        status="loading"
        errorMessage={null}
        onRetry={onRetry}
        formatPrice={formatPrice}
        {...rest}
      />,
    );

    return { ...view, onRetry };
  }

  it('shows error state with retry action when loading fails', (): void => {
    // Arrange
    const errorMessage = 'Cannot reach the server.';

    // Act
    const { onRetry } = renderItemsList({
      status: 'error',
      errorMessage,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Assert
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

### Rules

- File path: `client/src/components/<Component>.test.tsx`.
- Use a **render helper** with `Partial<ComponentProps<typeof X>>` and sensible defaults when the same props recur.
- Cover key UI states where applicable: **loading**, **error**, **empty**, **populated** (see `ItemsListStatus` in `ItemsList.tsx`).
- Prefer accessible queries: `getByRole`, `getByText`; use `queryByRole` / `queryByText` to assert absence.
- Pass callbacks as `vi.fn((): void => {})` when asserting interactions.
- Use `fireEvent` from `@testing-library/react` (this project does not use `@testing-library/user-event`).
- Sync tests: `(): void`.

## 3. Integration tests

Full component tree through `App`, with API mocked at module level.

### Boilerplate

```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { createItem, fetchItems } from './api';
import type { Item } from './types';

vi.mock('./api', () => ({
  fetchItems: vi.fn(),
  createItem: vi.fn(),
}));

const renderApp = (): void => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );
};

describe('App', () => {
  beforeEach((): void => {
    vi.mocked(fetchItems).mockReset();
    vi.mocked(createItem).mockReset();
  });

  it('loads and displays items after mount', async (): Promise<void> => {
    // Arrange
    const items: Item[] = [{ id: 1, name: 'Sprocket', price: 12.5 }];
    vi.mocked(fetchItems).mockResolvedValue(items);

    // Act
    renderApp();

    // Assert
    await screen.findByRole('list');
    expect(screen.getByText('Sprocket')).toBeInTheDocument();
  });
});
```

### Rules

- `vi.mock('./api', ...)` at the **top of the file** (path relative to the test file).
- `beforeEach`: `vi.mocked(...).mockReset()` for **every** mocked export from that module.
- `renderApp()` wraps `App` in `MemoryRouter` — do **not** mock `ItemsList` or other presentational children.
- Use `ApiClientError` from `./errors` for realistic HTTP/network/parse failures.
- Use `mockResolvedValueOnce` chains when the UI fetches twice (e.g. empty list on mount, populated list after submit).
- Async assertions: `await screen.findByRole(...)`, `findByText`, `findByLabelText` — never rely on sync `getBy*` immediately after mount or submit.
- Assert side effects on mocks: `expect(createItem).toHaveBeenCalledWith({ name: 'Widget', price: 9.99 })`, `expect(fetchItems).toHaveBeenCalledTimes(2)`.

## 4. Form tests

Form behaviour can be tested **through App** (integration) or **in isolation** on field wrappers.

### Through App (preferred for end-to-end form flows)

Patterns from `App.test.tsx`:

```typescript
// Arrange
vi.mocked(fetchItems).mockResolvedValue([]);

// Act
renderApp();
await screen.findByText('No items yet. Add one above to get started.');
fireEvent.change(screen.getByLabelText('Name'), {
  target: { value: 'Widget' },
});
fireEvent.change(screen.getByLabelText('Price'), {
  target: { value: '9.99' },
});
fireEvent.click(screen.getByRole('button', { name: 'Add item' }));

// Assert — validation
await screen.findByText('Name is required.');

// Assert — success: API called, fields cleared, item visible
expect(createItem).toHaveBeenCalledWith({ name: 'Widget', price: 9.99 });
expect(await screen.findByLabelText('Name')).toHaveValue('');
expect(await screen.findByLabelText('Price')).toHaveValue(null);

// Assert — failure: alert shown, name preserved
const alert = await screen.findByRole('alert');
expect(alert).toHaveTextContent(errorMessage);
expect(screen.getByLabelText('Name')).toHaveValue('Widget');
```

Known validation copy in App: `Name is required.`, `Enter a valid price.`

### Isolated field components

Render `FormField`, `SelectField`, or `DatePickerField` with `error` / `required` props:

- Assert error copy via `role="alert"`.
- Assert `aria-invalid`, `aria-describedby`, and `aria-required` on the **actual focusable DOM control** (see shadcn/Radix gotchas — not on `Select.Root`).
- Use `getByLabelText` for native inputs; for Radix Select use `getByRole('combobox')` after opening if needed.

Use `fireEvent.change` and `fireEvent.click` — not `@testing-library/user-event`.

## 5. Router tests

`App.tsx` uses `Routes` / `NavLink` / `Navigate`. Production uses `BrowserRouter` in `main.tsx`; **tests always use `MemoryRouter`**.

### Patterns

```typescript
// Default — items catalogue at /
render(
  <MemoryRouter initialEntries={['/']}>
    <App />
  </MemoryRouter>,
);

// Components gallery route
render(
  <MemoryRouter initialEntries={['/components']}>
    <App />
  </MemoryRouter>,
);
```

- Set `initialEntries` to the route under test.
- Assert route-specific UI (`NavLink` active state, `ComponentsView`, registry content).
- Optional: `fireEvent.click` on a nav control, then assert the new view with `findBy*`.
- Never wrap tests in `BrowserRouter`.

## 6. Accessibility tests

There is no axe/eslint-a11y plugin in this repo — verify WCAG 2.1 AA concerns with RTL queries and attribute assertions. Use Context7 when unsure about a WCAG technique.

### Query priority

1. `getByRole` with `name` option
2. `getByLabelText`
3. `getByText` only when role/label queries are insufficient

### Assertions to use in this codebase

| UI | What to assert |
|----|----------------|
| Loading and empty (`LoadingState`, `ItemsList`) | `role="status"`; `aria-live="polite"` on loading where present |
| Errors | `role="alert"`, visible error text |
| Populated list (`ItemsList` ready) | `role="list"`, `listitem` count — only when items are rendered |
| Forms | `<label htmlFor={id}>` matches control `id`; `aria-describedby` points to error `id` when `error` prop set. Legacy App items form uses implicit label nesting (input inside `<label>`, no `htmlFor`/`id`); `FormField`, `SelectField`, and `DatePickerField` use explicit `htmlFor`/`id`. `getByLabelText` works either way |
| Pagination | `nav` with `aria-label="Pagination"`; `aria-current="page"` on active page |
| DataTable | `aria-label="Data table"` on the region wrapper (`role="region"`), not the `<table>` — query with `getByRole('region', { name: 'Data table' })`; `aria-sort` on sortable `<th>` headers |
| Decorative icons | `aria-hidden="true"` — do not assert on icon-only text |

### Focus and keyboard

- Test `tab` / keyboard interaction only when the scenario requires it (e.g. sortable table, popover trigger).
- Radix popovers, selects, and dialogs use focus traps — portal content may need `findBy*` after open.
- Do not add accessibility assertions to pure unit tests (`guards`, `errors`).

## shadcn / Radix gotchas

### Select — `aria-*` on `SelectTrigger`, not `Select.Root`

Radix `Select.Root` renders **no DOM node**. `FormField` uses `cloneElement` to inject `aria-describedby`, `aria-invalid`, and `aria-required` onto its single child — that only works when the child is a real element.

In `SelectField.tsx`, all `aria-*` attributes are placed on `SelectTrigger`. Tests that assert form accessibility on selects must query the trigger (e.g. `combobox` role), not assume aria lives on a wrapper around `Select`.

### Calendar — `autoFocus`, not `initialFocus`

react-day-picker **v10** (`react-day-picker` 10.0.1): use `autoFocus` on the shadcn `Calendar` inside `DatePickerField`. The old `initialFocus` prop is **silently ignored** — it does not throw. Tests or components using `initialFocus` will not get focus behaviour.

### DataTable — generic type parameter required

`DataTable` is generic: `DataTable<T extends Record<string, unknown>>`. Tests must supply an explicit row type and typed data array:

```typescript
type IncidentPreviewRow = {
  id: string;
  title: string;
  severity: string;
  status: string;
};

const rows: IncidentPreviewRow[] = [/* ... */];

render(
  <DataTable<IncidentPreviewRow>
    columns={[/* ... */]}
    data={rows}
    sortKey="title"
    sortDirection="asc"
    onSort={vi.fn()}
  />,
);
```

See `componentRegistry.tsx` (`DataTable<IncidentPreviewRow>`) for a working example.

### Other UI testing notes

- **`client/src/components/ui/**`** is vendor-generated and ESLint-ignored. Test behaviour through hand-authored wrappers (`SelectField`, `DatePickerField`, `FormField`), not vendor internals.
- **Portaled content** (Select dropdown, Popover calendar): open the trigger first, then use `findBy*` for content rendered in a portal.
- **`FormField` + native inputs:** `cloneElement` injects aria onto a single child — works for `<input>`, not for Radix roots without DOM.

## Vitest and RTL gotchas

- **Setup:** `client/src/test/setup.ts` registers `@testing-library/jest-dom/vitest` and runs `cleanup()` after each test — do not skip cleanup by rendering outside RTL.
- **Windows:** `pool: 'threads'` in `vite.config.ts` is mandatory.
- **`vi.mock` hoisting:** mock declarations must be at module top level; import mocked functions after the mock factory.
- **`mockReset` vs `mockClear`:** use `mockReset` in `beforeEach` so implementations do not leak between tests.
- **Number inputs:** empty number fields may assert as `toHaveValue(null)` after clear (see App submit success test).

## Which file to write to

| Target | File |
|--------|------|
| `guards.ts` | `client/src/guards.test.ts` |
| `errors.ts` | `client/src/errors.test.ts` |
| `formFieldUtils.ts` | `client/src/components/formFieldUtils.test.ts` (create if absent) |
| `components/X.tsx` | `client/src/components/X.test.tsx` |
| `App.tsx` flows (list, form, nav) | `client/src/App.test.tsx` |
| New page-level shell | `client/src/<Name>.test.tsx` (create if needed) |

When **appending** to an existing file, insert the new `it` inside the relevant `describe` block, before the closing braces. For new component test files, include the render helper and `describe` wrapper in the full file output.

## Workflow for each test request

1. Identify the test type (unit, component, integration, form, router, or accessibility) and scenario from the user's message.
2. Determine the target file (table above).
3. Look up any uncertain API details via Context7 before writing.
4. Write exactly one `it`, with AAA comments and the correct return type (`(): void` or `async (): Promise<void>`).
5. If the file exists, show only the new `it` (and any new helper) with a clear note about where to insert it. If it is a new file, show the complete file.
6. Run `npm test` from `client/` after writing each test and confirm all tests pass before asking for the next one.
7. Confirm what was written and the test result, then ask: "Which test would you like next?"
