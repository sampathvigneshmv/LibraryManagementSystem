---
description: Use for HTML implementation, review, and refactoring tasks that modify page structure, semantic markup, templates, or embedded scripts and styles.
applyTo: "**/*.{html,htm}"
---

# HTML Coding Standards

## Scope
- Apply to all HTML files and server-rendered or static templates that produce HTML output.
- Covers document structure, semantic markup, accessibility, forms, embedded resources, and security.
- Does not cover CSS or JavaScript in standalone files (use separate standards for those).

---

## Code Rules

### Document Structure
- Every HTML file must begin with `<!DOCTYPE html>`.
- Include a `<meta charset="UTF-8">` and `<meta name="viewport" content="width=device-width, initial-scale=1">` in every `<head>`.
- Set a meaningful, unique `<title>` per page; do not leave it empty or as a placeholder.
- Use lowercase element names and attribute names.
- Quote all attribute values using double quotes (`"value"`, not `'value'`).
- Do not leave unclosed tags or mismatched nesting. Every opened tag must be explicitly closed or self-closed (void elements excepted).

### Naming
- Use `kebab-case` for `id` and `class` attribute values: `user-profile`, `submit-btn`.
- `id` values must be unique within a page; do not reuse an `id` as a selector target in multiple elements.
- Use descriptive, intent-based names for `id` and `class`: `order-summary-table`, not `div2` or `container3`.
- Remove unused `id` and `class` attributes. If stubs must remain, add an HTML comment with a reason.

### Semantic Markup
- Use semantic elements before generic `<div>` or `<span>` wrappers:
  - `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>` for page regions
  - `<h1>`–`<h6>` for heading hierarchy; use one `<h1>` per page
  - `<ul>` / `<ol>` for lists, `<table>` for tabular data, `<figure>` / `<figcaption>` for media with captions
  - `<button>` for triggers, `<a href>` for navigation; do not use `<div>` or `<span>` as clickable controls
- Keep heading order logical and sequential (`h1` → `h2` → `h3`); do not skip levels for visual sizing.
- Do not use `<br>` for layout spacing; use CSS margin/padding.
- Do not use `<table>` for layout purposes.

### Accessibility
- Every `<img>` must have an `alt` attribute: meaningful text for informational images, empty `alt=""` for decorative ones.
- Every form control (`<input>`, `<select>`, `<textarea>`) must have an associated `<label>` using `for`/`id` pairing or wrapping.
- Every `<button>` and `<a>` must have descriptive text or an `aria-label`; do not use "click here", "read more", or icon-only buttons without a label.
- Interactive elements must be reachable and operable via keyboard (native controls satisfy this by default; custom controls must explicitly manage `tabindex`, `role`, and keyboard events).
- Add ARIA attributes (`role`, `aria-*`) only when native HTML semantics are insufficient. Do not add redundant ARIA that duplicates native semantics (e.g., `role="button"` on a `<button>`).
- Ensure sufficient color contrast is not undermined by inline styles that override theme defaults.

### Forms
- Use `type` on all `<input>` elements (`type="email"`, `type="number"`, `type="password"`, etc.) to enable native browser validation and mobile keyboards.
- Group related fields with `<fieldset>` and `<legend>`.
- Mark required fields with the `required` attribute and communicate requirements visibly, not only through color.
- Set `autocomplete` attributes on personal-data fields (`name`, `email`, `current-password`) to assist users and password managers.

### Embedded Resources and Security
- Load CSS via `<link rel="stylesheet">` in `<head>`. Do not use `<style>` blocks or `style=""` attributes except in documented, template-layer overrides (e.g., email templates).
- Load scripts with `<script src>` near `</body>`, or in `<head>` with `defer` or `async`. Do not write business logic in inline `<script>` blocks.
- Never interpolate unescaped user-supplied data into HTML. All dynamic values rendered into HTML must be HTML-entity-escaped at the template layer.
- Do not embed API keys, tokens, passwords, or internal URLs in HTML source. Use server-side rendering or environment-injected config endpoints.
- Apply `rel="noopener noreferrer"` on all `<a target="_blank">` links.
- Use relative paths or CDN-pinned hashes for external resource URLs; do not reference unpinned external CDN scripts in production.

