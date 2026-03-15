---
name: brownfield-guard
description: Forces pattern discovery before implementation in existing codebase
activation: always
---

# Brownfield Guard

**Rule: Never invent — always discover first.**

Before writing ANY implementation code, you MUST:

1. **Grep for similar implementations** in the codebase
2. **Read at least one complete example** end-to-end
3. **Match the existing pattern exactly** — structure, naming, error handling, logging

## Discovery Checklist

Before implementing:
- [ ] Grep for similar function/class/module names
- [ ] Read the most recent similar implementation (not the oldest)
- [ ] Identify the pattern: file structure, imports, error handling, logging, return types
- [ ] Note any deviations from what you'd expect (these are intentional conventions)

## Common Pattern Violations

### Frontend (Next.js / React / Tailwind)
| You might do | Codebase actually does |
|-------------|----------------------|
| Custom card/modal/button | Component library or existing shared components |
| `useState` + `useEffect` for data | Data fetching pattern used in existing pages |
| Manual form state | Form handling pattern from existing forms |
| Inline styles or arbitrary CSS | Tailwind classes following existing conventions |
| `fetch()` in component | API client from shared lib or Next.js patterns |

### API Routes (Next.js API / Mongoose)
| You might do | Codebase actually does |
|-------------|----------------------|
| Raw route handler | Existing middleware/wrapper pattern |
| `new Model()` directly | Existing model creation pattern |
| Generic error responses | Project-specific error format |
| No auth checks | Auth middleware pattern from other routes |

## When This Skill Activates

This skill is ALWAYS active. Every time you write new code, the brownfield guard applies. The only exception is when creating the very first implementation of a pattern (greenfield / Phase 1 of the project).

## Anti-Pattern Detection

If you find yourself doing any of these, STOP:
- Creating a new utility function without checking if one exists
- Importing a library that isn't in the project's dependency file
- Writing a custom error handler instead of using the existing pattern
- Creating a new component that looks similar to an existing one
- Writing queries without checking how other queries are structured
