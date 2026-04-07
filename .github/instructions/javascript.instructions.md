---
description: Use for JavaScript implementation, review, and refactoring tasks that modify source files, modules, scripts, or build configuration.
applyTo: "**/*.{js,mjs,cjs,jsx}"
---

# JavaScript Coding Standards

## Scope
- Apply to all JavaScript source files: modules, scripts, route handlers, middleware, utility functions, and build config.
- Does not cover TypeScript files (use a separate `typescript.instructions.md`).
- Keep changes task-focused; do not refactor unrelated code in the same PR.

---

## Code Rules

### Naming
- Use `PascalCase` for variables, function names, and module-level constants that are not true immutable values.
- Use `UPPER_SNAKE_CASE` for true module-level constants (e.g., `MAX_RETRY_COUNT = 3`).
- Use `PascalCase` for constructor functions, classes, and React/JSX components.
- Use descriptive names; single-letter variables are only acceptable as loop counters or math variables with a comment.
- Name async functions with a verb describing the action: `fetchUserById`, `saveOrderAsync`.
- Remove dead code and unused variables. If code must remain temporarily, add a `// TODO:` comment with a reason.

### Modules and Imports
- Use ES module syntax (`import`/`export`) for new files; do not mix `require()` and `import` in the same file.
- Remove all unused imports. Do not leave commented-out import blocks.
- Import order: built-ins → third-party packages → internal modules. Separate groups with a blank line.
- Do not use wildcard imports (`import * as foo`) except when consuming a namespace package with no named exports.

### Async and Promises
- Use `async`/`await` for all I/O operations (HTTP calls, database queries, file reads, queue interactions).
- Do not mix `.then()/.catch()` chains with `async`/`await` in the same function.
- Never leave a floating Promise (unhandled). Explicitly `await` or `.catch()` every Promise.
- Do not use `new Promise()` wrappers around functions that already return a Promise.

### Exception Handling
- Use `try`/`catch` only at meaningful boundaries: I/O operations, external integrations, and top-level orchestration functions.
- Do not wrap every helper or utility function in `try`/`catch`; let errors propagate to the boundary handler.
- Never use an empty `catch` block. At minimum, log the error with context before deciding to suppress it.
- Re-throw after logging when the calling layer must also handle the failure:
  ```js
  catch (err) {
    logger.error({ err, orderId, operation: 'createOrder' }, 'Order creation failed');
    throw err;
  }
  ```
- Do not catch `Error` and rethrow a new `Error` without passing the original as `cause`:
  ```js
  // correct
  throw new Error('Payment failed', { cause: err });
  ```
- Handle `async` errors in Express-style frameworks by passing to `next(err)`; do not let them silently resolve.

### Logging
- Use a structured logger (e.g., `pino`, `winston`) with JSON output. Do not use `console.log` in production code paths.
- `console.error` and `console.warn` are acceptable only in CLI scripts and test helpers.
- Every error log must include: operation name, a correlation/request ID (from request context or `AsyncLocalStorage`), and the key input that caused the failure.
- Log at the correct level:
  - `info` – normal flow milestones (request received, task completed)
  - `warn` – expected failures that do not require investigation (not found, rate limited, retryable)
  - `error` – unexpected failures that require investigation
  - `fatal` – process-level failures
- Do not log passwords, tokens, full request/response bodies, or PII.
- Do not log the same error at multiple levels in the same call stack; log once at the boundary.

### Null and Undefined Handling
- Use `=== null` or `=== undefined` explicitly; do not rely on loose `== null` checks unless intentional and commented.
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safe property access and defaults.
- Apply guard clauses at function entry points to reject `null`/`undefined` inputs early:
  ```js
  if (!userId) throw new Error('userId is required');
  ```
- Handle empty arrays and empty strings as distinct cases from `null`/`undefined`; do not conflate them with falsy checks.
- Document and handle edge cases explicitly: empty input, missing config, zero-result queries, timeout, and retry exhaustion.

