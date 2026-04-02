# Cross-Cutting Feature Development Standards

Apply these concerns to every feature implementation. Check each one — skip only if genuinely not applicable.

---

## 1. Observability

- **Structured logging**: Use the project's logging pattern (check CLAUDE.md). Log at entry, exit, and error points. Never log secrets, tokens, or PII.
- **Health checks**: If adding a new external dependency (database, API, queue), add a health check endpoint or startup verification.
- **Error context**: Every logged error must include enough context to diagnose without reproducing (request ID, user context, input that caused it).

## 2. Error Handling & Resilience

- **Typed errors**: Use the project's error type pattern. Never `catch(e) {}` — always handle or rethrow with context.
- **Input validation**: Validate at system boundaries (API endpoints, CLI arguments, file reads). Use schema validation (Zod, joi, struct tags) where the project supports it.
- **Graceful degradation**: External service failures should degrade gracefully, not crash. Use timeouts, retries with backoff, and circuit breakers for external calls.

## 3. Testing

- **TDD-first**: Write the failing test before the implementation.
- **Coverage**: Every task needs tests covering: happy path, error/edge case, and boundary conditions.
- **No mocking internals**: Mock external dependencies (APIs, databases), not internal functions. Tests should verify behavior, not implementation.
- **Regression**: Run the full test suite after each task. Fix any regressions before proceeding.
