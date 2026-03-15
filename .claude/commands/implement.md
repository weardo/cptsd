---
name: implement
description: Execute an implementation plan with TDD and autonomous iteration
---

# Execute Implementation Plan

Work through a plan task-by-task using TDD. This command assumes a FRESH context — it should be the first thing run in a new session after planning.

**Plan:** $ARGUMENTS (path to plan file, e.g., `docs/plans/2026-01-15-feature-plan.md`)

If no argument provided, ask the user which plan to execute. Check `docs/plans/` for available plans.

## Startup

1. Read the plan file — this is your primary source of truth
2. Read `CLAUDE.md` (already auto-loaded)
3. Do NOT read specs, reference files, or other docs UNLESS the plan explicitly says to
4. Identify which phase to start at (default: phase 1, or use `--phase N` if specified in $ARGUMENTS)

## Implementation Loop

For each task in the current phase:

### Step 1: Write Test First
- Write the failing test as specified in the plan
- If the plan doesn't specify exact test code, write a test that verifies the expected behavior

### Step 2: Verify Test Fails
- Run the test command specified in the plan
- Confirm it fails for the RIGHT reason (missing implementation, not syntax error)
- If it fails for wrong reason, fix the test first

### Step 3: Write Implementation
- Write the minimal code to make the test pass
- Follow existing patterns in the codebase (grep for similar implementations)
- Do NOT over-engineer — build exactly what the plan says

### Step 4: Verify Test Passes
- Run the test again
- If it passes: proceed to Step 5
- If it fails: iterate (fix implementation, re-run)
- **Up to 3 autonomous fix attempts.** After 3 failures, STOP and ask the user for help. Do NOT continue guessing.

### Step 5: Lint and Format
- Run lint/format command from CLAUDE.md
- Fix any lint errors before moving on

### Step 5.5: Cross-Cutting Concerns Gate

**Read `docs/reference/feature-dev-standards.md` at the start of every `/implement` session.** This step is mandatory for every task — not just the final task. Apply each concern as you build, not as an afterthought.

For the code you just wrote, verify and apply each applicable concern from the feature-dev-standards file. If any concern doesn't apply to this specific task, skip it — but you MUST explicitly check.

**After applying concerns:** fix any new test failures introduced, then proceed.

### Step 6: Next Task
- Move to next task in the phase
- After all tasks in a phase: output phase summary

## Phase Boundaries

After completing all tasks in a phase:

1. Run all tests for the affected package(s)
2. Output summary:
   ```
   ## Phase N Complete
   - Files created: [list]
   - Files modified: [list]
   - Tests: N passing, 0 failing
   - Moving to Phase N+1
   ```
3. Continue to next phase

## Completion

After all phases:
1. Run full test suite
2. Output final summary with all files changed
3. Remind: "Run `/validate` to verify full spec compliance, then `/commit-feature` to commit."

## Rules
- NEVER skip writing tests. Every task gets a test.
- NEVER continue after 3 failed fix attempts. Ask the user.
- NEVER read files not referenced in the plan (context pollution).
- NEVER install new dependencies without explicit plan instruction.
- ALWAYS follow existing patterns — grep before inventing.
- Keep progress updates brief — one line per task, not paragraphs.
