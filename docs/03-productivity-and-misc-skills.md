**Productivity & Misc Skills**

General workflow tools and miscellaneous utilities from
mattpocock/skills.

Source: github.com/mattpocock/skills/tree/main/skills

**Productivity Skills**

General workflow tools, not code-specific.

**/grill-me**

---

**name** grill-me

**description** Interview the user relentlessly about a plan or design
until reaching shared understanding, resolving each
branch of the decision tree. Use when user wants to
stress-test a plan, get grilled on their design, or
mentions \"grill me\".

---

Interview me relentlessly about every aspect of this plan until we reach
a shared understanding. Walk down each branch of the design tree,
resolving dependencies between decisions one-by-one. For each question,
provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the
codebase instead.

**/caveman**

---

**name** caveman

**description** Ultra-compressed communication mode. Cuts token usage
\~75% by dropping filler, articles, and pleasantries
while keeping full technical accuracy. Use when user
says \"caveman mode\", \"talk like caveman\", \"use
caveman\", \"less tokens\", \"be brief\", or invokes
/caveman.

---

Respond terse like smart caveman. All technical substance stay. Only
fluff die.

**Persistence**

ACTIVE EVERY RESPONSE once triggered. No revert after many turns. No
filler drift. Still active if unsure. Off only when user says \"stop
caveman\" or \"normal mode\".

**Rules**

