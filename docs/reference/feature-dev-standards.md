# Feature Development Standards

Cross-cutting concerns checklist. Apply these during every `/implement` task — not as an afterthought.

## Error Handling
- [ ] API routes return appropriate HTTP status codes (400, 401, 403, 404, 500)
- [ ] User-facing errors are clear and actionable
- [ ] Errors are logged with context (not swallowed silently)

## Input Validation
- [ ] All user input is validated before processing
- [ ] String inputs have length limits
- [ ] Pagination has sensible defaults and max limits

## Security
- [ ] No hardcoded secrets or credentials
- [ ] API routes have appropriate auth checks
- [ ] Database queries scope data to the authenticated user/context
- [ ] User input is escaped/sanitized in rendered output

## Testing
- [ ] New functionality has corresponding tests
- [ ] Bug fixes include a regression test
- [ ] Tests assert specific values, not just "not null"

## Accessibility (UI)
- [ ] Interactive elements are keyboard accessible
- [ ] Images have alt text
- [ ] Form inputs have labels

## Performance
- [ ] Database queries are indexed for common access patterns
- [ ] Large lists are paginated
- [ ] Images/assets are appropriately sized
