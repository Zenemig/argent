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
app/[locale]/(marketing)/          -- Landing page (locale prefix: as-needed for SEO)
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
lib/data/films.json                -- Film stock catalog (~990 stocks, scraped data)
lib/seed.ts                        -- Film stock seed data
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

- **(marketing)** routes use `[locale]` segment with `localePrefix: 'as-needed'` — English at `/`; Spanish at `/es`. Enables `hreflang` tags for SEO.
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

## TDD Workflow

All development follows strict Red-Green-Refactor:

1. **Red** -- Write or update tests first based on the spec. Run them, confirm they fail.
2. **Green** -- Implement or update the minimum code needed to make tests pass.
3. **Refactor** -- Clean up for readability, performance, and maintainability. Tests must stay green.

### Rules

- **Tests before code.** Never write implementation without a failing test first.
- **New features:** Write tests for the expected behavior, then implement.
- **Bug fixes:** Write a test that reproduces the bug (fails), then fix (passes).
- **Refactors:** Ensure existing tests pass before and after. Add tests if coverage gaps exist.
- **Run only the affected test file** during Red/Green (`npm test -- path/to/file.test.ts`). Run the full suite before committing.
- **One assertion per concern.** Tests should fail for exactly one reason.

### Test Conventions

- **Framework:** Vitest + jsdom + @testing-library/react + @testing-library/jest-dom.
- **File placement:** Co-located with source (`foo.tsx` → `foo.test.tsx`).
- **Mock strategy:** Module-level `vi.mock()` with inline factories BEFORE component imports (vi.mock is hoisted). Never reference `const` variables inside mock factories.
- **Standard mocks:**
  - `next-intl`: `useTranslations: () => (key) => key` (returns translation keys).
  - `sonner`: `toast: { error: vi.fn(), success: vi.fn() }`.
  - `dexie-react-hooks`: `useLiveQuery` with `mockQueryResults[]` array and `queryCallIndex` counter. Push extra copies for components that re-render via useEffect.
  - `@/lib/sync-write`: `syncAdd`/`syncUpdate` as `vi.fn().mockResolvedValue(undefined)`.
  - `useUserId`/`useUserTier`: Mutable `let` variables reset in `beforeEach`.
- **Per-test customization:** Mutable `let` variables at module scope, reset in `beforeEach`.
- **SVG elements:** Use `getAttribute("class")` instead of `.className` (jsdom returns `SVGAnimatedString`).
- **Radix components** (ScrollArea, Dialog): Mock with simple div wrappers when they don't render children in jsdom.
- **No snapshot tests** for components. Prefer explicit assertions on rendered content.

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

Two tiers with feature gating via `useUserTier()` hook and `<ProGate>` wrapper. Unauthenticated users are redirected to `/login`.

| Tier | Auth | Sync | How |
|------|------|------|-----|
| Free | Email/Google | Local only | Default on signup |
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

## Data Model (Dexie.js)

```typescript
db.version(6).stores({
  cameras:    '&id, user_id, format, mount, type, [user_id+deleted_at], updated_at',
  //           + shutter_speed_min, shutter_speed_max, has_bulb, metering_modes (not indexed)
  lenses:     '&id, user_id, camera_id, mount, [user_id+deleted_at], updated_at',
  //           + aperture_min (not indexed)
  films:      '&id, user_id, brand, format, process, is_custom, [user_id+deleted_at], updated_at',
  rolls:      '&id, user_id, camera_id, film_id, status, [user_id+status], [user_id+deleted_at], updated_at',
  frames:     '&id, roll_id, frame_number, [roll_id+frame_number], updated_at',
  filmStock:  '&id, brand, name, iso, format, process',  // seed data, read-only
  _syncQueue: '++id, table, entity_id, operation, status, retry_count, last_attempt',
  _syncMeta:  '&key',
});
```

Entity interfaces in `lib/types.ts`. Zod schemas in `lib/schemas.ts`. Film stock seed data (~990 stocks) in `lib/seed.ts` loaded from `lib/data/films.json`. Constants `LENS_MOUNTS` and `CAMERA_TYPES` in `lib/constants.ts`. Gear constraint filters in `lib/gear-filters.ts`.

## Roll Status Lifecycle

```
loaded -> active -> finished -> developed -> scanned -> archived
```

Each transition records a date (`start_date`, `finish_date`, `develop_date`, `scan_date`). Status can go back one step (undo).

## Sync Engine

- **LWW (Last-Write-Wins)** with server-assigned `updated_at` timestamps.
- All mutations go through `syncAdd()`/`syncUpdate()` in `lib/sync-write.ts` — writes to Dexie immediately, queues for Supabase upload.
- Retry queue in `_syncQueue` table with exponential backoff (max 5 retries).
- Download sync: queries Supabase for rows where `updated_at > lastDownloadSync`, bulk puts into Dexie.
- Image sync: thumbnails stored locally in Dexie, full images uploaded to Supabase Storage (Pro only).
- Sync is Pro-only. Free users see "Local only" in the sync status indicator.

## Export Formats

Exporters in `lib/exporters/` (dynamically imported, never in initial bundle):

- **XMP sidecar** (`xmp.ts`): XML/RDF with `tiff`, `exif`, `exifEX`, `dc`, `xmp`, `photoshop`, `Iptc4xmpCore` namespaces. Compatible with Lightroom Classic and Capture One. Downloadable as ZIP.
- **ExifTool CSV** (`csv.ts`): CSV with `SourceFile` column for `exiftool -csv` flag. EXIF date format (`YYYY:MM:DD HH:MM:SS`).
- **ExifTool script** (`exiftool-script.ts`): `.sh` script with one `exiftool` command per frame, `-overwrite_original` flag.
- **JSON** (`json.ts`): Full data dump of roll + frames for backup/portability.

## Compaction

When compacting context, always preserve:
- Full list of modified files with exact paths
- Failing test output or error messages
- Current ticket being implemented (e.g., "FE-007: Shot Logger")
- Architectural decisions made during the session
