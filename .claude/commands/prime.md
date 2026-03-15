---
name: prime
description: Session startup — orient to project state and identify next work
---

# Session Startup

Orient yourself at the start of every session. Do NOT start any implementation.

## Phase 1: Load Context

Read these files (do NOT skip any):
1. `docs/reference/MEMORY.md` — navigation index for all reference files
2. `docs/ai-development-workflow.md` — session lifecycle and rules
3. `docs/reference/session-learnings.md` — past corrections and gotchas
4. `docs/specs/INDEX.md` — feature specs and their statuses

## Phase 2: Check Recent Activity

Run:
```bash
git log --oneline -15
git status
```

## Phase 3: Output Report

Present a structured report:

### Project State
- Summary of recent changes (from git log)
- Any uncommitted work in progress

### Specs Status
- Table from INDEX.md showing all features and their statuses
- Highlight any specs marked "In Progress" or "Draft"

### Recommended Next Work
- Based on: specs index, git history, any user-provided `$ARGUMENTS`
- If user provided `$ARGUMENTS`, focus recommendations on that area

### Context Files to Load
- Based on recommended work, list which `docs/reference/` files are relevant
- Do NOT load them yet — just list them so the user can decide

## Rules
- Do NOT start any implementation. This is orientation only.
- Do NOT read reference files beyond MEMORY.md and session-learnings.md unless asked.
- Keep the report concise — tables, not paragraphs.
- If continuing a feature, remind: "Run `/implement <plan-path>` for clean context."
