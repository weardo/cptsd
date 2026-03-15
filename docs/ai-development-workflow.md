# AI Development Workflow

## Session Lifecycle

```
/prime → /specify → /plan → [FRESH SESSION] → /implement → /validate → /commit-feature → /evolve
```

The context reset between planning and implementation is critical — it ensures the agent starts execution with clean context and only the plan as input.

## Rules

1. **Spec before code** — eliminates ambiguity
2. **TDD** — tests catch AI's subtle bugs
3. **Constrained scope** — 3-5 files per session prevents overload
4. **Fast feedback** — <30s test/lint cycles
5. **Context hygiene** — session boundaries = git commits
6. **Compound engineering** — each session updates reference files for the next

## Anti-Slop Guardrails

- Never add comments explaining obvious code
- Never add docstrings to internal functions unless the logic is non-obvious
- Never refactor code you weren't asked to change
- Never add error handling for impossible states
- Never create abstractions for one-time operations
- Never add type annotations to code you didn't write