### Dead Code and Cleanliness
- Remove commented-out HTML blocks. If markup is temporarily disabled, add a comment with a reason and a `TODO:` reference.
- Remove empty elements that serve no structural or semantic purpose (e.g., `<div></div>`, `<p></p>`).
- Keep nesting depth shallow; deeply nested `<div>` trees (> 6 levels) are a signal to refactor markup or extract a component.

---

## Testing Rules
- Validate changed HTML files against the W3C spec using `html-validate` or an equivalent linter in CI.
- Run automated accessibility checks (`axe-core`, `pa11y`, or equivalent) on changed templates; all critical and serious violations must be resolved before merge.
- Add or update snapshot or visual regression tests when structural markup changes affect rendered output consumed by tests.
- Test all form flows (submit, validation error, success) in at least one browser integration test.

---

## Review Rules

### Blocking (fail the PR)
- Missing `alt` attribute on any `<img>` (including `alt=""` for decorative images — omission is a violation).
- Form control with no associated `<label>` or `aria-label`.
- `<div>` or `<span>` used as a clickable interactive control without `role`, `tabindex`, and keyboard event handling.
- Heading levels skipped or used purely for visual sizing (e.g., jumping from `<h1>` to `<h4>`).
- Unescaped user-supplied data interpolated directly into an HTML attribute or element body.
- Hard-coded secret, API key, token, or internal URL in HTML source.
- Missing `rel="noopener noreferrer"` on a `<a target="_blank">` link.
- Inline `<script>` block containing business logic that should live in an external module.
- `<table>` used for layout (not tabular data).
- Broken or unclosed tag nesting that renders incorrectly.
- Dead commented-out HTML block without a `TODO:` comment explaining why it remains.
- Missing `<!DOCTYPE html>` or `<meta charset>` on a new page template.
- Inconsistent `id`/`class` naming that violates the kebab-case convention.

### Non-Blocking (comment and recommend)
- `<div>` used where a more specific semantic element (`<section>`, `<article>`) would be clearer, but no functional regression results.
- ARIA attribute present but redundant with native semantics (e.g., `role="list"` on a `<ul>`).
- Heading text or `alt` text that is technically present but poorly descriptive (e.g., `alt="image"`).
- Inline `style=""` used for a minor one-off override in a template where adding a class is disproportionate effort.
- Script loaded in `<head>` without `defer`/`async` when page load performance is not a stated concern for that template.

---

## Policy Matrix (Rule → Enforced By)
| Rule | CI Check | Merge Gate |
|---|---|---|
| HTML validity | `html-validate` or `vnu` (W3C Nu Checker) | Required status check |
| Accessibility baseline | `axe-core` / `pa11y-ci` automated scan | Required status check |
| No formatting drift | `prettier --check "**/*.html"` | Required status check |
| No inline scripts with logic | ESLint `no-inline-script` rule or custom lint step | Required status check |
| Template injection safety | Security-focused template linter or SAST scan | Required status check |
| Sensitive path ownership | `CODEOWNERS` on layout and auth-related templates | Required reviewer |

---

## Notes for Copilot Reviews
- These instructions guide review judgment; they do not replace CI enforcement or branch protection.
- CI checks and required status checks are the authoritative enforcement gates.
- Prioritize: missing `alt` text, form label gaps, unsafe interpolation of dynamic content, missing `rel="noopener"`, and broken heading hierarchy.
- Flag any unescaped dynamic content in HTML as a merge blocker; even in internal tools, this is an XSS risk.
- Provide concrete fix suggestions: the correct semantic element, the missing `alt` value, or the `<label for>` wiring.
