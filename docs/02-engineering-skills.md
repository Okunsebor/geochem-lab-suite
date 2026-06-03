**Engineering Skills**

Skills for real code work --- used daily in production engineering.

Source: github.com/mattpocock/skills/tree/main/skills/engineering

**/diagnose**

  ----------------- -------------------------------------------------------
  **name**          diagnose

  **description**   Disciplined diagnosis loop for hard bugs and
                    performance regressions. Reproduce → minimise →
                    hypothesise → instrument → fix → regression-test. Use
                    when user says \"diagnose this\" / \"debug this\",
                    reports a bug, says something is
                    broken/throwing/failing, or describes a performance
                    regression.
  ----------------- -------------------------------------------------------

**Diagnose**

A discipline for hard bugs. Skip phases only when explicitly justified.

When exploring the codebase, use the project\'s domain glossary to get a
clear mental model of the relevant modules, and check ADRs in the area
you\'re touching.

**Phase 1 --- Build a feedback loop**

This is the skill. Everything else is mechanical. If you have a fast,
deterministic, agent-runnable pass/fail signal for the bug, you will
find the cause --- bisection, hypothesis-testing, and instrumentation
all just consume that signal. If you don\'t have one, no amount of
staring at code will save you.

Spend disproportionate effort here. Be aggressive. Be creative. Refuse
to give up.

**Ways to construct one --- try them in roughly this order:**

1.  Failing test at whatever seam reaches the bug --- unit, integration,
    e2e.

2.  Curl / HTTP script against a running dev server.

3.  CLI invocation with a fixture input, diffing stdout against a
    known-good snapshot.

4.  Headless browser script (Playwright / Puppeteer) --- drives the UI,
    asserts on DOM/console/network.

5.  Replay a captured trace. Save a real network request / payload /
    event log to disk; replay it through the code path in isolation.

6.  Throwaway harness. Spin up a minimal subset of the system (one
    service, mocked deps) that exercises the bug code path with a single
    function call.

7.  Property / fuzz loop. If the bug is \"sometimes wrong output\", run
    1000 random inputs and look for the failure mode.

8.  Bisection harness. If the bug appeared between two known states
    (commit, dataset, version), automate \"boot at state X, check,
    repeat\" so you can git bisect run it.

9.  Differential loop. Run the same input through old-version vs
    new-version (or two configs) and diff outputs.

10. HITL bash script. Last resort. If a human must click, drive them
    with scripts/hitl-loop.template.sh so the loop is still structured.

Build the right feedback loop, and the bug is 90% fixed.

**Iterate on the loop itself --- treat the loop as a product. Once you
have a loop, ask:**

-   Can I make it faster? (Cache setup, skip unrelated init, narrow the
    test scope.)

