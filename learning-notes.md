## Day 6 — 26 May 2026

### Code review findings

- No significant code changes today — process and configuration day
- Reviewed CLAUDE.md in depth — every section understood and justified
- Package versions confirmed from package.json and .csproj files
- TypeScript 6.0.2 is notably new — most projects are on 5.x
- Nullable and ImplicitUsings enabled in .NET project — modern C# defaults

### Prettier auto-fix

- Switched from `prettier --check` to `prettier --write` on staged files
- Auto-fix is better for developer experience — no blocked commits for formatting
- CI still uses `prettier --check` — correct, should fail if formatting wrong in pipeline
- `lint-staged.config.js` updated — runs `prettier --write` on all staged file types

### Branch protection and PR workflow

- Repo made public — rulesets only enforced on public repos on free GitHub plan
- `main-protection` ruleset created with:
  - Restrict deletions
  - Require pull request before merging
  - Require .NET Tests CI check to pass
  - Block force pushes
- React tests check to be added in week 3 when Vitest is in CI
- No bypass list — solo project, always go through PR process

### CLAUDE.md multi-repo observation

- CLAUDE.md is powerful but gets complex across multiple repos
- Conflicting conventions between teams is a real unsolved problem
- Different squads may have different styles — one CLAUDE.md cannot serve all
- Industry has not fully solved this yet
- Opportunity to propose a thoughtful approach when back at Radar

### What I would not trust the agent to do unsupervised

- Large refactors across multiple files without a clear goal
- Any changes near PII handling or data access
- Committing or pushing without explicit instruction
- Generating multiple tests in one prompt — stalls consistently

### Time saved today

- Branch protection and PR workflow set up in under an hour — manually researching and configuring this would have taken half a day
- CLAUDE.md written and filled in collaboratively — a standing brief that saves explaining context on every future session

### Ideas and observations

- PR workflow from phone works perfectly — GitHub Android app
- CLAUDE.md is a living document — will grow as the project grows
- Exact package versions in CLAUDE.md prevent agent making wrong version assumptions
- TypeScript 6.0.2 is very new — worth being explicit about
- Multi-repo CLAUDE.md complexity is an unsolved industry problem — opportunity to propose a thoughtful approach at Radar

## Day 5 — 23 May 2026

### Code review findings

- Assembly files were being tracked in git — fixed with .gitignore cleanup
- xUnit integration tests are more expensive than unit tests — deliberate balance needed at scale
- Testing pyramid: lots of unit tests, fewer integration, fewer e2e
- Agent defaulted to integration tests — correct for an API but does not scale without a unit test layer underneath

### GitHub Actions CI pipeline

- First time seeing GitHub Actions in practice
- Pipeline runs on every push to main — `dotnet test` on `ubuntu-latest`
- Green in 39 seconds — 9 tests passing in the cloud automatically
- CI badge live on GitHub README — visible proof of passing tests
- Every push now verified without manual intervention

### Pre-commit hooks

- Husky installed with lint-staged — only checks staged files, keeps it fast
- Blocks on: `no-explicit-any`, unused imports, unused vars, `no-non-null-assertion`, explicit return types, React hooks rules, `no-console`, `no-debugger`, `no-secrets`
- Deliberate decision not to run tests in the hook — tests belong in CI
- Pre-commit hooks should be fast — milliseconds not seconds
- Tested with deliberate `any` type — blocked with two specific errors
- Semicolons added back to Prettier config — personal preference, consistent with C# background

### Responsive design

- Agent found real issues — iOS zoom bug on inputs under 16px, cramped content width on mobile
- Fixed with media queries and proper flex layout
- PostCSS breakpoint variables explored then reverted — clever solution but unnecessary complexity for project size
- Fluid responsive design with proper breakpoint tiers planned for week 3

### Working with Claude

- Screenshots more effective than pasting text for validating visual outcomes
- Use screenshots for: CI badges, GitHub repo state, terminal output
- Use pasted text for: code and terminal output that needs actioning

### Ideas and observations

- Incident reporting module to be added in week 3 — Radar-relevant domain
- Playwright e2e tests — week 3
- Vitest unit tests for React — week 3
- Fluid responsive design with breakpoint tiers — week 3
- xUnit deep dive — week 3 or 4
- GDPR and AI session — week 2 or 3
- Daily AI digest email — GitHub Actions, week 5

### Time saved today

- CI pipeline set up in under 10 minutes — manually would take an hour
- Pre-commit hooks configured with 8 rules — manually would take 2–3 hours
- Responsive fixes applied and tested in minutes — manually 1–2 hours

