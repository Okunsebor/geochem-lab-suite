# mattpocock/skills — Skills for Real Engineers

> Source: [github.com/mattpocock/skills](https://github.com/mattpocock/skills)

My agent skills that I use every day to do real engineering — not vibe coding.

Developing real applications is hard. Approaches like GSD, BMAD, and Spec-Kit try to help by owning the process. But while doing so, they take away your control and make bugs in the process hard to resolve.

These skills are designed to be small, easy to adapt, and composable. They work with any model. They're based on decades of engineering experience. Hack around with them. Make them your own. Enjoy.

---

## Quickstart (30-second setup)

1. Run the skills.sh installer:
   ```
   npx skills@latest add mattpocock/skills
   ```
2. Pick the skills you want, and which coding agents you want to install them on. **Make sure you select `/setup-matt-pocock-skills`**.
3. Run `/setup-matt-pocock-skills` in your agent. It will:
   - Ask you which issue tracker you want to use (GitHub, Linear, or local files)
   - Ask you what labels you apply to tickets when you triage them (`/triage` uses labels)
   - Ask you where you want to save any docs we create
4. Bam — you're ready to go.

---

## Why These Skills Exist

These skills fix four common failure modes seen with Claude Code, Codex, and other coding agents.

### #1: The Agent Didn't Do What I Want

> "No-one knows exactly what they want." — David Thomas & Andrew Hunt, *The Pragmatic Programmer*

**The Problem.** The most common failure mode in software development is misalignment. You think the dev knows what you want. Then you see what they've built — and you realize it didn't understand you at all.

This is just the same in the AI age. There is a communication gap between you and the agent. The fix for this is a **grilling session** — getting the agent to ask you detailed questions about what you're building.

**The Fix** is to use:
- [`/grill-me`](skills/productivity/grill-me/SKILL.md) — for non-code uses
- [`/grill-with-docs`](skills/engineering/grill-with-docs/SKILL.md) — same as `/grill-me`, but adds more goodies

These are the most popular skills. They help you align with the agent before you get started, and think deeply about the change you're making. Use them *every* time you want to make a change.

### #2: The Agent Is Way Too Verbose

> "With a ubiquitous language, conversations among developers and expressions of the code are all derived from the same domain model." — Eric Evans, *Domain-Driven Design*

**The Problem.** Agents are usually dropped into a project and asked to figure out the jargon as they go. So they use 20 words where 1 will do.

**The Fix** is a shared language — a document that helps agents decode the jargon used in the project. This is built into `/grill-with-docs`. It builds a shared language with the AI and documents hard-to-explain decisions in ADRs.

> **Tip:** A shared language also means variables, functions and files are named consistently; the codebase is easier to navigate for the agent; and the agent spends fewer tokens on thinking.

### #3: The Code Doesn't Work

> "Always take small, deliberate steps. The rate of feedback is your speed limit." — David Thomas & Andrew Hunt, *The Pragmatic Programmer*

**The Problem.** Without feedback on how the code it produces actually runs, the agent will be flying blind. You need fast feedback loops: static types, browser access, and automated tests.

**The Fix.** For automated tests, a red-green-refactor loop is critical. The `/tdd` skill encourages this and gives the agent guidance on what makes good and bad tests. For debugging, `/diagnose` wraps best debugging practices into a simple loop.

### #4: We Built A Ball Of Mud

> "Invest in the design of the system *every day*." — Kent Beck, *Extreme Programming Explained*

**The Problem.** Most apps built with agents are complex and hard to change. Because agents can radically speed up coding, they also accelerate software entropy.

**The Fix.** Caring about the design of the code. This is built into every layer of these skills:
- `/to-prd` quizzes you about which modules you're touching before creating a PRD
- `/zoom-out` tells the agent to explain code in the context of the whole system
- `/improve-codebase-architecture` helps you rescue a codebase that has become a ball of mud — run it once every few days

---

## Skills Reference

### Engineering

Skills used daily for code work.

| Skill | Description |
|---|---|
| `/diagnose` | Disciplined diagnosis loop for hard bugs and performance regressions: reproduce → minimise → hypothesise → instrument → fix → regression-test. |
| `/grill-with-docs` | Grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates `CONTEXT.md` and ADRs inline. |
| `/triage` | Triage issues through a state machine of triage roles. |
| `/improve-codebase-architecture` | Find deepening opportunities in a codebase, informed by the domain language in `CONTEXT.md` and the decisions in `docs/adr/`. |
| `/setup-matt-pocock-skills` | Scaffold the per-repo config (issue tracker, triage label vocabulary, domain doc layout) that the other engineering skills consume. Run once per repo. |
| `/tdd` | Test-driven development with a red-green-refactor loop. Builds features or fixes bugs one vertical slice at a time. |
| `/to-issues` | Break any plan, spec, or PRD into independently-grabbable GitHub issues using vertical slices. |
| `/to-prd` | Turn the current conversation context into a PRD and submit it as a GitHub issue. No interview — just synthesizes what you've already discussed. |
| `/zoom-out` | Tell the agent to zoom out and give broader context or a higher-level perspective on an unfamiliar section of code. |
| `/prototype` | Build a throwaway prototype to flesh out a design — either a runnable terminal app or several radically different UI variations. |

### Productivity

General workflow tools, not code-specific.

| Skill | Description |
|---|---|
| `/caveman` | Ultra-compressed communication mode. Cuts token usage ~75% by dropping filler while keeping full technical accuracy. |
| `/grill-me` | Get relentlessly interviewed about a plan or design until every branch of the decision tree is resolved. |
| `/handoff` | Compact the current conversation into a handoff document so another agent can continue the work. |
| `/write-a-skill` | Create new skills with proper structure, progressive disclosure, and bundled resources. |

### Misc

Tools kept around but rarely used.

| Skill | Description |
|---|---|
| `/git-guardrails-claude-code` | Set up Claude Code hooks to block dangerous git commands (push, reset --hard, clean, etc.) before they execute. |
| `/migrate-to-shoehorn` | Migrate test files from `as` type assertions to `@total-typescript/shoehorn`. |
| `/scaffold-exercises` | Create exercise directory structures with sections, problems, solutions, and explainers. |
| `/setup-pre-commit` | Set up Husky pre-commit hooks with lint-staged, Prettier, type checking, and tests. |
