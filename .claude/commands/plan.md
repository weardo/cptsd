---
name: plan
description: Create implementation plan from an approved spec
---

# Create Implementation Plan

Take an approved spec and produce a detailed, task-by-task implementation plan that can be executed in a fresh context session.

**Spec:** $ARGUMENTS (if empty, ask user which spec from `docs/specs/INDEX.md`)

## Phase 1: Analyze Spec

1. Read the spec file
2. Identify all areas of the codebase affected (from section 8 — Dependencies & Ordering)
3. Spin off subagents to explore current state of affected files:
   - What files exist that need modification?
   - What patterns are used in similar features?
   - What test infrastructure exists?

## Phase 2: Create Implementation Plan

Split work into **implementation phases** (each phase = one focused session, max 3-5 files):

### Ordering Rules
Follow dependency order:
1. DB migrations / schema changes
2. Service layer / business logic
3. API endpoints / handlers
4. UI pages / components
5. Tests (written alongside each phase using TDD)

### Per Phase, Specify:
- **Goal**: what this phase achieves
- **Files**: exact paths to create/modify
- **Tasks**: step-by-step with TDD approach:
  1. Write the failing test
  2. Run — verify it fails
  3. Write implementation
  4. Run — verify it passes
  5. Lint/format
- **Validation**: what tests to run, expected outcomes

## Phase 3: Define Validation Strategy

At the end of the plan, include a validation section:

### Per-Phase Validation
- Which test command to run after each phase
- Expected output (N tests passing)

### End-to-End Validation
- How to verify the full feature works
- Cross-feature dependency checks (from spec section 10)

### Regression
- Which existing tests must still pass

## Phase 4: Save Plan

Save to `docs/plans/YYYY-MM-DD-<feature-name>-plan.md`

Include this header:
```
# <Feature Name> Implementation Plan

**Goal:** <one sentence>
**Spec:** docs/specs/<feature>.md
**Phases:** <number of phases>
```

## Phase 5: Present and Remind

Output:
1. Plan summary (phases, estimated scope)
2. **Remind: "After approving this plan, start a FRESH session and run `/implement docs/plans/<plan-file>.md` for clean context. The context reset between planning and implementation is critical for quality."**

## Rules
- Every task MUST include a test step. No exceptions.
- File paths MUST be exact (not "somewhere in the handlers folder").
- Each phase MUST be completable in one session (3-5 files max).
- The plan MUST be self-contained — a fresh session with only the plan should have enough info to execute.
- Do NOT include the full spec content in the plan. Reference it: "See docs/specs/<feature>.md section N."
