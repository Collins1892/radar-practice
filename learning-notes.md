## Day 4 — 22 May 2026

### Code review findings
- Record record is new to me — modern .NET shorthand for immutable data classes
- In-memory repo with hardcoded nextId starting at 4 — fragile, goes away when we add SQLite in week 3
- Program.cs minimal API pattern is different to controller pattern I'm used to — not legacy thinking, just a different approach, will encounter both at Radar
- Responsive design not checked — flagged for next frontend session

### Anthropic engineering blog observations
- Long running agents lose context between sessions — like a developer with no handover notes
- Solution: initialiser agent sets up environment once, coding agent picks up each session using progress file and git history
- One feature at a time is critical — agent tries to do too much otherwise
- Agent needs to test its own work end to end, not just assume it worked
- claude-progress.txt is the handover mechanism — relevant to week 4 multi-agent work
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
- Does it do what I asked? — test and verify, don't assume
- Does it do anything I didn't ask for? — check the diff before committing
- Can I explain every line? — if not, ask the agent to explain first
- Read every changed line in GitLens before committing — not skim, read

### Safety position statement
"In a healthcare environment, AI agents must never consume identifiable patient data — names, NHS numbers, dates of birth, or any other personal identifiers. The consequences are severe: ICO fines, client trust destroyed, reputational damage, and potential criminal liability under the Data Protection Act.

Claude Code sends prompts to Anthropic's API over the internet — anything in a prompt leaves your environment. Non-production databases should always have PII redacted which helps, but sanitising prompts must be consistent regardless of environment.

The practical habit is simple — only give the agent what it needs. When debugging an endpoint, strip all patient data from the prompt. Use synthetic data libraries like Bogus for test data, never real records.

Staff training matters too. The biggest risk isn't malicious intent — it's a developer pasting a stack trace without thinking. Building safe prompt habits across the whole team is as important as any technical control."

### Ideas noted today
- Build a daily AI digest — GitHub Actions, Anthropic API, email delivery
- Morning coffee format: title, date, link, paragraph summary, no subscription articles
- Build in week 5 as the routines and loops exercise
- Estimated cost: ~$1-2/month

### Time saved today
- No coding today by design — thinking and safety work
- Safety position statement drafted, polished and ready for interviews and conversations

## Day 3 — 21 May 2026

### Code review findings

- Claude gave a good account of what to look for and why it made smart choices, specifically the guards confirming the front and backend data typings matching.

- Strongly typed types in TypeScript is good for preventing shipping bugs

- The CSS patterns are a good base for a starting point

- The media queries for dark mode was a welcome surprise
- We did not check media queries for responsive design, make a note to prompt and check

### London keynote observations

- Followed on from the San Fransisco talk

- Mostly the same speakers with the same message

- The product discussion did add some additional points about new beta features including tunnelling 
- Boris echoing the message that this is all available now, go and do it

### Prompt chaining observations

- One focused prompt beats one large prompt every time
- Agent stalled on 3+ tests in one go, succeeded on one at a time
- Agent made architectural decisions unprompted — promoted nextId 
  to public static to enable testability, then removed it entirely 
  when the repository pattern made it unnecessary
- Agent explained its reasoning on every non-obvious decision
- 9 tests total, all passing

### Repository pattern refactor

- Completed in 3m 5s, all 9 tests passing
- Agent removed its own previous static hacks unprompted
- Recognised NSubstitute as the right mocking library
- No intervention needed — got it right first time
- Estimated manual time: 2-3 hours

### Where the agent hit its limits

- Stalled on multiple test generation in one prompt
- Solution: one focused prompt at a time

### What I would not trust it to do unsupervised

- I am still at the beginning and learning so much! I enjoyed the terminal choices to be in control (accept changes or discard etc) so I can see the stack trace of events. 

- I did not particularly like the code the agent produced before we added DI and SOLID principles including for testing. Claude admitting this was a hack.
- I would not let claude do much unsupervised until I am more confident in my agentic AI capabilities.

### Time saved today

- Approximately 4-6 hours of manual 
  development compressed into under an hour of agent-directed work

## Day 2 — 20 May 2026

### Cursor vs Claude Code observations:

**1. What felt different about working in the editor vs terminal?

