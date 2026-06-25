# Agentic Workflow Security

This document covers the security posture of the agentic development
workflow built in this project. It is written for a healthcare-adjacent
context where controlled automation, data protection, and safe AI usage
are baseline requirements, not optional extras.

---

## Workflow permissions

Each GitHub Actions workflow is scoped to the minimum permissions it needs.

| Workflow | Permissions | Notes |
|----------|------------|-------|
| `nightly-agent.yml` | `contents: write`, `pull-requests: write` | Required to create branches, commit code, and raise PRs |
| `pr-review.yml` | `contents: write`, `pull-requests: write` | Required to post review comments and update PR state |
| `nightly-e2e.yml` | `contents: read`, `checks: write` | No secrets, cannot modify the codebase |
| `ci.yml` | Default (read) | Standard test runner, no write access needed |

No workflow has `admin` or `packages` permissions. The `ANTHROPIC_API_KEY`
is stored as a GitHub Actions secret and is never written to disk, logged,
or exposed in workflow output.

---

## Human merge gate

The agent never merges its own PRs. Every PR raised by the nightly agent
requires a human to review the diff and merge manually.

This is enforced at two layers:

- **Workflow design** — the nightly agent workflow raises a PR and stops.
  It has no merge step.
- **Branch protection** — `main` is protected by a ruleset requiring the
  `Test` CI check to pass before any PR can be merged. No exceptions, no
  bypass list.

The combination means: even if the agent produced a bad change, it cannot
land on `main` without a human seeing it and CI confirming it.

---

## Fail-closed design

If the agent cannot safely know the state of the world, it aborts rather
than proceeding with incomplete information.

Specific fail points:

- **PR list fetch failure** — if the fetch of active and draft PRs fails,
  the run aborts. The agent cannot risk picking a task that already has
  an open PR, so it stops rather than guessing.
- **Git operation failure** — if any git command fails mid-run, the script
  throws rather than continuing in an unknown state.
- **Test retry exhaustion** — after 3 failed attempts to produce passing
  tests, the agent marks the PR as draft and stops. It does not loop
  indefinitely.
- **API call cap** — a hard limit of 10 Anthropic API calls per run
  prevents runaway execution regardless of what the agent encounters.

The principle: when in doubt, stop. Do not proceed blind.

---

## Trust boundaries and sensitive path guard

The agent can work freely on application code. It cannot touch the files
that define the rules it operates under.

Before writing any file, the agent checks planned changes against a
blocklist:

| Blocked path | Reason |
|-------------|--------|
| `.github/` | Workflow files and automation scripts — agent must not rewrite its own guardrails |
| `.husky/` | Pre-commit hooks including the `no-secrets` ESLint check |
| `package.json` (repo root only) | Root dependency manifest and test script definitions |
| `*.csproj`, `*.sln` | .NET project and solution files |
| `*/Migrations/*` | EF Core migration files |
| `package-lock.json` | npm lockfiles (root or nested) |
| `.env*` | Environment and secrets files |
| `Dockerfile` | Container build definitions |
| `.npmrc` | npm configuration |
| `tsconfig.json` | TypeScript project config (not `tsconfig.app.json` / `tsconfig.node.json`) |

Sensitive paths are filtered from the plan before implementation begins.
If all planned changes target sensitive paths, the run raises a draft
failure PR and stops — no files are written.

Path matching normalises all separators to forward slashes before
comparison, so the guard works identically on Windows and Linux runners.
Both `pr-review.js` and `nightly-agent.js` import the shared
`.github/scripts/sensitive-paths.js` module so the blocklist stays
consistent across automation entry points.

---

## Backend SQL injection prevention

The `AuditsApi` (and equivalent modules) use an `IsValidSortField`
allowlist to validate sort column names before they are interpolated into
queries. Dynamic sort fields from user input are checked against a
hardcoded set of permitted column names. Any value not on the allowlist
is rejected with a 400 response before the query runs.

This prevents a class of SQL injection where an attacker controls the
`ORDER BY` clause via query parameters.

---

## Prompt injection

The PR review agent reads PR diffs and descriptions before making
decisions. A malicious PR description could contain instructions designed
to manipulate the agent's behaviour.

Mitigations in place:

- **Sensitive path guard** — any injected instruction to modify
  blocked paths (workflows, hooks, root `package.json`, lockfiles, env
  files, project files, migrations, Dockerfiles, etc.) is rejected before
  the agent writes a single file.
- **Human merge gate** — any manipulated output still requires human
  approval before landing on `main`.
- **Execution caps** — the 3-attempt and 10-call limits constrain the
  blast radius of any manipulated run.

There is no explicit prompt sanitisation layer — this is a known
limitation shared by most agentic systems today.

---

## Credential management

**`GITHUB_TOKEN` over PAT** — the nightly agent uses the
automatically-generated `GITHUB_TOKEN` rather than a Personal Access
Token. `GITHUB_TOKEN` is scoped to the repository, expires at the end of
each workflow run, and cannot be reused. A PAT would be long-lived, tied
to a personal account, and have broader access. The trade-off accepted
here is that CI does not trigger automatically on agent-raised PRs — a
human must re-trigger it. This friction is intentional: it reinforces the
human review gate rather than bypassing it.

In a production system, the correct pattern is a GitHub App with
repository-scoped permissions and short-lived rotating tokens.

**Secret scanning** — GitHub secret scanning is enabled on this
repository. No secrets were detected in the repository history when it
was enabled.

**Dependency scanning** — Dependabot alerts are enabled. On 24 June 2026,
9 vulnerability alerts were found and resolved in the same session via
`npm update`. The highest severity finding was a Vite `server.fs.deny`
bypass on Windows (High) — resolved by upgrading Vite from 8.0.13 to
8.1.0.

---

## GDPR and data protection

This project mirrors the habits required in a regulated healthcare
environment. No real patient data is used anywhere in the codebase,
tests, or tooling.

**Privacy by design** — data protection controls were built in from the
start, not added afterwards:

- `CLAUDE.md` was written before any code, defining what agents must
  never include in prompts
- Synthetic test data is generated using
  [Bogus](https://github.com/bchavez/Bogus), a .NET fake-data library.
  No realistic-looking personal data in test fixtures
- No production database access at any point in the development workflow

**Prompt hygiene** — anything included in a prompt leaves the local
environment via the Anthropic API. The following must never appear in any
prompt:

- NHS numbers, patient IDs, or dates of birth
- Real client or organisation names
- Stack traces or logs containing identifiable information
- Test fixtures with realistic-looking personal data

**Technical control** — the `no-secrets` ESLint plugin runs on every
commit via Husky pre-commit hooks. It catches hardcoded secrets and
sensitive strings before they reach the codebase.

**Gap** — the `no-secrets` ESLint check covers `client/` (frontend) only.
The .NET backend projects are not covered by automated secret detection
at the code level. GitHub secret scanning provides a backstop at the
repository level, but per-file enforcement on the backend requires a
separate tool or a repo-wide linting pass.

**Regulatory context** — GDPR applies to any system handling personal
data about patients, staff, or clients in this jurisdiction. HIPAA applies
to US operations. ICO fines reach £17.5 million or 4% of global turnover;
HIPAA penalties reach $1.9 million per violation category per year. The
practical rule: if in doubt, leave it out.

---

## Known security backlog items

Backend connection strings and CORS allowed origins are configuration-driven
via each API's `appsettings.json`, overridable through ASP.NET Core
environment variables (documented in `.env.example`). No high-priority
security backlog items remain in this section; other tasks are tracked in
[`docs/nightly-agent-backlog.md`](nightly-agent-backlog.md).
