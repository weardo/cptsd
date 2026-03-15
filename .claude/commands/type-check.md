---
name: type-check
description: Run TypeScript type checking across services that support it
---

# Type Check

Run `tsc --noEmit` on services with type-check scripts.

## Steps

1. Run type checks:

```bash
cd cptsd-main && pnpm type-check
cd cptsd-cms && pnpm type-check
```

2. Report results as a table:

| Service | Status | Errors |
|---------|--------|--------|
| cptsd-main | PASS/FAIL | error count |
| cptsd-cms | PASS/FAIL | error count |

3. If errors found, group by file and list each error with file:line.
