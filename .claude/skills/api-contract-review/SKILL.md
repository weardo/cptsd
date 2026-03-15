---
name: api-contract-review
description: API contract review — enforces auth, data scoping, error format, input validation, and API documentation sync. Use when creating or modifying API endpoints.
---

# API Contract Review

You are creating or modifying API endpoints. Every endpoint must meet these standards.

## Checklist — Verify for EVERY endpoint

### Authentication & Authorization
- [ ] Endpoint has auth middleware (API key, JWT, session, or project-specific auth)
- [ ] If admin endpoint: requires admin/elevated role
- [ ] If resource-scoped: extracts and validates scope identifier from context (e.g., tenant ID, org ID, store ID)

### Data Scoping (Multi-Tenancy)
- [ ] ALL database queries filter by the appropriate scope (tenant/org/user)
- [ ] A user from scope A can NEVER see or modify scope B's data
- [ ] List endpoints don't leak records from other scopes

### Error Response Format
- 400: validation errors (include which fields failed)
- 401: missing or invalid auth
- 403: authenticated but not authorized
- 404: resource not found (don't leak existence info for other scopes)
- 429: rate limited
- 500: internal error (don't expose internals)

### Input Validation
- [ ] All inputs validated (use framework validation: struct tags, schema validators, etc.)
- [ ] Pagination params have sensible defaults and max limits
- [ ] String inputs have max length constraints
- [ ] File uploads have size and type limits (if applicable)

### API Documentation
- [ ] Endpoint has API documentation annotations (OpenAPI/Swagger, etc.)
- [ ] Documentation is regenerated after changes
- [ ] If public endpoint: public API spec is updated too

### BEFORE marking an API endpoint complete:
1. Run handler/endpoint tests
2. Verify API documentation is updated
3. Check that any generated client types are in sync