Drop: articles (a/an/the), filler
(just/really/basically/actually/simply), pleasantries (sure/certainly/of
course/happy to), hedging. Fragments OK. Short synonyms (big not
extensive, fix not \"implement a solution for\"). Abbreviate common
terms (DB/auth/config/req/res/fn/impl). Strip conjunctions. Use arrows
for causality (X -\> Y). One word when one word enough.

Technical terms stay exact. Code blocks unchanged. Errors quoted exact.

Pattern: \[thing\] \[action\] \[reason\]. \[next step\].

Not: \"Sure! I\'d be happy to help you with that. The issue you\'re
experiencing is likely caused by\...\"

Yes: \"Bug in auth middleware. Token expiry check use \< not \<=. Fix:\"

**Examples**

\"Why React component re-render?\" → Inline obj prop -\> new ref -\>
re-render. useMemo.

\"Explain database connection pooling.\" → Pool = reuse DB conn. Skip
handshake -\> fast under load.

**Auto-Clarity Exception**

Drop caveman temporarily for: security warnings, irreversible action
confirmations, multi-step sequences where fragment order risks misread,
user asks to clarify or repeats question. Resume caveman after clear
part done.

**/handoff**

---

**name** handoff

**description** Compact the current conversation into a handoff
document for another agent to pick up.

**argument-hint** What will the next session be used for?

---

Write a handoff document summarising the current conversation so a fresh
agent can continue the work. Save it to a path produced by mktemp -t
handoff-XXXXXX.md (read the file before you write to it).

Suggest the skills to be used, if any, by the next session.

Do not duplicate content already captured in other artifacts (PRDs,
plans, ADRs, issues, commits, diffs). Reference them by path or URL
instead.

If the user passed arguments, treat them as a description of what the
next session will focus on and tailor the doc accordingly.

**/write-a-skill**

---

**name** write-a-skill

**description** Create new agent skills with proper structure,
progressive disclosure, and bundled resources. Use when
user wants to create, write, or build a new skill.

---

**Process**

1.  Gather requirements --- ask user about: What task/domain does the
    skill cover? What specific use cases should it handle? Does it need
    executable scripts or just instructions? Any reference materials to
    include?

2.  Draft the skill --- create: SKILL.md with concise instructions,
    additional reference files if content exceeds 500 lines, utility
    scripts if deterministic operations needed.

3.  Review with user --- present draft and ask: Does this cover your use
    cases? Anything missing or unclear? Should any section be more/less
    detailed?

**Skill Structure**

+-----------------------------------------------------------------------+
| skill-name/ |
| |
| ├── SKILL.md \# Main instructions (required) |
| |
| ├── REFERENCE.md \# Detailed docs (if needed) |
| |
| ├── EXAMPLES.md \# Usage examples (if needed) |
| |
| └── scripts/ \# Utility scripts (if needed) |
| |
| └── helper.js |
+-----------------------------------------------------------------------+

**SKILL.md Template**

+-----------------------------------------------------------------------+
| \-\-- |
| |
| name: skill-name |
| |
| description: Brief description of capability. Use when \[specific |
| triggers\]. |
| |
| \-\-- |
| |
| \# Skill Name |
| |
| \## Quick start |
| |
| \[Minimal working example\] |
| |
| \## Workflows |
| |
| \[Step-by-step processes with checklists for complex tasks\] |
| |
| \## Advanced features |
| |
| \[Link to separate files: See REFERENCE.md\] |
+-----------------------------------------------------------------------+

**Description Requirements**

The description is the only thing your agent sees when deciding which
skill to load. It\'s surfaced in the system prompt alongside all other
installed skills. Your agent reads these descriptions and picks the
relevant skill based on the user\'s request.

Goal: Give your agent just enough info to know: (1) What capability this
skill provides, (2) When/why to trigger it.

Format:

- Max 1024 chars

- Write in third person

- First sentence: what it does

- Second sentence: \"Use when \[specific triggers\]\"

Good example: \"Extract text and tables from PDF files, fill forms,
merge documents. Use when working with PDF files or when user mentions
PDFs, forms, or document extraction.\"

Bad example: \"Helps with documents.\" --- gives your agent no way to
distinguish this from other document skills.

**When to Add Scripts**

Add utility scripts when: operation is deterministic (validation,
formatting), same code would be generated repeatedly, errors need
explicit handling. Scripts save tokens and improve reliability vs
generated code.

**When to Split Files**

Split into separate files when: SKILL.md exceeds 100 lines, content has
distinct domains, advanced features are rarely needed.

**Review Checklist**

+-----------------------------------------------------------------------+
| After drafting, verify: |
| |
| \- Description includes triggers (\"Use when\...\") |
| |
| \- SKILL.md under 100 lines |
| |
| \- No time-sensitive info |
| |
| \- Consistent terminology |
| |
| \- Concrete examples included |
| |
| \- References one level deep |
+-----------------------------------------------------------------------+

**Misc Skills**

Tools kept around but rarely used.

**/git-guardrails-claude-code**

---

**name** git-guardrails-claude-code

**description** Set up Claude Code hooks to block dangerous git
commands (push, reset \--hard, clean, branch -D, etc.)
before they execute. Use when user wants to prevent
destructive git operations, add git safety hooks, or
block git push/reset in Claude Code.

---

Sets up a PreToolUse hook that intercepts and blocks dangerous git
commands before Claude executes them.

**What Gets Blocked**

- git push (all variants including \--force)

- git reset \--hard

- git clean -f / git clean -fd

- git branch -D

- git checkout . / git restore .

When blocked, Claude sees a message telling it that it does not have
authority to access these commands.

**Steps**

**1. Ask scope: Install for this project only (.claude/settings.json) or
all projects (\~/.claude/settings.json)?**

**2. Copy the hook script: scripts/block-dangerous-git.sh**

Copy it to the target location based on scope:

- Project: .claude/hooks/block-dangerous-git.sh

- Global: \~/.claude/hooks/block-dangerous-git.sh

Make it executable with chmod +x.

**3. Add hook to settings**

Project (.claude/settings.json):

+-----------------------------------------------------------------------+
| { |
| |
| \"hooks\": { |
| |
| \"PreToolUse\": \[ |
| |
| { |
| |
| \"matcher\": \"Bash\", |
| |
| \"hooks\": \[ |
| |
| { |
| |
| \"type\": \"command\", |
| |
| \"command\": |
| \"\\\"\$CLAUDE_PROJECT_DIR\\\"/.claude/hooks/block-dangerous-git.sh\" |
| |
| } |
| |
| \] |
| |
| } |
| |
| \] |
| |
| } |
| |
| } |
+-----------------------------------------------------------------------+