### Security
- Do not interpolate user input directly into SQL strings, shell commands, HTML, or file paths. Use parameterized queries, sanitization libraries, or `path.resolve` with validation.
- Do not hard-code secrets, API keys, or tokens. Use environment variables accessed via a config module; never read `process.env` directly in business logic.
- Set `Content-Type`, `X-Content-Type-Options`, and other security headers at the framework level; do not rely on defaults.
- Validate and sanitize all external input (request body, query params, headers) before use.

---

## Testing Rules
- Add or update unit tests for all changed functions, modules, and business logic.
- Add or update integration or end-to-end tests when changes touch HTTP handlers, middleware, or external integrations.
- Each changed route handler or integration must have at least one unhappy-path test: invalid input, missing resource, or service error.
- Mock all external I/O (HTTP clients, DB, queues) in unit tests using `jest.mock`, `sinon`, or equivalent.
- Tests must be deterministic: use fixed timestamps, seeded data, and no dependency on live external services.
- Do not use `setTimeout`-based waits in tests; use proper async utilities (`waitFor`, fake timers, or event-driven assertions).

---

## Review Rules

### Blocking (fail the PR)
- `console.log` or `console.error` left in non-CLI, non-test production code paths.
- Empty `catch` block or swallowed exception without a comment.
- Floating (unhandled) Promise — a Promise that is neither `await`ed nor `.catch()`-ed.
- Error caught and rethrown as a new `Error` without `{ cause: originalErr }`.
- Missing structured log with context for failures in I/O or external integration paths.
- User input interpolated directly into SQL, shell commands, or HTML without sanitization.
- Hard-coded secret, API key, or token in source code.
- `null`/`undefined` dereference risk at a known boundary without a guard clause.
- Unhandled edge case that can return incorrect data or crash (empty array assumed non-empty, missing config key used without check).
- Dead code or unused variable without a `// TODO:` justification comment.
- Inconsistent naming that violates the conventions in the Naming section.
- Function completely rewritten instead of extended or composed without a documented reason.
- Missing tests for changed handler or integration behavior.

### Non-Blocking (comment and recommend)
- Log message wording is unclear but the event and context are still identifiable.
- One non-critical logging field missing (e.g., `userId` absent in a low-risk read path).
- `require()` used in an otherwise ES module file for a CommonJS-only package (acceptable with a comment).
- Unused import removed in an unrelated file as part of cleanup (welcome but not required).
- Minor naming inconsistency in a test helper or internal-only utility.

---

## Architecture Patterns
- Structure modules by feature or domain, not by type: `order/orderService.js`, `order/orderRepository.js`, not `services/orderService.js`.
- Keep route handlers thin: validate input, call a service, return the response. Do not embed DB queries or business logic directly in route files.
- Export a single default or named export per module; avoid mixing default and named exports in the same file.
- Avoid mutating function arguments or shared module-level state. Prefer pure functions for business logic.

---

## Policy Matrix (Rule → Enforced By)
| Rule | CI Check | Merge Gate |
|---|---|---|
| No lint errors in changed files | `eslint --max-warnings=0` | Required status check |
| All tests pass | `jest --ci` or `vitest run` | Required status check |
| No `console.log` in production code | ESLint `no-console` rule | Required status check |
| No unused variables or imports | ESLint `no-unused-vars`, `no-unused-expressions` | Required status check |
| Formatting consistent | `prettier --check` | Required status check |
| Dependency vulnerabilities | `npm audit --audit-level=high` | Required status check |
| Sensitive path ownership | `CODEOWNERS` on route files, auth, and config | Required reviewer |

---

## Notes for Copilot Reviews
- These instructions guide review judgment; they do not replace CI enforcement or branch protection.
- CI checks and required status checks are the authoritative enforcement gates.
- Prioritize: unhandled Promises, missing error context in logs, input sanitization gaps, null dereference risks, and missing tests for changed behavior.
- Flag any `console.log` in production paths and any empty or swallowed `catch` blocks as merge blockers.
- Provide concrete fix suggestions: the correct `logger.error(...)` call shape, the missing `{ cause }` on rethrows, or the guard clause that prevents the null dereference.