The cursor editor was fun but a bit chaotic coming into it blind, this feels like a swiss army knife of exciting tools I feel like I need to spend some time to get my head around. Also, I do not have an external monitor so it is difficult to fit everything on screen, for example, chat, code, browser, developer tools and possibly other things I have not even discovered yet. I need to spend some time looking at the code, I am sort of trusting its done a good job by validating the steps set up via claude, testing the endpoints 

**2. Which felt more natural for this kind of task?

I feel comfortable with both using claude and cursor, but it is still early days, but I would prefer to use claude terminal in the IDE (VS Code) rather than a separate application. Using the chat agent within the IDE is a positive step, presuming its helping and not hindering the progression of work.

**3. Where did Cursor's awareness of the full project help?

I assume by having the workspace set up as context, cursor was able to work its magic and scan the context of what was generated yesterday and get the frontend talking to the backend. It did well and more, it built everything without a hitch. Verifying steps as it went.

**4. What did I have to correct?

Nothing, this worked first time, although a boilerplate project so not to get too excited yet.

**5. Which tool would I reach for first on a real Radar ticket?

I think its difficult to say based on the tasks so far, Radar is a complex beast, it would be a case of test the waters and see. I would experiment with both before comitting to a real ticket, that would be dangerous.

### What surprised me today:

How quickly Cursor build the frontend, including fixing the CORS issue. I think everything was built in a few minutes. I liked that it asked before installing node packages, and that it tested the work before it declared job done.

### What the agent did beyond what I asked:

Cursor went well beyond the brief both times. Asked for a React frontend, it added a proper API layer, TypeScript types, and solved CORS before you even noticed it was a problem. Asked for error states, it created typed errors, runtime type guards, a dedicated component, and user-friendly error messages that even tell you how to fix the issue. Every time it made architectural decisions you didn't ask for — and got them right.

### Time saved vs doing it manually:

The frontend was built in under 10 minutes — Cursor's own logs show ~1.5 minutes for the Vite scaffold and npm install, with the full wiring of the API layer, TypeScript types, CORS and proxy on top of that. Manually this would have been 2-3 hours of setup, configuration and debugging.

This is a whole new world for development, and especially scaffolding projects. I do need to review the code tomorrow with a clear head to better understand what it has created.

## Day 1 — 19 May 2026

**1. What did the agent do that surprised me?

I was surprised how quickly it generated the project, however I may need to dive deeper into understanding the jargon its outputting whilst its thinking/doing stuff in the background. It might be good to have an hour or two before diving into day two to get more familiar with claude code. The UX of Claude in the terminal is impressive.

**2. Where did it go wrong and how did it fix itself?

The task was to pretty much get everything up and running and to generate the command line command to generate the APIs and have them running. It was generating errors but fixed them automatically. It was good to have control and be asked to continue rather than the AI agent just go off in a tangent and perform everything too quickily to understand what was happening.

**3. What would I have done differently?

This version of .NET is new to me and the syntax is a different to what I am used to, by having tests we are confirming it is working, also by manually testing the APIs via CURL we are gaining confidence we are happy with the output.
This is still early days, its just one file, not to get too excited yet.
I would like to ditch powershell and use VS code terminal instead, so I can have the code open as well as the terminal in one app.

**4. How long would this have taken me to write manually?

Its not overly complicated what we've asked the agent to build, but agree this is faster that what a human would code, the tests being written between 2-3 minutes was great. I would have taken an hour or two to get things running.

**5. What would I not trust it to do unsupervised?

I like that in the beginning when setting up claude it will never delete important code like tables etc without confirmation, this could be tragic if it was to happen within an organisation. I would not like it to do everything without a human, software developers need to review at some point. 

**6. Errors the agent hit and fixed automatically:

Two issues came up during the build:

**1. Mangled output path — dotnet new was called via the Bash tool with
  -o C:\Users\jamie\code\radar-practice\ItemsApi, but the Windows path 
   got corrupted into a single token, so the project landed in a folder 
   named Usersjamiecoderadar-practiceItemsApi instead of ItemsApi. 
   Fixed by renaming the folder with Rename-Item.
**2. Locked binary blocking the test build — when the tests were first run,
  the ItemsApi.exe binary was still held open by a dotnet run process 
   (PID 37776) from an earlier session. MSBuild couldn't overwrite it and 
   failed after 10 retries. Fixed by killing that process with Stop-Process 
   before re-running the tests.

The code itself compiled and all tests passed on the first attempt — both 
issues were environment/tooling problems rather than code errors, and both 
were resolved by the agent without manual intervention.

