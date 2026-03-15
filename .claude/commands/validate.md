---
name: validate
description: Verify implementation against spec — tests, compliance, security
---

# Validate Implementation

Run comprehensive validation after implementation. Checks tests, spec compliance, and security.

**Spec:** $ARGUMENTS (path to spec file, e.g., `docs/specs/feature.md`). If empty, ask user which feature to validate.

## Phase 1: Run Test Suite

Run the full test suite as defined in CLAUDE.md. Record: total tests, passed, failed, any errors.

## Phase 2: Spec Compliance Check

Read the spec file. For each concrete deliverable:

### Section 4 (Data Model / DB Schema)
- Verify tables/columns/schema exist
- Verify naming follows conventions

### Section 5 (API Contract)
- Verify each endpoint exists (grep for route registration)
- Verify request/response structure matches spec
- Verify auth is applied as specified

### Section 7 (UI Changes) — if applicable
- Verify each page/component exists at the specified route
- Verify correct components are used

### Section 10 (Test Plan)
- Check that each specified test exists
- Verify coverage matches the spec's test plan

Mark each item: PASS or FAIL with details.

## Phase 3: Security Scan

Check for common vulnerabilities in changed files:

### Secrets
- Grep for hardcoded credentials, API keys, passwords
- Flag any hardcoded secrets (ignore test fixtures with dummy values)

### Injection
- Check for string concatenation in SQL/shell queries
- Should use parameterized queries or prepared statements

### Auth
- Verify new endpoints have auth/authorization checks
- Check that data scoping is enforced (users can only access their own data)

### Frontend (if applicable)
- Check for unescaped user input in rendering
- Verify no XSS vectors

## Phase 4: Cross-Cutting Concerns Audit

Read `docs/reference/feature-dev-standards.md`. For each changed file, verify all applicable concerns are addressed. Mark each: PASS, FAIL, or N/A (with reason).

## Phase 5: Output Report

```markdown
## Validation Report: <feature name>

### Tests
- **Status**: PASS / FAIL
- [package]: N passed, N failed

### Spec Compliance
- **Status**: N/N items verified
- [ ] Item 1 — PASS/FAIL
- [list each deliverable]

### Security
- **Status**: PASS / WARN
- [list any warnings]

### Cross-Cutting Concerns
- **Status**: N/N verified
- [list each concern with PASS/FAIL/N/A]

### Issues Found
- [ ] Issue 1: description + file:line

### Verdict
READY TO COMMIT / NEEDS FIXES (list what to fix)
```

If verdict is "NEEDS FIXES": list the specific fixes needed.
If verdict is "READY TO COMMIT": remind user to run `/commit-feature`.