Global (\~/.claude/settings.json):

+-----------------------------------------------------------------------+
| { |
| |
| \"hooks\": { |
| |
| \"PreToolUse\": \[ |
| |
| { |
| |
| \"matcher\": \"Bash\", |
| |
| \"hooks\": \[ |
| |
| { |
| |
| \"type\": \"command\", |
| |
| \"command\": \"\~/.claude/hooks/block-dangerous-git.sh\" |
| |
| } |
| |
| \] |
| |
| } |
| |
| \] |
| |
| } |
| |
| } |
+-----------------------------------------------------------------------+

If the settings file already exists, merge the hook into existing
hooks.PreToolUse array --- don\'t overwrite other settings.

4\. Ask about customization: Ask if user wants to add or remove any
patterns from the blocked list.

**5. Verify:**

---

echo \'{\"tool_input\":{\"command\":\"git push origin main\"}}\' \|
\<path-to-script\>

---

Should exit with code 2 and print a BLOCKED message to stderr.

**/setup-pre-commit**

---

**name** setup-pre-commit

**description** Set up Husky pre-commit hooks with lint-staged
(Prettier), type checking, and tests in the current
repo. Use when user wants to add pre-commit hooks, set
up Husky, configure lint-staged, or add commit-time
formatting/typechecking/testing.

---

**What This Sets Up**

- Husky pre-commit hook

- lint-staged running Prettier on all staged files

- Prettier config (if missing)

- typecheck and test scripts in the pre-commit hook

**Steps**

1\. Detect package manager: Check for package-lock.json (npm),
pnpm-lock.yaml (pnpm), yarn.lock (yarn), bun.lockb (bun). Default to npm
if unclear.

**2. Install dependencies as devDependencies:**

---

husky lint-staged prettier

---

**3. Initialize Husky:**

---

npx husky init

---

This creates .husky/ dir and adds prepare: \"husky\" to package.json.

**4. Create .husky/pre-commit (no shebang needed for Husky v9+):**

+-----------------------------------------------------------------------+
| npx lint-staged |
| |
| npm run typecheck |
| |
| npm run test |
+-----------------------------------------------------------------------+

Adapt: Replace npm with detected package manager. If repo has no
typecheck or test script, omit those lines.

**5. Create .lintstagedrc:**

+-----------------------------------------------------------------------+
| { |
| |
| \"\*\": \"prettier \--ignore-unknown \--write\" |
| |
| } |
+-----------------------------------------------------------------------+

**6. Create .prettierrc (if missing):**

+-----------------------------------------------------------------------+
| { |
| |
| \"useTabs\": false, |
| |
| \"tabWidth\": 2, |
| |
| \"printWidth\": 80, |
| |
| \"singleQuote\": false, |
| |
| \"trailingComma\": \"es5\", |
| |
| \"semi\": true, |
| |
| \"arrowParens\": \"always\" |
| |
| } |
+-----------------------------------------------------------------------+

**7. Verify:**

- .husky/pre-commit exists and is executable

- .lintstagedrc exists

- prepare script in package.json is \"husky\"

- prettier config exists

- Run npx lint-staged to verify it works

8\. Commit: Stage all changed/created files and commit with message: Add
pre-commit hooks (husky + lint-staged + prettier). This will run through
the new pre-commit hooks --- a good smoke test that everything works.

**Notes**

- Husky v9+ doesn\'t need shebangs in hook files

- prettier \--ignore-unknown skips files Prettier can\'t parse
  (images, etc.)

- The pre-commit runs lint-staged first (fast, staged-only), then full
  typecheck and tests