-   Can I make the signal sharper? (Assert on the specific symptom, not
    \"didn\'t crash\".)

-   Can I make it more deterministic? (Pin time, seed RNG, isolate
    filesystem, freeze network.)

A 30-second flaky loop is barely better than no loop. A 2-second
deterministic loop is a debugging superpower.

Non-deterministic bugs: The goal is not a clean repro but a higher
reproduction rate. Loop the trigger 100×, parallelise, add stress,
narrow timing windows, inject sleeps.

When you genuinely cannot build a loop: Stop and say so explicitly. List
what you tried. Ask the user for: (a) access to whatever environment
reproduces it, (b) a captured artifact (HAR file, log dump, core dump,
screen recording with timestamps), or (c) permission to add temporary
production instrumentation. Do not proceed to hypothesise without a
loop.

**Phase 2 --- Reproduce**

Run the loop. Watch the bug appear. Confirm the loop produces the
failure mode the user described --- not a different failure that happens
to be nearby. Wrong bug = wrong fix. Confirm the failure is
reproducible. Capture the exact symptom so later phases can verify the
fix actually addresses it. Do not proceed until you reproduce the bug.

**Phase 3 --- Hypothesise**

Generate 3--5 ranked hypotheses before testing any of them.
Single-hypothesis generation anchors on the first plausible idea.

Each hypothesis must be falsifiable: state the prediction it makes.
Format: \"If \<X\> is the cause, then \<Y\> will make the bug disappear
/ \<Z\> will make it worse.\"

Show the ranked list to the user before testing. They often have domain
knowledge that re-ranks instantly.

**Phase 4 --- Instrument**

Each probe must map to a specific prediction from Phase 3. Change one
variable at a time.

**Tool preference:**

11. Debugger / REPL inspection if the env supports it. One breakpoint
    beats ten logs.

12. Targeted logs at the boundaries that distinguish hypotheses.

13. Never \"log everything and grep\".

Tag every debug log with a unique prefix, e.g. \[DEBUG-a4f2\]. Cleanup
at the end becomes a single grep. Untagged logs survive; tagged logs
die.

Perf branch: For performance regressions, logs are usually wrong.
Instead: establish a baseline measurement, then bisect. Measure first,
fix second.

**Phase 5 --- Fix + regression test**

Write the regression test before the fix --- but only if there is a
correct seam for it. A correct seam is one where the test exercises the
real bug pattern as it occurs at the call site.

If no correct seam exists, that itself is the finding. Note it. The
codebase architecture is preventing the bug from being locked down. Flag
this for the next phase.

**If a correct seam exists:**

14. Turn the minimised repro into a failing test at that seam.

15. Watch it fail.

16. Apply the fix.

17. Watch it pass.

18. Re-run the Phase 1 feedback loop against the original (un-minimised)
    scenario.

**Phase 6 --- Cleanup + post-mortem**

**Required before declaring done:**

-   Original repro no longer reproduces (re-run the Phase 1 loop)

-   Regression test passes (or absence of seam is documented)

-   All \[DEBUG-\...\] instrumentation removed (grep the prefix)

-   Throwaway prototypes deleted (or moved to a clearly-marked debug
    location)

-   The hypothesis that turned out correct is stated in the commit / PR
    message

Then ask: what would have prevented this bug? If the answer involves
architectural change, hand off to the /improve-codebase-architecture
skill with the specifics.

**/grill-with-docs**

  ------------------------------ -------------------------------------------------------
  **name**                       grill-with-docs

  **description**                Grilling session that challenges your plan against the
                                 existing domain model, sharpens terminology, and
                                 updates documentation (CONTEXT.md, ADRs) inline as
                                 decisions crystallise. Use when user wants to
                                 stress-test a plan against their project\'s language
                                 and documented decisions.

  **disable-model-invocation**   true
  ------------------------------ -------------------------------------------------------

Interview me relentlessly about every aspect of this plan until we reach
a shared understanding. Walk down each branch of the design tree,
resolving dependencies between decisions one-by-one. For each question,
provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question
before continuing.

If a question can be answered by exploring the codebase, explore the
codebase instead.

**Domain Awareness**

During codebase exploration, also look for existing documentation:

**Most repos have a single context:**

+-----------------------------------------------------------------------+
| /                                                                     |
|                                                                       |
| ├── CONTEXT.md                                                        |
|                                                                       |
| ├── docs/                                                             |
|                                                                       |
| │ └── adr/                                                            |
|                                                                       |
| │ ├── 0001-event-sourced-orders.md                                    |
|                                                                       |
| │ └── 0002-postgres-for-write-model.md                                |
|                                                                       |
| └── src/                                                              |
+-----------------------------------------------------------------------+

**If a CONTEXT-MAP.md exists at the root, the repo has multiple
contexts:**

+-----------------------------------------------------------------------+
| /                                                                     |
|                                                                       |
| ├── CONTEXT-MAP.md                                                    |
|                                                                       |
| ├── docs/                                                             |
|                                                                       |
| │ └── adr/ ← system-wide decisions                                    |
|                                                                       |
| ├── src/                                                              |
|                                                                       |
| │ ├── ordering/                                                       |
|                                                                       |
| │ │ ├── CONTEXT.md                                                    |
|                                                                       |
| │ │ └── docs/adr/ ← context-specific decisions                        |
|                                                                       |
| │ └── billing/                                                        |
|                                                                       |
| │ ├── CONTEXT.md                                                      |
|                                                                       |
| │ └── docs/adr/                                                       |
+-----------------------------------------------------------------------+

Create files lazily --- only when you have something to write.

**During the session**

**Challenge against the glossary: When the user uses a term that
conflicts with the existing language in CONTEXT.md, call it out
immediately.**

**Sharpen fuzzy language: When the user uses vague or overloaded terms,
propose a precise canonical term. \"You\'re saying \'account\' --- do
you mean the Customer or the User?\"**

**Discuss concrete scenarios: When domain relationships are being
discussed, stress-test them with specific scenarios that probe edge
cases.**

**Cross-reference with code: When the user states how something works,
check whether the code agrees. If you find a contradiction, surface
it.**

**Update CONTEXT.md inline: When a term is resolved, update CONTEXT.md
right there. Don\'t batch these up --- capture them as they happen.**

Don\'t couple CONTEXT.md to implementation details. Only include terms
that are meaningful to domain experts.

**Offer ADRs sparingly --- only when all three are true:**

19. Hard to reverse --- the cost of changing your mind later is
    meaningful.

20. Surprising without context --- a future reader will wonder \"why did
    they do it this way?\"

21. The result of a real trade-off --- there were genuine alternatives
    and you picked one for specific reasons.

If any of the three is missing, skip the ADR.

**/tdd**

  ----------------- -------------------------------------------------------
  **name**          tdd

  **description**   Test-driven development with red-green-refactor loop.
                    Use when user wants to build features or fix bugs using
                    TDD, mentions \"red-green-refactor\", wants integration
                    tests, or asks for test-first development.
  ----------------- -------------------------------------------------------

**Philosophy**

**Core principle: Tests should verify behavior through public
interfaces, not implementation details. Code can change entirely; tests
shouldn\'t.**

Good tests are integration-style: they exercise real code paths through
public APIs. They describe what the system does, not how it does it. A
good test reads like a specification --- \"user can checkout with valid
cart\" tells you exactly what capability exists.

Bad tests are coupled to implementation. They mock internal
collaborators, test private methods, or verify through external means
(like querying a database directly instead of using the interface). The
warning sign: your test breaks when you refactor, but behavior hasn\'t
changed.

**Anti-Pattern: Horizontal Slices**

**DO NOT write all tests first, then all implementation. This is
\"horizontal slicing\" --- treating RED as \"write all tests\" and GREEN
as \"write all code.\"**

This produces crap tests: tests written in bulk test imagined behavior,
not actual behavior. You end up testing the shape of things rather than
user-facing behavior. Tests become insensitive to real changes.

**Correct approach: Vertical slices via tracer bullets. One test → one
implementation → repeat.**

+-----------------------------------------------------------------------+
| WRONG (horizontal):                                                   |
|                                                                       |
| RED: test1, test2, test3, test4, test5                                |
|                                                                       |
| GREEN: impl1, impl2, impl3, impl4, impl5                              |
|                                                                       |
| RIGHT (vertical):                                                     |
|                                                                       |
| RED→GREEN: test1→impl1                                                |
|                                                                       |
| RED→GREEN: test2→impl2                                                |
|                                                                       |
| RED→GREEN: test3→impl3                                                |
|                                                                       |
| \...                                                                  |
+-----------------------------------------------------------------------+

**Workflow**

**1. Planning**

Before writing any code:

-   Confirm with user what interface changes are needed

-   Confirm with user which behaviors to test (prioritize)

-   Identify opportunities for deep modules (small interface, deep
    implementation)

-   Design interfaces for testability

-   List the behaviors to test (not implementation steps)

-   Get user approval on the plan

Ask: \"What should the public interface look like? Which behaviors are
most important to test?\"

**2. Tracer Bullet**

Write ONE test that confirms ONE thing about the system:

+-----------------------------------------------------------------------+
| RED: Write test for first behavior → test fails                       |
|                                                                       |
| GREEN: Write minimal code to pass → test passes                       |
+-----------------------------------------------------------------------+

This is your tracer bullet --- proves the path works end-to-end.

**3. Incremental Loop**

For each remaining behavior:

+-----------------------------------------------------------------------+
| RED: Write next test → fails                                          |
|                                                                       |
| GREEN: Minimal code to pass → passes                                  |
+-----------------------------------------------------------------------+

Rules:

-   One test at a time

-   Only enough code to pass current test

-   Don\'t anticipate future tests

-   Keep tests focused on observable behavior

**4. Refactor**

After all tests pass, look for refactor candidates:

-   Extract duplication

-   Deepen modules (move complexity behind simple interfaces)

-   Apply SOLID principles where natural

-   Consider what new code reveals about existing code

-   Run tests after each refactor step

**Never refactor while RED. Get to GREEN first.**

**Checklist Per Cycle**

+-----------------------------------------------------------------------+
| \[ \] Test describes behavior, not implementation                     |
|                                                                       |
| \[ \] Test uses public interface only                                 |
|                                                                       |
| \[ \] Test would survive internal refactor                            |
|                                                                       |
| \[ \] Code is minimal for this test                                   |
|                                                                       |
| \[ \] No speculative features added                                   |
+-----------------------------------------------------------------------+

**/improve-codebase-architecture**

  ----------------- -------------------------------------------------------
  **name**          improve-codebase-architecture

  **description**   Find deepening opportunities in a codebase, informed by
                    the domain language in CONTEXT.md and the decisions in
                    docs/adr/. Use when the user wants to improve
                    architecture, find refactoring opportunities,
                    consolidate tightly-coupled modules, or make a codebase
                    more testable and AI-navigable.
  ----------------- -------------------------------------------------------

Surface architectural friction and propose deepening opportunities ---
refactors that turn shallow modules into deep ones. The aim is
testability and AI-navigability.

**Glossary**

Use these terms exactly in every suggestion. Consistent language is the
point.

  -------------------- -------------------------------------------------------
  **Module**           Anything with an interface and an implementation
                       (function, class, package, slice).

  **Interface**        Everything a caller must know to use the module: types,
                       invariants, error modes, ordering, config. Not just the
                       type signature.

  **Implementation**   The code inside.

  **Depth**            Leverage at the interface: a lot of behaviour behind a
                       small interface. Deep = high leverage. Shallow =
                       interface nearly as complex as the implementation.

  **Seam**             Where an interface lives; a place behaviour can be
                       altered without editing in place. (Use this, not
                       \"boundary\".)

  **Adapter**          A concrete thing satisfying an interface at a seam.

  **Leverage**         What callers get from depth.

  **Locality**         What maintainers get from depth: change, bugs,
                       knowledge concentrated in one place.
  -------------------- -------------------------------------------------------

**Key principles:**

-   Deletion test: imagine deleting the module. If complexity vanishes,
    it was a pass-through. If complexity reappears across N callers, it
    was earning its keep.

-   The interface is the test surface.

-   One adapter = hypothetical seam. Two adapters = real seam.

**Process**

**1. Explore**

Read the project\'s domain glossary and any ADRs in the area you\'re
touching first. Then walk the codebase organically and note where you
experience friction:

-   Where does understanding one concept require bouncing between many
    small modules?

-   Where are modules shallow --- interface nearly as complex as the
    implementation?

-   Where have pure functions been extracted just for testability, but
    the real bugs hide in how they\'re called (no locality)?

-   Where do tightly-coupled modules leak across their seams?

-   Which parts of the codebase are untested, or hard to test through
    their current interface?

Apply the deletion test to anything you suspect is shallow.

**2. Present candidates as an HTML report**

Write a self-contained HTML file to the OS temp directory. The report
uses Tailwind via CDN for layout and Mermaid via CDN for diagrams. Each
candidate gets a before/after visualisation. For each candidate:

-   Files --- which files/modules are involved

-   Problem --- why the current architecture is causing friction

-   Solution --- plain English description of what would change

-   Benefits --- explained in terms of locality and leverage

-   Before / After diagram --- side-by-side, custom-drawn

-   Recommendation strength --- one of Strong, Worth exploring,
    Speculative

End the report with a Top recommendation section: which candidate you\'d
tackle first and why.

**3. Grilling loop**

Once the user picks a candidate, drop into a grilling conversation. Walk
the design tree with them --- constraints, dependencies, the shape of
the deepened module, what sits behind the seam, what tests survive.

Side effects happen inline as decisions crystallize:

-   Naming a deepened module after a concept not in CONTEXT.md? Add the
    term to CONTEXT.md right there.

-   Sharpening a fuzzy term during the conversation? Update CONTEXT.md
    right there.

-   User rejects the candidate with a load-bearing reason? Offer an ADR
    framed as: \"Want me to record this as an ADR so future architecture
    reviews don\'t re-suggest it?\"

**/to-prd**

  ----------------- -------------------------------------------------------
  **name**          to-prd

  **description**   Turn the current conversation context into a PRD and
                    submit it as a GitHub issue. Use when user wants to
                    create a PRD from the current context.
  ----------------- -------------------------------------------------------

This skill takes the current conversation context and codebase
understanding and produces a PRD. Do NOT interview the user --- just
synthesize what you already know.

**Process**

22. Explore the repo to understand the current state of the codebase, if
    you haven\'t already.

23. Sketch out the major modules you will need to build or modify to
    complete the implementation. Actively look for opportunities to
    extract deep modules that can be tested in isolation.

A deep module (as opposed to a shallow module) is one which encapsulates
a lot of functionality in a simple, testable interface which rarely
changes.

Check with the user that these modules match their expectations. Check
with the user which modules they want tests written for.

24. Write the PRD using the template below and submit it as a GitHub
    issue.

**PRD Template**

**Problem Statement**

The problem that the user is facing, from the user\'s perspective.

**Solution**

The solution to the problem, from the user\'s perspective.

**User Stories**

A LONG, numbered list of user stories. Each user story should be in the
format of:

1\. As an \<actor\>, I want a \<feature\>, so that \<benefit\>

Example: \"As a mobile bank customer, I want to see balance on my
accounts, so that I can make better informed decisions about my
spending.\" This list should be extremely extensive and cover all
aspects of the feature.

**Implementation Decisions**

A list of implementation decisions that were made. This can include:

-   The modules that will be built/modified

-   The interfaces of those modules that will be modified

-   Technical clarifications from the developer

-   Architectural decisions

-   Schema changes

-   API contracts

-   Specific interactions

Do NOT include specific file paths or code snippets. They may end up
being outdated very quickly.

**Testing Decisions**

A list of testing decisions that were made. Include:

-   A description of what makes a good test (only test external
    behavior, not implementation details)

-   Which modules will be tested

-   Prior art for the tests (i.e. similar types of tests in the
    codebase)

**Out of Scope**

A description of the things that are out of scope for this PRD.

**Further Notes**

Any further notes about the feature.

**/to-issues**

  ----------------- -------------------------------------------------------
  **name**          to-issues

  **description**   Break a plan, spec, or PRD into independently-grabbable
                    GitHub issues using tracer-bullet vertical slices. Use
                    when user wants to convert a plan into issues, create
                    implementation tickets, or break down work into issues.
  ----------------- -------------------------------------------------------

Break a plan into independently-grabbable GitHub issues using vertical
slices (tracer bullets).

**Process**

**1. Gather context**

Work from whatever is already in the conversation context. If the user
passes a GitHub issue number or URL as an argument, fetch it with gh
issue view \<number\> (with comments).

**2. Explore the codebase (optional)**

If you have not already explored the codebase, do so to understand the
current state of the code.

**3. Draft vertical slices**

Break the plan into tracer bullet issues. Each issue is a thin vertical
slice that cuts through ALL integration layers end-to-end, NOT a
horizontal slice of one layer.

Slices may be \'HITL\' or \'AFK\'. HITL slices require human
interaction. AFK slices can be implemented and merged without human
interaction. Prefer AFK over HITL where possible.

-   Each slice delivers a narrow but COMPLETE path through every layer
    (schema, API, UI, tests)

-   A completed slice is demoable or verifiable on its own

-   Prefer many thin slices over few thick ones

**4. Quiz the user**

Present the proposed breakdown as a numbered list. For each slice, show:

-   Title: short descriptive name

-   Type: HITL / AFK

-   Blocked by: which other slices (if any) must complete first

-   User stories covered: which user stories this addresses

Ask: Does the granularity feel right? Are the dependency relationships
correct? Should any slices be merged or split? Are the correct slices
marked as HITL and AFK?

**5. Create the GitHub issues**

For each approved slice, create a GitHub issue using gh issue create.
Create issues in dependency order (blockers first) so you can reference
real issue numbers.

**Issue Template**

+-----------------------------------------------------------------------+
| \## Parent                                                            |
|                                                                       |
| \# \<issue number\> (if the source was a GitHub issue, otherwise      |
| omit)                                                                 |
|                                                                       |
| \## What to build                                                     |
|                                                                       |
| A concise description of this vertical slice. Describe the end-to-end |
|                                                                       |
| behavior, not layer-by-layer implementation.                          |
|                                                                       |
| \## Acceptance criteria                                               |
|                                                                       |
| \* Criterion 1                                                        |
|                                                                       |
| \* Criterion 2                                                        |
|                                                                       |
| \## Blocked by                                                        |
|                                                                       |
| \* Blocked by #\<number\> (if any)                                    |
|                                                                       |
| Or \"None - can start immediately\" if no blockers.                   |
+-----------------------------------------------------------------------+

Do NOT close or modify any parent issue.

**/triage**

  ----------------- -------------------------------------------------------
  **name**          triage

  **description**   Triage issues through a state machine driven by triage
                    roles. Use when user wants to create an issue, triage
                    issues, review incoming bugs or feature requests,
                    prepare issues for an AFK agent, or manage issue
                    workflow.
  ----------------- -------------------------------------------------------

Move issues on the project issue tracker through a small state machine
of triage roles.

**Every comment or issue posted to the issue tracker during triage must
start with this disclaimer:**

  -----------------------------------------------------------------------
  \> \*This was generated by AI during triage.\*

  -----------------------------------------------------------------------

**Roles**

**Two category roles:**

-   bug --- something is broken

-   enhancement --- new feature or improvement

**Five state roles:**

-   needs-triage --- maintainer needs to evaluate

-   needs-info --- waiting on reporter for more information

-   ready-for-agent --- fully specified, ready for an AFK agent

-   ready-for-human --- needs human implementation

-   wontfix --- will not be actioned

Every triaged issue should carry exactly one category role and one state
role.

State transitions: an unlabeled issue normally goes to needs-triage
first; from there it moves to needs-info, ready-for-agent,
ready-for-human, or wontfix. needs-info returns to needs-triage once the
reporter replies.

**Invocation**

The maintainer invokes /triage and describes what they want in natural
language. Examples:

-   \"Show me anything that needs my attention\"

-   \"Let\'s look at #42\"

-   \"Move #42 to ready-for-agent\"

-   \"What\'s ready for agents to pick up?\"

**Triage a specific issue**

25. Gather context. Read the full issue (body, comments, labels,
    reporter, dates). Explore the codebase using the project\'s domain
    glossary, respecting ADRs. Read .out-of-scope/\*.md.

26. Recommend. Tell the maintainer your category and state
    recommendation with reasoning. Wait for direction.

27. Reproduce (bugs only). Before any grilling, attempt reproduction.
    Report: successful repro with code path, failed repro, or
    insufficient detail.

28. Grill (if needed). If the issue needs fleshing out, run a
    /grill-with-docs session.

29. Apply the outcome.

Apply outcomes:

-   ready-for-agent --- post an agent brief comment.

-   ready-for-human --- same structure as an agent brief, but note why
    it can\'t be delegated.

-   needs-info --- post triage notes (template below).

-   wontfix (bug) --- polite explanation, then close.

-   wontfix (enhancement) --- write to .out-of-scope/, link to it from a
    comment, then close.

-   needs-triage --- apply the role. Optional comment if there\'s
    partial progress.

**Needs-info template**

+-----------------------------------------------------------------------+
| \## Triage Notes                                                      |
|                                                                       |
| \*\*What we\'ve established so far:\*\*                               |
|                                                                       |
| \- point 1                                                            |
|                                                                       |
| \- point 2                                                            |
|                                                                       |
| \*\*What we still need from you (@reporter):\*\*                      |
|                                                                       |
| \- question 1                                                         |
|                                                                       |
| \- question 2                                                         |
+-----------------------------------------------------------------------+

**/zoom-out**

  ------------------------------ -------------------------------------------------------
  **name**                       zoom-out

  **description**                Tell the agent to zoom out and give broader context or
                                 a higher-level perspective. Use when you\'re unfamiliar
                                 with a section of code or need to understand how it
                                 fits into the bigger picture.

  **disable-model-invocation**   true
  ------------------------------ -------------------------------------------------------

I don\'t know this area of code well. Go up a layer of abstraction. Give
me a map of all the relevant modules and callers, using the project\'s
domain glossary vocabulary.
