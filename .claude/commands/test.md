---
name: test
description: Run tests across the project
---

# Run Tests

Run the test suite. Argument: `$ARGUMENTS` (optional — specific service or test file path)

## Steps

1. If `$ARGUMENTS` specifies a service or file, run only those tests.
2. Otherwise, run all available test suites:

```bash
cd cptsd-cms && pnpm test
```

3. Report results:

| Service | Tests | Passed | Failed |
|---------|-------|--------|--------|
| cptsd-cms | N | N | N |

4. If any tests failed, show the failure output and suggest fixes.
