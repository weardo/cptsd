---
name: specify
description: Co-author a feature spec with research and clarifying questions
---

# Co-Author Feature Spec

Create a complete feature spec by researching the codebase, asking clarifying questions, and filling the 11-section template. The goal is to reduce assumptions to near zero before any code is written.

**Feature:** $ARGUMENTS (if empty, ask the user what feature to specify)

## Phase 1: Research (Subagents)

Spin off these subagents in parallel:

### Subagent 1: Codebase Exploration
- What files and patterns are relevant to this feature?
- Are there similar features already implemented? (grep for related functions, routes, components)
- What existing patterns should this feature follow?
- What DB tables, APIs, or state does this touch?

### Subagent 2: Reference Files
- Read `docs/reference/db-schema.md` — existing tables and conventions
- Read `docs/reference/api-patterns.md` — existing API conventions
- Read any other relevant reference files based on the feature area

### Subagent 3: Web Research (if applicable)
- Only if the feature involves external integrations or unfamiliar technology
- Research best practices, API docs, common pitfalls

## Phase 2: Clarifying Questions

Based on research findings, ask the user questions to eliminate assumptions:

- Use the AskUserQuestion tool with multiple choice options (2-4 options per question)
- Ask ONE question at a time
- Aim for 10-20 questions covering:
  - Scope boundaries (what's in, what's out)
  - Data model decisions (what to store, where)
  - API design choices (endpoints, auth, pagination)
  - UI layout preferences (if applicable)
  - Edge cases (what happens when X fails, what if Y is empty)
  - Testing priorities (what's critical to verify)
- Stop asking when you're confident you understand the full scope

## Phase 3: Write Spec

Read `docs/specs/TEMPLATE.md` for the exact section structure.

Fill ALL sections:

### Section 1 (Goal) + 2 (Background)
- Synthesize from user's initial description + Q&A answers

### Section 3 (Architecture)
- Data flow diagram (ASCII)
- Key interfaces or types
- How this fits with existing architecture

### Section 4 (Data Model / DB Schema)
- Read `docs/reference/db-schema.md` for naming conventions
- Exact schema/DDL for all storage changes

### Section 5 (API Contract)
- Full endpoint table with method, path, auth, description
- Complete request/response JSON examples including error cases

### Section 6 (Business Logic)
- Business rules, edge cases, auth/scoping

### Section 7 (UI Changes) — only if applicable
- Specific pages, routes, components
- Reference existing component patterns
- ASCII wireframe or description of key screens

### Section 8 (Dependencies & Ordering)
- Implementation sequence (DB -> API -> UI -> tests)

### Section 9 (Migration Plan)
- Data migration, backward compatibility, feature flags

### Section 10 (Test Plan)
- Unit, integration, E2E scenarios

### Section 11 (Out of Scope)
- Confirm with user if needed

## Phase 4: Save and Present

1. Save spec to `docs/specs/<feature-name>.md`
2. Update `docs/specs/INDEX.md` — add new row with status "Draft"
3. Output the complete spec for human review
4. Ask: "Review each section. I'll revise anything that doesn't match your intent. Once approved, run `/plan docs/specs/<feature-name>.md`."

## Rules
- NEVER skip the clarifying questions phase. This is the most valuable step.
- NEVER guess database naming — follow existing conventions from db-schema.md.
- NEVER write generic UI descriptions — reference specific existing components.
- If the feature is too large for one spec, suggest splitting and explain the split.