## Day 4 — 22 May 2026

### Code review findings

- The `record` type is new to me — modern .NET shorthand for immutable data classes
- In-memory repo with hardcoded `nextId` starting at 4 — fragile, goes away when we add SQLite in week 3
- `Program.cs` minimal API pattern is different to controller pattern I am used to — not legacy thinking, just a different approach, will encounter both at Radar
- Responsive design not checked — flagged for next frontend session

### Anthropic engineering blog observations

- Long-running agents lose context between sessions — like a developer with no handover notes
- Solution: initialiser agent sets up environment once, coding agent picks up each session using progress file and git history
- One feature at a time is critical — agent tries to do too much otherwise
- Agent needs to test its own work end to end, not just assume it worked
- `claude-progress.txt` is the handover mechanism — relevant to week 4 multi-agent work
- Descriptive git commits are part of the agent workflow, not just good practice

### Healthcare scenarios

- Never debug against live production data — reproduce locally, check logs first
- Never connect Claude Code to a production database — queries leave your environment via the API
- Patient IDs and names are personal data under GDPR — sanitise before pasting anything
- Use Bogus (.NET) or Faker (JS) for synthetic test data — never real records
- Non-production databases should always have PII redacted — agents safe on dev/staging, never production

### Prompt sanitisation

- Only include what the agent needs to solve the technical problem
- Strip names, IDs, NHS numbers, hospital names — irrelevant to fixing bugs
- Check code snippets for hardcoded sensitive values before pasting

### Code review as safety layer

- Does it do what I asked? — test and verify, do not assume
- Does it do anything I did not ask for? — check the diff before committing
- Can I explain every line? — if not, ask the agent to explain first
- Read every changed line in GitLens before committing — not skim, read

### Safety position statement

> In a healthcare environment, AI agents must never consume identifiable patient data — names, NHS numbers, dates of birth, or any other personal identifiers. The consequences are severe: ICO fines, client trust destroyed, reputational damage, and potential criminal liability under the Data Protection Act.
>
> Claude Code sends prompts to Anthropic's API over the internet — anything in a prompt leaves your environment. Non-production databases should always have PII redacted which helps, but sanitising prompts must be consistent regardless of environment.
>
> The practical habit is simple — only give the agent what it needs. When debugging an endpoint, strip all patient data from the prompt. Use synthetic data libraries like Bogus for test data, never real records.
>
> Staff training matters too. The biggest risk is not malicious intent — it is a developer pasting a stack trace without thinking. Building safe prompt habits across the whole team is as important as any technical control.

### Ideas and observations

- Build a daily AI digest — GitHub Actions, Anthropic API, email delivery
- Morning coffee format: title, date, link, paragraph summary, no subscription articles
- Build in week 5 as the routines and loops exercise
- Estimated cost: ~$1–2/month

### Time saved today

- No coding today by design — thinking and safety work
- Safety position statement drafted, polished and ready for interviews and conversations

## Day 3 — 21 May 2026

### Code review findings

- Claude gave a good account of what to look for and why it made smart choices, specifically the guards confirming the front and backend data typings matching
- Strongly typed types in TypeScript is good for preventing shipping bugs
- The CSS patterns are a good base for a starting point
- The media queries for dark mode was a welcome surprise
- We did not check media queries for responsive design — make a note to prompt and check

### London keynote observations

- Followed on from the San Francisco talk
- Mostly the same speakers with the same message
- The product discussion did add some additional points about new beta features including tunnelling
- Boris echoing the message that this is all available now, go and do it

### Prompt chaining observations

- One focused prompt beats one large prompt every time
- Agent stalled on 3+ tests in one go, succeeded on one at a time
- Agent made architectural decisions unprompted — promoted `nextId` to public static to enable testability, then removed it entirely when the repository pattern made it unnecessary
- Agent explained its reasoning on every non-obvious decision
- 9 tests total, all passing

### Repository pattern refactor

- Completed in 3m 5s, all 9 tests passing
- Agent removed its own previous static hacks unprompted
- Recognised NSubstitute as the right mocking library
- No intervention needed — got it right first time
- Estimated manual time: 2–3 hours

### Where the agent hit its limits

- Stalled on multiple test generation in one prompt
- Solution: one focused prompt at a time

### What I would not trust the agent to do unsupervised

