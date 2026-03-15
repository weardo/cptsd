---
name: write-e2e-test
description: Write proper e2e tests that actually test behavior — no bypasses, no fallbacks, no adjusting assertions to match wrong output. Use for integration and e2e testing.
disable-model-invocation: true
---

# Write E2E Test

Write a proper end-to-end test that ACTUALLY verifies behavior. Argument: `$ARGUMENTS`

## HARD RULES — violations invalidate the test

1. **NEVER adjust assertions to match wrong output** — if the test fails, the CODE is wrong, not the assertion
2. **NEVER add fallback logic** like `if err != nil { skip("not available") }` — that hides bugs
3. **NEVER use sleep for synchronization** — use poll loops with deadlines
4. **NEVER bypass auth or permission checks** — test through the real auth middleware
5. **NEVER mock what you can test for real** — e2e means end-to-end
6. **NEVER weaken a test to make it pass** — fix the code instead

## Step 1: Identify what to test

Define the EXACT behavior being verified:
- What API call(s) or user action(s) are performed?
- What is the expected response or outcome?
- What side effects should occur? (DB state, cache, events, emails, etc.)

## Step 2: Write the test

- Follow the project's existing test structure and conventions
- Use real HTTP calls to running services (not mocked)
- Use shared state from previous test steps (auth tokens, IDs, etc.)

## Step 3: Assert EVERYTHING

```
# GOOD: Assert specific values
assert status_code == 200
assert response.data.field == "expected_value"
assert len(response.data.items) == 3

# BAD: Vague assertions that pass on wrong data
assert response is not None          # useless
assert status_code < 500             # too permissive
```

## Step 4: Poll, don't sleep

For async operations (message queues, background jobs, eventual consistency):

```
# Pattern: poll with deadline
deadline = now() + 30_seconds
while now() < deadline:
    result = check_condition()
    if result.ready:
        break
    sleep(500_milliseconds)
assert result.ready, "condition not met within deadline"
```

## Step 5: Verify side effects

- **DB state**: query the database directly to verify records created/updated
- **Events**: check event stores or message queues for expected events
- **Emails/notifications**: check test mail server API for sent messages
- **Cache**: verify cache state if relevant

## Step 6: Run and verify

Run the test. It must PASS on the first run without any manual intervention.

If the test fails: **fix the code, not the test.**
