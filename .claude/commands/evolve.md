---
name: evolve
description: Update reference files and evolve the AI layer after implementation
---

# Evolve AI Layer

After implementation and committing, update reference files so the next session has accurate context. This is the compound engineering principle: each unit of work makes the next easier.

**Feature:** $ARGUMENTS (optional — auto-detects from recent commits if not provided)

## Phase 1: Detect What Changed

Check recent commits to categorize changes:

```bash
git log --oneline -5
git show --stat HEAD
```

Categorize into:
- DB schema changes (migrations, table changes)
- API endpoint changes
- UI page/component changes
- External service integration changes
- New patterns or conventions discovered
- Bugs or gotchas encountered

## Phase 2: Update Reference Files

For each category of change detected, update the corresponding file:

| Change | File to Update |
|--------|---------------|
| New/altered DB table | `docs/reference/db-schema.md` |
| New API pattern/endpoint convention | `docs/reference/api-patterns.md` |
| New external service usage | `docs/reference/external-services.md` |
| UI/UX pattern learned | `docs/reference/ui-design-patterns.md` |
| Bug, gotcha, or correction | `docs/reference/session-learnings.md` |
| Test pattern/convention | `docs/reference/testing-strategy.md` |

**How to update:**
- Read the existing reference file
- Add the new information in the appropriate section
- Keep it concise — reference files should be scannable, not exhaustive
- Do NOT remove existing content unless it's now incorrect

## Phase 3: Update Specs Index

Update `docs/specs/INDEX.md`:
- Mark the feature status (Draft -> In Progress -> Complete)
- Add any notes about what was actually built vs. what was specced

## Phase 4: Check CLAUDE.md

Review whether CLAUDE.md needs updates:

- **New architectural pattern discovered?** -> Suggest adding to CLAUDE.md
- **New convention emerged?** -> Suggest adding to CLAUDE.md
- **New build/test command?** -> Suggest adding to CLAUDE.md

**Present suggestions to the user — do NOT auto-modify CLAUDE.md.** These are high-impact files and the user should approve changes.

## Phase 5: AI Layer Improvement Suggestions

Reflect on the implementation session and suggest improvements:

- **Were there hallucinations?** -> Suggest a new reference file or more specific rules
- **Was UI quality poor?** -> Suggest additions to UI design patterns
- **Were tests missing?** -> Suggest additions to testing strategy
- **Did the agent struggle with a pattern?** -> Add it to session-learnings
- **Was the spec missing something?** -> Suggest improvements to spec template

Present as:
```
## AI Layer Improvement Suggestions
- [ ] Suggestion 1: what to add/change and why
- [ ] Suggestion 2: what to add/change and why
```

## Phase 6: Summary

Output what was updated:
```
## Evolution Summary
### Reference Files Updated
- docs/reference/db-schema.md — added example table
- docs/reference/session-learnings.md — noted gotcha about X

### Specs Index
- example.md: In Progress -> Complete

### CLAUDE.md Suggestions (pending user approval)
- Add X to key conventions

### AI Layer Suggestions (pending user decision)
- [ ] Add Y to testing-strategy.md
```

## Rules
- ALWAYS update at least `session-learnings.md` with anything noteworthy from the session
- NEVER auto-modify CLAUDE.md — present suggestions only
- NEVER skip this step — it's mandatory per the Post-Implementation Mandate
- Keep reference file updates concise and scannable
