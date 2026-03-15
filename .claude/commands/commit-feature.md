---
name: commit-feature
description: Create structured commits for a feature
---

# Structured Feature Commit

Create standardized commits for a completed feature. These commits serve as long-term memory for future `/prime` sessions.

**Feature:** $ARGUMENTS (optional feature name — auto-detects from recent work if not provided)

## Phase 1: Gather Changes

Check what's uncommitted:

```bash
git status
git diff --stat
```

## Phase 2: Create Commit

Create a commit with this structure:

```
<type>(<feature-name>): <short description of what changed>

Spec: docs/specs/<feature>.md
Changes:
- <bullet per meaningful change>
- <bullet per meaningful change>

Session: YYYY-MM-DD
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Type selection:**
- `feat` — new functionality
- `fix` — bug fix
- `test` — adding/updating tests only
- `refactor` — restructuring without behavior change
- `chore` — config, deps, tooling
- `docs` — documentation, specs, plans

**Rules:**
- Stage specific files (`git add <file1> <file2>`) — never `git add -A`
- Do NOT stage `.env` files, credentials, or large binaries
- The short description should say WHAT, the bullets should say specifics

## Phase 3: Docs Commit (if applicable)

If any of these changed, include in commit (or create a separate docs commit):
- `docs/specs/*.md` — spec created or status updated
- `docs/plans/*.md` — plan created
- `docs/reference/*.md` — reference files updated by /evolve
- `CLAUDE.md` — workflow or conventions updated

Use prefix: `docs(<feature-name>): <what changed>`

## Phase 4: Summary

Output:
```
## Commit Created
- Type: feat
- Message: feat(example): add example feature
- Files staged: [list]
```

Remind: "Run `/evolve` to update reference files with any new patterns discovered during implementation."

## Rules
- NEVER use `git add -A` or `git add .`
- NEVER commit .env files or credentials
- NEVER push to remote — only local commits. User decides when to push.
- ALWAYS include the Co-Authored-By line
- ALWAYS use the structured commit format
