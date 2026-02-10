# Argent

Offline-first PWA for analogue photographers. Log shots, manage gear/film inventory, generate XMP sidecar files and ExifTool scripts for embedding metadata into scans. Cross-platform, works fully offline.

**Stack:** Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, shadcn/ui (New York, zinc, dark default), Dexie.js (IndexedDB), Supabase (PostgreSQL + Auth + Storage), Serwist (PWA), next-intl (en + es), Zod 4, Vitest, Playwright. Deployed on Vercel. Licensed AGPL-3.0.

## Commands

- `npm run dev` -- Dev server (Turbopack)
- `npm run build` -- Production build (must pass before PR)
- `npm run lint` -- ESLint
- `npm run typecheck` -- `tsc --noEmit` strict mode
- `npm test` -- Vitest unit tests
- `npm test -- path/to/file.test.ts` -- Single test file (preferred over full suite)
- `npm run test:e2e` -- Playwright E2E tests
- `npm run test:e2e -- --headed` -- Playwright with visible browser

## Architecture

```
app/[locale]/(marketing)/          -- Landing page, pricing (locale prefix: as-needed for SEO)
app/[locale]/(marketing)/pricing/  -- /pricing (en), /es/pricing (es)
app/(app)/                         -- Dashboard (no locale prefix, clean URLs)
app/(app)/gear/                    -- Gear bag: /gear
app/(app)/roll/[id]/               -- Roll detail: /roll/abc123
app/(app)/settings/                -- Settings: /settings
app/(app)/stats/                   -- Statistics: /stats
app/(auth)/login/                  -- Auth: /login
components/ui/                     -- shadcn/ui (generated, do not hand-edit)
components/                        -- Domain components (shot-logger, roll-card, etc.)
components/marketing/              -- Landing page sections
lib/db.ts                          -- Dexie.js database (ArgentDb class)
lib/seed.ts                        -- Film stock seed data (80+ stocks)
lib/types.ts                       -- Entity interfaces
lib/schemas.ts                     -- Zod schemas (single source of truth for data shapes)
lib/constants.ts                   -- Enums: FILM_FORMATS, ROLL_STATUSES, SHUTTER_SPEEDS, etc.
lib/utils.ts                       -- cn() helper
lib/supabase/client.ts             -- Browser Supabase client (createBrowserClient)
lib/supabase/server.ts             -- Server Supabase client (createServerClient)
lib/exporters/                     -- XMP, CSV, ExifTool script, JSON exporters
hooks/                             -- useSync, useUserTier, custom hooks
messages/en.json, messages/es.json -- i18n translations
supabase/migrations/               -- SQL migrations (timestamped, never modify existing)
```

### i18n Routing (Hybrid)

- **(marketing)** routes use `[locale]` segment with `localePrefix: 'as-needed'` — English at `/`, `/pricing`; Spanish at `/es`, `/es/pricing`. Enables `hreflang` tags for SEO.
- **(app)** and **(auth)** routes have no locale prefix — clean URLs like `/gear`, `/roll/abc123`, `/login`. Locale detected from cookie (`NEXT_LOCALE`) or browser `Accept-Language` header.
- Proxy (`proxy.ts`) handles routing: rewrites marketing routes with locale prefix, passes app routes through with locale from cookie.

## Code Conventions

- Server Components by default. `'use client'` only at the lowest leaf boundary that needs it.
- All entity IDs are ULIDs (client-generated via `ulid` package, time-sortable).
- Soft deletes everywhere: `deleted_at` timestamp, `null` = active.
- Zod schemas in `lib/schemas.ts` are the single source of truth. Derive types with `z.infer<typeof schema>`.
- All user-facing strings go through next-intl `t()` function. Zero hardcoded English in components.
- Dynamic import heavy modules: exporters, image compression, JSZip. Never in the initial bundle.
- No barrel files (`index.ts` re-exports). Import directly from source modules.
- Use `cn()` from `lib/utils` for conditional Tailwind classes.
- Prefer shadcn/ui components before building custom ones. Check the registry first.
- Mobile-first design. Bottom-anchored controls for thumb reachability on shot logger.
- Compound components with `{ state, actions, meta }` context interface for complex UI (Roll editor, Gear bag).
- Use `useLiveQuery` from `dexie-react-hooks` for reactive IndexedDB queries.

## Gotchas

- **Dexie.js, NOT Dexie Cloud.** We use Dexie for local IndexedDB only. Supabase is the cloud backend. Never import from `dexie-cloud-addon`.
- **Supabase SSR client only.** Use `@supabase/ssr` with `getAll()`/`setAll()` cookie methods. Never use the deprecated `@supabase/auth-helpers-nextjs` or individual `get`/`set`/`remove` cookie methods.
- **`supabase.auth.getUser()` on server, never `getSession()`.** `getSession()` doesn't validate the JWT and is a security risk on the server side.
- **Next.js 16 async params.** Route params and searchParams are Promises: `const { id } = await params`.
- **Next.js 16 proxy convention.** `middleware.ts` was renamed to `proxy.ts` (same API, renamed function). next-intl's `createMiddleware` still works — it just returns a request handler.
- **Zod 4 API differences.** `z.record()` requires two args: `z.record(z.string(), z.unknown())`. No `z.instanceof()` for browser-only types.
- **Hybrid i18n routing.** Marketing routes use `[locale]` prefix for SEO. App/auth routes have no prefix — locale comes from cookie. Don't mix up the two patterns.
- **supabase/migrations/ uses plain SQL.** Excluded from tsconfig. Don't import TS modules there.
- **Film format validation.** When loading a roll, only show films matching the camera's format (e.g., no 120 film in a 35mm camera).
- **Frame count limits.** Warn but allow override when exceeding roll's frame_count (sprocket-hole shots are valid).
- **iOS PWA limitations.** No Background Sync API. Process sync queue on foreground. Request `navigator.storage.persist()` on startup. Custom install banner needed.

## User Tiers

Three tiers with feature gating via `useUserTier()` hook and `<ProGate>` wrapper:

| Tier | Auth | Sync | How |
|------|------|------|-----|
| Guest | None | Local only | No prompts for local features |
| Free | Email/Google | Local only | Account for future sync |
| Pro | Invitation (MVP) | Cloud sync + image backup | Manual via Supabase dashboard |

**Admin: Grant Pro access** (via Supabase SQL editor or dashboard):
```sql
UPDATE user_profiles SET tier = 'pro' WHERE id = '<user-uuid>';
```

## Domain Terms

- **Roll** -- A roll of film loaded into a camera (lifecycle: loaded -> active -> finished -> developed -> scanned -> archived)
- **Frame** -- A single exposure/shot on a roll, with shutter speed, aperture, lens, GPS, notes
- **Gear bag** -- User's cameras, lenses, and custom film stocks
- **XMP sidecar** -- XML metadata file placed alongside a scanned image for Lightroom/Capture One
- **EI (Exposure Index)** -- Actual ISO used, may differ from film's box speed when pushing/pulling
- **Push/pull** -- Intentionally over/underexposing film (e.g., +1 stop push, -2 stop pull)

## Key References

For full architecture, data model, entity schemas, sync engine design, and export format specs:
@IMPLEMENTATION_PLAN.md

## Compaction

When compacting context, always preserve:
- Full list of modified files with exact paths
- Failing test output or error messages
- Current ticket being implemented (e.g., "FE-007: Shot Logger")
- Architectural decisions made during the session
