---
name: build-check
description: Run build across all services to catch type and compilation errors
---

# Build Check

Run `next build` across all services to verify there are no type or build errors.

## Steps

1. Run builds for each service (report results, don't stop on first failure):

```bash
cd cptsd-main && pnpm build
cd cptsd-blog-public && pnpm build
cd cptsd-cms && pnpm build
```

2. Report results as a table:

| Service | Status | Errors |
|---------|--------|--------|
| cptsd-main | PASS/FAIL | error summary if any |
| cptsd-blog-public | PASS/FAIL | error summary if any |
| cptsd-cms | PASS/FAIL | error summary if any |

3. If any service failed, list the specific errors and suggest fixes.
