# Contributing to Argent

Thank you for your interest in contributing to Argent! This guide will help you get set up and explain our development workflow.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Conventions](#code-conventions)
- [Testing](#testing)
- [Internationalization](#internationalization)
- [Pull Request Process](#pull-request-process)
- [CI / GitHub Actions](#ci--github-actions)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm 10+
- Git

### Setup

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/argent.git
cd argent
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials (optional for most work)

# Start dev server
npm run dev
```

> **Tip:** Most features work fully offline without Supabase. You only need Supabase credentials for auth/sync features and E2E tests.

### Useful Commands

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run typecheck    # TypeScript strict check
npm run lint         # ESLint
npm test             # Unit tests (Vitest)
npm test -- path/to/file.test.ts   # Single test file
npm run test:e2e     # E2E tests (Playwright)
```

## Development Workflow

We follow a branch-and-PR workflow. All changes go through pull requests -- no direct commits to `main`.

### 1. Find or Create an Issue

Every PR must be linked to a GitHub issue. Before starting work:

- Check [existing issues](https://github.com/Zenemig/argent/issues) for something you'd like to work on.
- If none exists, [create one](https://github.com/Zenemig/argent/issues/new/choose) describing the bug or feature.
- Comment on the issue to let others know you're working on it.

### 2. Create a Branch

```bash
git checkout main
git pull origin main
git checkout -b <type>/<short-description>
```

**Branch naming convention:**

| Prefix | Use |
|--------|-----|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code restructuring (no behavior change) |
| `docs/` | Documentation only |
| `test/` | Adding or updating tests |
| `chore/` | Dependencies, CI, tooling |

### 3. Develop with TDD

We follow strict **Red-Green-Refactor**:

1. **Red** -- Write a failing test for the expected behavior.
2. **Green** -- Write the minimum code to make it pass.
3. **Refactor** -- Clean up while keeping tests green.

```bash
# Run only your test file during development
npm test -- path/to/your-file.test.ts

# Run full suite before committing
npm test
```

### 4. Commit

Use conventional-style commit messages:

```
feat: add GPS tagging to shot logger
fix: prevent duplicate frame numbers on rapid tap
refactor: extract roll status machine into hook
docs: update self-hosting guide
test: add E2E tests for export flow
chore: bump Next.js to 16.2
```

### 5. Push and Open a PR

```bash
git push -u origin <type>/<short-description>
```

Then open a PR on GitHub against `main`. The [PR template](.github/PULL_REQUEST_TEMPLATE.md) will guide you.

## Code Conventions

- **Server Components by default.** Only add `'use client'` at the lowest leaf that needs it.
- **Zod schemas** in `lib/schemas.ts` are the single source of truth. Derive types with `z.infer<>`.
- **ULIDs** for all entity IDs (client-generated, time-sortable).
- **Soft deletes** everywhere (`deleted_at` timestamp).
- **No barrel files** (`index.ts` re-exports). Import directly from source modules.
- **Dynamic imports** for heavy modules (exporters, JSZip, image compression).
- **`cn()`** from `lib/utils` for conditional Tailwind classes.
- **shadcn/ui first** -- prefer existing primitives before building custom components.
- **Mobile-first design.** Bottom-anchored controls for thumb reachability.

### File Organization

- Components: `components/<component-name>.tsx`
- Tests: co-located as `components/<component-name>.test.tsx`
- Hooks: `hooks/use-<name>.ts`
- Utilities: `lib/<module>.ts`

## Testing

### Unit Tests (Vitest)

- Framework: Vitest + jsdom + @testing-library/react
- Co-located with source files (`foo.tsx` -> `foo.test.tsx`)
- One assertion per concern
- No snapshot tests for components

### E2E Tests (Playwright)

- Located in `tests/e2e/`
- Require Supabase credentials in `.env.local`

### Running Tests

```bash
npm test                              # All unit tests
npm test -- path/to/file.test.ts      # Single file
npm run test:e2e                      # E2E tests
npm run test:e2e -- --headed          # E2E with visible browser
```

## Internationalization

All user-facing strings must go through `next-intl`:

```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('MyComponent');
  return <p>{t('greeting')}</p>;
}
```

- Translation files: `messages/en.json` and `messages/es.json`
- Add keys to **both** files when adding new strings.
- Never hardcode English strings in components.

## Pull Request Process

1. **All CI checks must pass** -- typecheck, lint, unit tests, E2E tests.
2. **Reference the related issue** -- use `Closes #123` or `Fixes #123` in the PR description.
3. **One concern per PR** -- keep PRs focused. Separate refactors from features.
4. **The maintainer merges** -- PRs are reviewed and merged by [@Zenemig](https://github.com/Zenemig).
5. **Squash merge** -- we squash-merge to keep `main` history clean.

## CI / GitHub Actions

Our CI pipeline runs automatically on every PR:

- **Typecheck** (`tsc --noEmit`)
- **Lint** (ESLint)
- **Unit tests** (Vitest)
- **E2E tests** (Playwright)

All checks must pass before a PR can be merged.

### Running CI Locally

You can replicate CI locally before pushing:

```bash
npm run typecheck && npm run lint && npm test && npm run test:e2e
```

---

Thank you for helping make Argent better for the analogue photography community!