- Still at the beginning and learning — enjoyed the terminal choices to be in control (accept changes or discard) so I can see the stack trace of events
- Did not particularly like the code the agent produced before we added DI and SOLID principles including for testing — Claude admitted this was a hack
- Would not let Claude do much unsupervised until more confident in agentic AI capabilities

### Time saved today

- Approximately 4–6 hours of manual development compressed into under an hour of agent-directed work

## Day 2 — 20 May 2026

### Cursor vs Claude Code observations

**What felt different about working in the editor vs the terminal?**

The Cursor editor was fun but a bit chaotic coming into it blind — feels like a Swiss army knife of exciting tools I need time to get my head around. Without an external monitor it is difficult to fit everything on screen: chat, code, browser, developer tools, and possibly other things not discovered yet. I need to spend time looking at the code; for now I am trusting it did a good job by validating the steps set up via Claude and testing the endpoints.

**Which felt more natural for this kind of task?**

Comfortable with both Claude and Cursor, but still early days. Would prefer Claude terminal in the IDE (VS Code) rather than a separate application. Using the chat agent within the IDE is a positive step, presuming it is helping and not hindering progression of work.

**Where did Cursor's awareness of the full project help?**

Assuming the workspace set up as context, Cursor was able to scan what was generated yesterday and get the frontend talking to the backend. It did well and more — built everything without a hitch, verifying steps as it went.

**What did I have to correct?**

Nothing — worked first time, although a boilerplate project so not to get too excited yet.

**Which tool would I reach for first on a real Radar ticket?**

Difficult to say based on tasks so far — Radar is a complex beast. Would experiment with both before committing to a real ticket; going straight in would be dangerous.

### What surprised me today

- How quickly Cursor built the frontend, including fixing the CORS issue — everything built in a few minutes
- Liked that it asked before installing Node packages and tested the work before declaring job done

### What the agent did beyond what I asked

- Cursor went well beyond the brief both times
- Asked for a React frontend — added a proper API layer, TypeScript types, and solved CORS before noticing it was a problem
- Asked for error states — created typed errors, runtime type guards, a dedicated component, and user-friendly error messages that even tell you how to fix the issue
- Made architectural decisions not asked for — and got them right

### Time saved today

- Frontend built in under 10 minutes — Cursor's own logs show ~1.5 minutes for the Vite scaffold and `npm install`, with full wiring of the API layer, TypeScript types, CORS and proxy on top
- Manually this would have been 2–3 hours of setup, configuration and debugging
- Whole new world for development, especially scaffolding — need to review the code tomorrow with a clear head

## Day 1 — 19 May 2026

### First session observations

**What did the agent do that surprised me?**

Surprised how quickly it generated the project — may need to dive deeper into jargon it outputs while thinking in the background. Might be good to spend an hour or two before day two to get more familiar with Claude Code. The UX of Claude in the terminal is impressive.

**Where did it go wrong and how did it fix itself?**

Task was to get everything up and running and generate the command-line command for the APIs. It generated errors but fixed them automatically. Good to have control and be asked to continue rather than the agent going off on a tangent too quickly to understand.

**What would I have done differently?**

This version of .NET is new to me and the syntax is different to what I am used to — having tests confirms it is working; manually testing the APIs via curl builds confidence. Still early days, just one file, not to get too excited yet. Would like to ditch PowerShell and use the VS Code terminal so code and terminal live in one app.

**How long would this have taken to write manually?**

Not overly complicated what we asked the agent to build, but faster than a human would code — tests written in 2–3 minutes was great. Would have taken an hour or two manually.

**What would I not trust the agent to do unsupervised?**

Like that when setting up Claude it will never delete important code like tables without confirmation — tragic if that happened in an organisation. Would not want everything without a human; developers need to review at some point.

### Errors the agent hit and fixed automatically

Two issues came up during the build:

1. **Mangled output path** — `dotnet new` was called via the Bash tool with `-o C:\Users\jamie\code\radar-practice\ItemsApi`, but the Windows path got corrupted into a single token, so the project landed in a folder named `Usersjamiecoderadar-practiceItemsApi` instead of `ItemsApi`. Fixed by renaming the folder with `Rename-Item`.

2. **Locked binary blocking the test build** — when tests were first run, `ItemsApi.exe` was still held open by a `dotnet run` process (PID 37776) from an earlier session. MSBuild could not overwrite it and failed after 10 retries. Fixed by killing that process with `Stop-Process` before re-running tests.

The code itself compiled and all tests passed on the first attempt — both issues were environment/tooling problems rather than code errors, and both were resolved by the agent without manual intervention.
