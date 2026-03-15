# CPTSD — Mental Health Resource Platform

Multi-service monorepo for CPTSD mental health resources: public blog, CMS, main app, journal, and background worker.

## Tech Stack

| Component | Technology | Location |
|-----------|-----------|----------|
| Main App | Next.js, React 19, TypeScript, Tailwind | `cptsd-main/` (port 3002) |
| Public Blog | Next.js, React 19, TypeScript, Tailwind | `cptsd-blog-public/` (port 3001) |
| CMS | Next.js, TypeScript, AWS S3 | `cptsd-cms/` (port 3000) |
| Journal App | Next.js, TypeScript | `apps/cptsd-journal/` |
| Worker | Node.js | `services/worker/` |
| Shared DB | Mongoose/MongoDB | `packages/db/` |
| Shared Pets | Shared package | `packages/pets/` |
| Shared AI | AI utilities | `packages/ai/` |
| Deployment | Docker, docker-compose | Per-service Dockerfiles |

## Build & Run

```bash
# Any service
cd <service-dir> && pnpm install && pnpm dev

# Production
docker-compose -f <service-dir>/docker-compose.prod.yml up -d --build

# CMS tests
cd cptsd-cms && pnpm test
```

## Context Window Management (MANDATORY)

1. **Compact at 30% remaining** — run `/compact` proactively
2. **Use subagents** for research/exploration to keep main context clean
3. **Don't load what you don't need** — read files only when task requires them
4. **Session boundaries = git commits** — commit and start fresh rather than exhausting context
5. **Never run past 90% context** — output quality degrades

## Bug Fix Policy (MANDATORY)

Every bug fix must include a test that fails before the fix and passes after.

## Development Workflow (AIDD Pipeline)

Spec-first, TDD-based feature development with context resets between planning and implementation.

```
/prime → /specify → /plan → [FRESH SESSION] → /implement → /validate → /commit-feature → /evolve
```

**Reference docs:** `docs/reference/MEMORY.md` (navigation index), `docs/ai-development-workflow.md` (full rules).

Read `docs/reference/MEMORY.md` at session start to know which reference files exist and when to load them.

### AIDD Commands

| Command | Purpose | Input |
|---------|---------|-------|
| `/prime` | Session startup — orient to project state | None or focus area |
| `/specify` | Co-author feature spec with research + Q&A | Feature description |
| `/plan` | Create implementation plan from spec | Spec path |
| `/implement` | Execute plan with TDD | Plan path |
| `/validate` | Verify implementation against spec | Spec path |
| `/commit-feature` | Create structured commits | Feature name (optional) |
| `/evolve` | Update reference files + AI layer | Feature name (optional) |

### Project Commands

| Command | Purpose |
|---------|---------|
| `/build-check` | Run `next build` across all services |
| `/type-check` | Run `tsc --noEmit` on cptsd-main and cptsd-cms |
| `/test` | Run Jest tests (cptsd-cms) |

## AI Artifacts

| Artifact | Type | Domain | Path |
|----------|------|--------|------|
| brownfield-guard | skill | ai-development | `.claude/skills/brownfield-guard/` |
| api-contract-review | skill | coding | `.claude/skills/api-contract-review/` |
| write-e2e-test | skill | coding | `.claude/skills/write-e2e-test/` |
| aidd-pipeline | commands | workflow | `.claude/commands/` (7 commands) |
| context-window-mgmt | pattern | ai-development | Embedded above |
| bug-fix-policy | pattern | ai-development | Embedded above |
