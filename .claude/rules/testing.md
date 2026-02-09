---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "e2e/**"
  - "vitest.config.*"
  - "playwright.config.*"
---

# Testing Rules

## Vitest (Unit Tests)

- Colocate test files with source: `component.test.tsx` next to `component.tsx`.
- Use `describe` / `it` blocks. Name tests as behavior: "should create a camera with valid data".
- Mock Dexie with `fake-indexeddb`. Mock Supabase client with `vi.mock()`.
- Use `.safeParse()` in tests to verify both valid and invalid Zod schema inputs.
- Prefer running single test files: `pnpm test path/to/file.test.ts`.

## Playwright (E2E Tests)

- E2E tests live in `e2e/` directory at project root.
- Use role-based locators: `getByRole`, `getByLabel`, `getByText`. Never CSS selectors.
- Use auto-retrying assertions: `expect(locator).toBeVisible()`. Never manual timeouts or `waitForTimeout`.
- Test on mobile viewports (iPhone 14: 390x844, Pixel 7: 412x915).
- Test on both Chromium and WebKit (Safari).

## What to Test

Every ticket requires:
- Unit tests for data logic (CRUD operations, validation, calculations)
- E2E tests for user-facing flows (load roll, log frame, export)

Critical E2E paths:
1. Full roll lifecycle: camera -> roll -> frames -> finish -> develop -> scan -> archive -> export
2. Offline: log frames offline -> come online -> verify sync
3. Auth: signup -> signin -> sync -> signout -> signin -> data appears
4. i18n: switch language -> verify UI updates -> core flows work
