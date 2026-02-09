# Argent - Implementation Plan v2

## Project Context

**Goal:** Build an offline-first PWA for analogue photographers to log shots, manage gear/film inventory, and sync data to the cloud. The killer feature is generating XMP sidecar files and ExifTool scripts so users can embed metadata into their scans.

**Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui (Radix UI primitives), Dexie.js (IndexedDB), Supabase (PostgreSQL + Auth + Storage), Serwist (Service Worker/PWA), next-intl (i18n), Zod (validation), Vitest (unit tests), Playwright (E2E tests).

**Languages:** English (default), Spanish.

**Deployment:** Vercel.

**License:** AGPL-3.0. Anyone can self-host for personal use. Modifications offered as a hosted service must be open-sourced. This protects against competitors cloning the SaaS while keeping the project fully open for the community.

**Repository:** Public on GitHub. All secrets via environment variables (`.env*` files gitignored).

**Business Model:** Open-core. Local-only features are free. Cloud sync/backup is a paid "Pro" tier (invitation-only for MVP, self-service billing via Lemon Squeezy or similar in a future phase).

---

## User Tiers

| Tier | Account Required | Features | Cost |
|------|-----------------|----------|------|
| **Guest** | No | Full local app: shot logging, gear management, roll lifecycle, export (XMP/CSV/JSON), settings, statistics | Free forever |
| **Free** | Yes (email/Google) | Everything Guest has + account (data associated with user ID for future sync) | Free |
| **Pro** | Yes + invitation (MVP) | Everything Free has + cloud sync, multi-device, reference image cloud backup | ~$2-3/month (future) |

### MVP Billing: Invitation-Only
- `user_profiles` table has a `tier` column (`guest` | `free` | `pro`), defaults to `free` on signup.
- Pro access granted manually via Supabase dashboard.
- Pricing page shows feature comparison + "Join waitlist" CTA (no payment flow).
- Feature gating via `useUserTier()` hook throughout the app.
- When ready to monetize: integrate Lemon Squeezy (Merchant of Record, works globally) and connect webhooks to auto-update `tier`.

---

## Competitive Landscape & Market Insights

### Key Competitors
| App | Platform | Pricing | Strengths | Weaknesses |
|-----|----------|---------|-----------|------------|
| **Frames** | Apple only (iOS/macOS) | ~$18/year | XMP generation, Shortcuts integration, polished UI | Apple-only, no Android/web, subscription |
| **Rollio** | iOS + Android | Free (open-source) | Cross-platform, basic roll tracking | No metadata export, basic UI, early stage |
| **Exif4Film** | Android | Free | EXIF embedding into scans | Android-only, dated UI, limited features |
| **Film Logbook** | iOS | Free | Quick logging | No export, basic |
| **Analog.Cafe Film Log** | Web | Free | Clean web UI, community integration | Limited features, no offline, no XMP |

### Community Pain Points (from r/AnalogCommunity, r/analog)
1. **Speed is everything** -- Photographers want 2-3 taps per frame max. Complex UIs are abandoned in the field.
2. **The "last mile" problem** -- Getting logged metadata INTO scanned files is the #1 unsolved pain point. Most people just give up.
3. **Data portability fears** -- Film apps get abandoned. Users want CSV/JSON export, not proprietary lock-in.
4. **No inventory tracking** -- With film prices rising 20-50%, photographers stockpile film. No app tracks fridge inventory properly.
5. **Platform lock-in** -- Frames is Apple-only. Android and web users have no equivalent.
6. **Auto-fill from previous frame** -- Most shots on a roll share similar settings. Only change what's different.

### Our Differentiators
1. **Cross-platform PWA** -- Works on any device with a browser.
2. **XMP sidecar + ExifTool script generation** -- The "last mile" solved.
3. **Offline-first** -- Log in the field without connectivity.
4. **Film inventory management** -- Track your fridge stock, auto-decrement on roll load.
5. **Open data** -- Export everything as JSON, CSV, XMP. No lock-in.

---

## Architecture & Technical Decisions

### Component Architecture
- **shadcn/ui** as the component foundation (copy-paste components built on Radix UI primitives). Provides accessible Dialog, Tabs, Select, Sheet, Command, DropdownMenu, Form (with Zod integration), Sonner (toasts), and more -- all Tailwind-native with dark mode support.
- **Server Components by default.** Only add `'use client'` at the lowest boundary (leaf components needing browser APIs).
- **Compound components** for complex UI assemblies (Roll editor, Gear bag).
- **Context-based state injection** with `{ state, actions, meta }` interface so UI doesn't know if data comes from Dexie or Supabase.
- **Dynamic imports** for heavy modules: camera capture, CSV/XMP exporters, image compression.
- **Custom domain components** built on top of shadcn/ui: Shot Logger controls (shutter/aperture pickers), Roll cards, Frame timeline, Sync status indicator.

### Data Architecture
- **ULIDs** for all entity IDs (time-sortable, globally unique, generated client-side via `ulid` package).
- **Dexie.js** as the local database (NOT Dexie Cloud -- we use Supabase as backend).
- **Zod schemas** for all entity types, shared between client validation and server actions.
- **Soft deletes** everywhere (`deleted_at` timestamp, null = active).

### Sync Engine Architecture
```
[React UI] <-> [useLiveQuery] <-> [Dexie.js / IndexedDB]
                                        |
                                   [Sync Engine]
                                   /           \
                          [Upload Sync]    [Download Sync]
                          (retry queue)    (catch-up query)
                                   \           /
                                    [Supabase]
                                   (Postgres + Storage + RLS)
```

- **LWW (Last-Write-Wins)** with server-assigned `updated_at` timestamps.
- **Retry queue** stored in Dexie `_syncQueue` table with exponential backoff.
- **Batch upserts** (200 rows/batch) via Supabase `.upsert()`.
- **Full resync recovery** when IndexedDB is empty (handles data loss/browser clear).
- **Thumbnails in IndexedDB**, full images in Supabase Storage.

### PWA Strategy
- **Serwist** for service worker: Precache app shell, CacheFirst for static assets, NetworkFirst for API.
- **iOS mitigations**: Custom install banner, `navigator.storage.persist()`, queue processing on app foreground (no Background Sync API on iOS).
- **Manifest**: `display: standalone`, maskable icons, proper scope/start_url.

### Performance Budgets
| Metric | Target |
|--------|--------|
| Total JS (compressed) | < 300 KB |
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |

### Accessibility Requirements
- WCAG 2.1 AA compliance.
- All form inputs have labels, all icon buttons have `aria-label`.
- Visible focus indicators (`:focus-visible`).
- `aria-live="polite"` for sync status updates.
- Keyboard-navigable throughout. Modal focus trapping.
- `prefers-reduced-motion` and `prefers-color-scheme` respected.

### Security
- RLS enabled on every Supabase table from day one.
- All Server Actions authenticate via `auth.uid()` + Zod input validation.
- Security headers: HSTS, CSP, X-Frame-Options, Permissions-Policy.
- Camera/geolocation permissions requested only after user action, never on page load.

---

## Data Model

### Local Database (Dexie.js)

```typescript
// Versioned schema
db.version(1).stores({
  cameras:    '&id, user_id, format, [user_id+deleted_at], updated_at',
  lenses:     '&id, user_id, camera_id, [user_id+deleted_at], updated_at',
  films:      '&id, user_id, brand, format, process, is_custom, [user_id+deleted_at], updated_at',
  rolls:      '&id, user_id, camera_id, film_id, status, [user_id+status], [user_id+deleted_at], updated_at',
  frames:     '&id, roll_id, frame_number, [roll_id+frame_number], updated_at',
  filmStock:  '&id, brand, name, iso, format, process',  // seed data, read-only
  _syncQueue: '++id, table, entity_id, operation, status, retry_count, last_attempt',
  _syncMeta:  '&key',
});
```

### Entity Schemas

**Camera**
| Field | Type | Description |
|-------|------|-------------|
| id | ULID | Primary key |
| user_id | string | Owner |
| name | string | e.g., "Nikon FM2" |
| make | string | e.g., "Nikon" |
| format | enum | `35mm`, `120`, `4x5`, `8x10`, `instant`, `other` |
| default_frame_count | number | e.g., 36, 12, 16, 1 |
| notes | string? | Optional notes |
| deleted_at | timestamp? | Soft delete |
| updated_at | timestamp | Sync tracking |
| created_at | timestamp | Creation time |

**Lens**
| Field | Type | Description |
|-------|------|-------------|
| id | ULID | Primary key |
| user_id | string | Owner |
| camera_id | ULID? | Linked camera (null = universal) |
| name | string | e.g., "Nikkor 50mm f/1.4 AI-S" |
| make | string | e.g., "Nikon" |
| focal_length | number | In mm |
| max_aperture | number | e.g., 1.4 |
| deleted_at | timestamp? | Soft delete |
| updated_at | timestamp | Sync tracking |
| created_at | timestamp | Creation time |

**Film (User Custom)**
| Field | Type | Description |
|-------|------|-------------|
| id | ULID | Primary key |
| user_id | string | Owner |
| brand | string | e.g., "Kodak" |
| name | string | e.g., "Portra 400" |
| iso | number | Box speed |
| format | enum | `35mm`, `120`, `4x5`, `8x10`, `other` |
| process | enum | `C-41`, `E-6`, `BW`, `BW-C41`, `other` |
| is_custom | boolean | true for user-created |
| deleted_at | timestamp? | Soft delete |
| updated_at | timestamp | Sync tracking |
| created_at | timestamp | Creation time |

**Roll**
| Field | Type | Description |
|-------|------|-------------|
| id | ULID | Primary key |
| user_id | string | Owner |
| camera_id | ULID | Camera used |
| film_id | ULID | Film stock used |
| lens_id | ULID? | Default lens (if single-lens camera) |
| status | enum | `loaded`, `active`, `finished`, `developed`, `scanned`, `archived` |
| frame_count | number | Max frames for this roll (36, 12, etc.) |
| ei | number | Exposure Index (actual ISO used, may differ from box speed) |
| push_pull | number | Stops pushed/pulled (0 = normal, +1, -2, etc.) |
| lab_name | string? | Where it was sent for dev |
| dev_notes | string? | Development instructions |
| start_date | timestamp | Date loaded |
| finish_date | timestamp? | Date finished shooting |
| develop_date | timestamp? | Date developed |
| scan_date | timestamp? | Date scanned |
| notes | string? | General notes |
| deleted_at | timestamp? | Soft delete |
| updated_at | timestamp | Sync tracking |
| created_at | timestamp | Creation time |

**Frame**
| Field | Type | Description |
|-------|------|-------------|
| id | ULID | Primary key |
| roll_id | ULID | Parent roll |
| frame_number | number | Frame # on roll |
| shutter_speed | string | e.g., "1/125", "1s", "B 4m" |
| aperture | number | f-number (e.g., 2.8, 8, 16) |
| lens_id | ULID? | Lens used (overrides roll default) |
| metering_mode | enum? | `spot`, `center`, `matrix`, `incident`, `sunny16` |
| exposure_comp | number? | EV compensation |
| filter | string? | e.g., "Orange #21", "ND 3-stop" |
| latitude | number? | GPS lat |
| longitude | number? | GPS lon |
| location_name | string? | e.g., "Central Park" |
| notes | string? | Quick note |
| thumbnail | Blob? | Compressed reference image (< 100KB) |
| image_url | string? | Supabase Storage URL for full image |
| captured_at | timestamp | When the shot was taken |
| updated_at | timestamp | Sync tracking |
| created_at | timestamp | Creation time |

### Film Stock Seed Database

Comprehensive seed data covering 80+ current film stocks across:
- **Kodak**: Portra (160/400/800), Ektar 100, Gold 200, UltraMax 400, ColorPlus 200, Tri-X 400, T-MAX (100/400/P3200), Ektachrome E100
- **Fujifilm**: C200, Superia X-TRA 400, Neopan Acros II 100, Velvia (50/100), Provia 100F
- **Ilford**: Pan F 50, FP4 125, HP5 400, Delta (100/400/3200), XP2 Super, SFX 200, Ortho Plus
- **Kentmere**: Pan 100, Pan 400
- **CineStill**: 50D, 400D, 800T
- **Lomography**: CN 100/400/800, LomoChrome Purple, Metropolis, Berlin/Potsdam/Fantome Kino
- **Fomapan**: 100/200/400
- **ADOX**: Silvermax 100, CMS 20 II, HR-50
- **Rollei**: RPX 25/100/400, Infrared 400, Retro 80S/400S
- **Others**: Bergger Pancro 400, JCH StreetPan 400, Shanghai GP3 100, Harman Phoenix 200

Each stock includes: brand, name, iso, formats available (35mm/120/sheet), process type (C-41/E-6/BW).

---

## Roll Status Lifecycle

```
loaded -> active -> finished -> developed -> scanned -> archived
```

| Status | Trigger | Description |
|--------|---------|-------------|
| `loaded` | User creates roll via Load Wizard | Film is in the camera, ready to shoot |
| `active` | First frame logged | User has started shooting |
| `finished` | User marks roll as finished | All frames shot or roll removed |
| `developed` | User marks as developed | Film has been processed by a lab or at home |
| `scanned` | User marks as scanned | Negatives have been digitized |
| `archived` | User archives roll | Roll is complete, data exported |

---

## Export Formats

### XMP Sidecar Files (Primary)
- Standard XML/RDF structure compatible with Lightroom Classic and Capture One.
- Namespaces: `tiff`, `exif`, `exifEX`, `dc`, `xmp`, `photoshop`, `Iptc4xmpCore`.
- Film stock encoded in `dc:description` + `dc:subject` (keywords) for universal compatibility.
- Camera/lens in `tiff:Make`/`tiff:Model` + `exifEX:LensModel`.
- GPS in `exif:GPSLatitude`/`exif:GPSLongitude`.
- File naming: matches scan filename (e.g., `scan_001.tif` -> `scan_001.xmp`).
- Downloadable as ZIP archive.

### ExifTool CSV (Secondary)
- CSV with `SourceFile` column for ExifTool's native `-csv` flag.
- Date format: `YYYY:MM:DD HH:MM:SS` (EXIF standard, colons in date).
- Columns: SourceFile, Make, Model, LensModel, FocalLength, FNumber, ExposureTime, ISO, DateTimeOriginal, GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef, ImageDescription, Keywords.

### ExifTool Shell Script (Power Users)
- Generates a `.sh` script with one `exiftool` command per frame.
- Users run it locally against their scan directory.
- Includes `-overwrite_original` flag and proper escaping.

### JSON Export (Backup)
- Full data dump of all entities for portability and backup.

---

## Ticket Breakdown

### Phase 0: Foundation

#### FE-000: TypeScript Types, Validation Schemas & Constants
**User Story:** As a developer, I need shared type definitions and validation schemas so all features use consistent, validated data structures.

**Tasks:**
- Create `lib/types.ts` with all entity interfaces: Camera, Lens, Film, Roll, Frame, SyncQueueItem, SyncMeta.
- Create `lib/schemas.ts` with Zod schemas matching each entity type.
- Define enums/constants: `FILM_FORMATS`, `FILM_PROCESSES`, `ROLL_STATUSES`, `METERING_MODES`, `SHUTTER_SPEEDS`, `APERTURES`.
- Create `lib/utils.ts` with `cn()` helper (clsx + tailwind-merge).
- Install and configure: `zod`, `ulid`, `clsx`, `tailwind-merge`.

**Acceptance Criteria:** All types compile. Zod schemas validate sample data correctly. Constants are importable.

---

#### FE-001: Project Scaffolding, PWA & i18n Setup
**User Story:** As a developer, I need the project scaffolded with the correct stack so I can start building features.

**Tasks:**
- Add `AGPL-3.0` LICENSE file to the repository root.
- Configure `.gitignore`: ensure `.env*`, `.env.local`, `.env.production`, `node_modules/`, `.next/`, `.claude/settings.local.json` are excluded. Keep `.claude/skills/` tracked (useful for contributors).
- Create `.env.example` with placeholder keys for Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and any future services, documenting what each variable is for.
- Initialize Next.js 15 app (App Router, TypeScript, Tailwind CSS v4, no src dir).
- Install core dependencies: `dexie`, `dexie-react-hooks`, `lucide-react`, `date-fns`, `next-intl`.
- Install dev dependencies: `vitest`, `@testing-library/react`, `playwright`, `@playwright/test`.
- Initialize shadcn/ui (`npx shadcn@latest init`): select "zinc" theme, dark mode default, CSS variables for theming, New York style.
- Install foundational shadcn/ui components: `button`, `card`, `input`, `label`, `dialog`, `tabs`, `select`, `sheet`, `dropdown-menu`, `form`, `sonner`, `command`, `badge`, `separator`, `skeleton`, `tooltip`.
- Set up folder structure:
  ```
  /app/[locale]/(marketing)/       -- Landing page, pricing (locale prefix for SEO)
  /app/[locale]/(marketing)/pricing/
  /app/(app)/                      -- Dashboard (no locale prefix, clean URLs)
  /app/(app)/gear/                 -- Gear bag: /gear
  /app/(app)/roll/[id]/            -- Roll detail: /roll/abc123
  /app/(app)/settings/             -- Settings: /settings
  /app/(app)/stats/                -- Statistics: /stats
  /app/(auth)/login/               -- Auth: /login
  /components/ui/                  -- shadcn/ui components (auto-generated)
  /components/marketing/           -- Landing page components
  /components/                     -- Feature/domain components
  /lib/                            -- DB, utils, schemas, types, exporters
  /hooks/                          -- Custom React hooks
  /messages/                       -- i18n translation files
  /public/                         -- Icons, manifest
  ```
- Configure `next-intl` with hybrid routing strategy:
  - Marketing routes (`(marketing)`) use `[locale]` segment with `localePrefix: 'as-needed'` — English at `/`, `/pricing`; Spanish at `/es`, `/es/pricing`. Add `<link rel="alternate" hreflang="...">` tags.
  - App routes (`(app)`, `(auth)`) have no locale prefix — clean URLs like `/gear`, `/roll/abc123`, `/login`. Locale resolved from `NEXT_LOCALE` cookie or `Accept-Language` header.
  - Middleware handles the routing split between prefixed marketing routes and unprefixed app routes.
- Create `messages/en.json` and `messages/es.json` with base keys (navigation, common actions, form labels).
- Set `<html lang={locale}>` dynamically in root layout (resolved from cookie/header for app routes).
- Configure Serwist (`@serwist/next`):
  - Create `app/sw.ts` with precache manifest, CacheFirst for static assets, NetworkFirst for API routes.
  - Configure `next.config.ts` with Serwist plugin.
  - Set `reloadOnOnline: false`.
- Create `manifest.json` with proper PWA fields (`display: standalone`, icons 192/512/maskable, theme color).
- Configure Vitest in `vitest.config.ts`. Create a sample test to verify setup.
- Configure Playwright in `playwright.config.ts`. Create a sample E2E test.
- Set up dark mode as default via Tailwind config (zinc palette).
- Add security headers in `next.config.ts` (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy for camera/geolocation).
- Customize shadcn/ui theme: set `rounded-xl` as default border radius in CSS variables, verify zinc palette contrast ratios meet WCAG AA on dark backgrounds.

**Acceptance Criteria:**
- AGPL-3.0 LICENSE file present at repo root.
- `.gitignore` excludes `.env*` files and other sensitive/generated paths.
- `.env.example` documents all required environment variables.
- App runs on `localhost:3000`.
- `/` renders English landing page, `/es` renders Spanish landing page.
- App routes (`/gear`, `/settings`) render in the locale set by cookie/browser.
- PWA is installable (Lighthouse PWA audit passes).
- `vitest run` passes the sample test.
- `npx playwright test` passes the sample E2E test.
- Dark mode renders by default.

---

#### FE-002: Local Database Schema & Seed Data
**User Story:** As the app, I need a robust local database to store all entities offline.

**Tasks:**
- Create `lib/db.ts` with `ArgentDb` class extending Dexie.
- Define all tables with indexes as specified in the Data Model section.
- Implement schema versioning with `db.version(1).stores(...)`.
- Create `lib/seed.ts` with the comprehensive film stock seed data (80+ stocks).
- Implement seed function that runs on first load (check for sentinel in `_syncMeta`).
- Add `_syncQueue` and `_syncMeta` tables for sync engine.
- Write unit tests for DB opening, seeding, and basic CRUD operations.

**Acceptance Criteria:**
- `db.ts` compiles without errors.
- DB opens successfully (verified via console/test).
- Seed data populates on first load with 80+ film stocks.
- Subsequent loads don't re-seed.
- All unit tests pass.

---

### Phase 1: Core Local Features

#### FE-003: Gear Bag -- Camera CRUD
**User Story:** As a user, I want to manage my cameras so I can assign them to rolls.

**Tasks:**
- Create Gear Bag page at `/gear`.
- Implement Tab UI (Cameras | Lenses | Custom Films) using compound component pattern.
- Create `AddCameraForm` component with Zod validation:
  - Fields: name, make, format (dropdown: 35mm/120/4x5/8x10/instant/other), default frame count, notes.
  - Format selection auto-fills default frame count (35mm=36, 120=12, 4x5=1, etc.).
- Create `CameraList` component using `useLiveQuery`.
- Implement edit (inline or modal) and soft-delete with confirmation.
- Auto-fill from previous frame pattern: remember last used camera settings.
- Mobile-first: card-based list with swipe-to-delete (or long-press menu).
- Write unit tests for camera CRUD operations.

**Acceptance Criteria:**
- User can add, edit, and delete cameras.
- Format selection constrains frame count.
- Data persists after page refresh.
- Empty state shows helpful "Add your first camera" prompt.
- Form validation prevents invalid entries.
- Unit tests pass.

---

#### FE-004: Gear Bag -- Lens Management
**User Story:** As a user, I want to manage my lenses so I can log which lens was used for each shot.

**Tasks:**
- Add Lenses tab to Gear Bag page.
- Create `AddLensForm` with Zod validation:
  - Fields: name, make, focal length, max aperture, linked camera (optional dropdown).
- Create `LensList` using `useLiveQuery`, grouped by linked camera (or "Universal").
- Implement edit and soft-delete.
- Write unit tests.

**Acceptance Criteria:**
- User can add, edit, and delete lenses.
- Lenses can be linked to a camera or left universal.
- Data persists after refresh.
- Unit tests pass.

---

#### FE-005: Gear Bag -- Film Catalog & Custom Films
**User Story:** As a user, I want to browse available film stocks and add custom ones.

**Tasks:**
- Add Custom Films tab to Gear Bag page.
- Create `FilmCatalog` component: searchable/filterable list of seed film stocks.
  - Filter by: format (35mm/120/sheet), process (C-41/E-6/BW), brand.
  - Search by name.
- Create `AddFilmForm` for custom films with Zod validation:
  - Fields: brand, name, ISO, format, process.
- User's custom films appear at top of catalog, clearly marked.
- Write unit tests.

**Acceptance Criteria:**
- Seed film stocks are browsable and filterable.
- User can add custom film stocks.
- Custom films are distinguishable from seed data.
- Search works across brand and name.
- Unit tests pass.

---

#### FE-006: Dashboard & Load Roll Wizard
**User Story:** As a user, I want to load a new roll into a camera so the app tracks my shooting.

**Tasks:**
- Create Dashboard (Home) page at `/dashboard` (app route group, no locale prefix).
- If no active rolls: show prominent "Load New Roll" CTA.
- If active rolls: show roll cards with progress (e.g., "12/36 frames").
- Create Load Roll Wizard (multi-step modal or page):
  - **Step 1:** Select Camera (from user's cameras in Dexie).
  - **Step 2:** Select Film (from catalog + custom, filtered by camera format).
  - **Step 3:** Configure: EI/ISO (default to box speed, allow override), push/pull stops, default lens, notes.
- Format validation: only show films matching the selected camera's format.
- On completion: create Roll in Dexie with status `loaded`, frame_count from camera default.
- Roll card design: camera name, film name, frame progress bar, status badge.
- Write unit tests for roll creation logic and format validation.
- Write E2E test for the full Load Roll flow.

**Acceptance Criteria:**
- Dashboard shows active rolls or empty state.
- Load Wizard prevents format mismatches (can't load 120 film in 35mm camera).
- New roll appears on dashboard with correct frame count.
- Push/pull correctly sets EI from box speed.
- Unit and E2E tests pass.

---

#### FE-007: Shot Logger (Core Feature)
**User Story:** As a user, I need a fast interface to log a frame's exposure settings while walking.

**Tasks:**
- Create Roll Detail page at `/roll/[id]`.
- Display: roll info header (camera, film, EI, frame progress), frame timeline/list.
- Build Log Controls (optimized for speed -- 2-3 taps per frame):
  - **Shutter Speed Picker**: scrollable wheel or quick-select grid. Values: B, 30s, 15s, 8s, 4s, 2s, 1s, 1/2, 1/4, 1/8, 1/15, 1/30, 1/60, 1/125, 1/250, 1/500, 1/1000, 1/2000, 1/4000, 1/8000.
  - **Aperture Picker**: scrollable or grid. Values from f/1.0 to f/64 in standard stops.
  - **Lens Selector**: dropdown (if camera has multiple lenses).
  - **Quick Note**: single-line text input.
  - **Filter**: optional text input.
  - **Metering Mode**: optional quick toggle.
- **Auto-fill**: Pre-populate from previous frame's settings. User only changes what's different.
- **Geolocation**: Request permission on first use. If allowed, capture coords on each save. Use `useRef` for location watcher (no re-renders).
- "Save Shot" button: writes to `frames` table. Auto-increments frame number. Updates roll status to `active` if first frame.
- Prevent exceeding frame_count (warn user, allow override for sprocket-hole shots).
- Frame timeline: list of logged frames with compact summary (frame #, shutter, aperture, time).
- Mobile-first: bottom-anchored controls, thumb-reachable save button.
- Write unit tests for frame creation and auto-fill logic.
- Write E2E test for logging 3 frames.

**Acceptance Criteria:**
- User can tap a roll, adjust settings, and save in 2-3 taps.
- Frame count increments on dashboard.
- Auto-fill carries forward previous frame settings.
- Geolocation captured silently (if permitted).
- Cannot log frame 37 on a 36-frame roll without confirmation.
- Unit and E2E tests pass.

---

#### FE-008: Roll Lifecycle Management
**User Story:** As a user, I want to track my roll through its entire lifecycle from loading to archiving.

**Tasks:**
- Add status transition actions to Roll Detail page:
  - "Finish Roll" button (loaded/active -> finished). Sets `finish_date`.
  - "Mark Developed" (finished -> developed). Sets `develop_date`. Optional lab name and dev notes fields.
  - "Mark Scanned" (developed -> scanned). Sets `scan_date`.
  - "Archive" (scanned -> archived).
- Status badge with color coding on roll cards.
- Roll history/timeline showing status transitions with dates.
- Filter rolls on dashboard by status.
- Allow "undo" of status transitions (go back one step).
- Write unit tests for status transitions.

**Acceptance Criteria:**
- User can advance a roll through all 6 statuses.
- Each transition records the appropriate date.
- Status badges update on dashboard.
- Can filter dashboard by status.
- Cannot skip statuses (must go in order).
- Unit tests pass.

---

#### FE-009: Settings & Preferences
**User Story:** As a user, I want to configure my preferences for a personalized experience.

**Tasks:**
- Create Settings page at `/settings`.
- Preferences (stored in Dexie `_syncMeta` table):
  - **Language**: English / Spanish (sets `NEXT_LOCALE` cookie and reloads).
  - **Theme**: Dark (default) / Light / System.
  - **Default metering mode**: for new frames.
  - **Default camera**: for quick roll loading.
  - **Display name**: for export metadata (`dc:creator`).
  - **Copyright notice**: for export metadata.
- Theme switching: use inline `<script>` pattern to prevent hydration flash.
- Respect `prefers-color-scheme` when set to "System".
- Write unit tests for preference storage/retrieval.

**Acceptance Criteria:**
- All preferences persist across sessions.
- Language switching sets cookie and reloads UI in new locale.
- Theme changes apply immediately without flash.
- Default settings pre-fill in forms.
- Unit tests pass.

---

#### FE-014: Marketing Landing Page
**User Story:** As a visitor, I want to understand what Argent is and why I should use it so I can decide to try the app.

**Tasks:**
- Create `(marketing)` route group with its own layout (no app chrome -- clean, public-facing).
- Build landing page at `/` (en) and `/es` (es) with sections:
  - **Hero**: Tagline, subtitle, primary CTA ("Start Logging -- Free"), secondary CTA ("Learn More").
  - **Problem statement**: "The last mile problem" -- brief explanation of the metadata gap.
  - **Feature showcase**: 3-4 cards highlighting key differentiators (offline-first, XMP export, cross-platform, open data).
  - **How it works**: 3-step visual flow (Log -> Develop -> Export with metadata).
  - **Testimonial/social proof area**: Placeholder for future quotes.
  - **Pricing preview**: Free vs. Pro comparison table (Pro shows "Coming Soon" or "Join Waitlist").
  - **Footer**: Links (GitHub, privacy policy, terms), language switcher, social links.
- All content goes through `next-intl` (English + Spanish).
- SEO: proper `<title>`, `<meta description>`, Open Graph tags, structured data (JSON-LD).
- Static rendering for maximum performance (no client-side JS needed for landing page).
- Responsive: mobile-first, looks great on all breakpoints.
- Accessible: semantic HTML, proper heading hierarchy, color contrast.
- Write E2E test for landing page rendering and navigation to app.

**Acceptance Criteria:**
- Landing page renders at `/` (English) and `/es` (Spanish) with translated content.
- `<link rel="alternate" hreflang="en">` and `hreflang="es"` tags present.
- Lighthouse scores: Performance > 95, Accessibility > 95, SEO > 95.
- CTA links navigate to the app dashboard (or login if auth required).
- Page is fully static (no client-side data fetching).
- E2E test passes.

---

#### FE-015: Pricing Page
**User Story:** As a visitor, I want to compare free and pro features so I can decide which tier is right for me.

**Tasks:**
- Create pricing page at `/pricing` (en) and `/es/pricing` (es).
- Feature comparison table: Free vs. Pro with checkmarks.
- Pro tier shows "Join Waitlist" button (collects email via simple form or Supabase insert).
- Free tier shows "Get Started" button linking to the app.
- FAQ section addressing common questions (data portability, self-hosting, etc.).
- All content via `next-intl`.
- Static rendering.

**Acceptance Criteria:**
- Pricing page renders with feature comparison.
- "Join Waitlist" captures email (stored in Supabase `waitlist` table).
- "Get Started" navigates to the app.
- Page is fully static except waitlist form.

---

### Phase 2: Cloud Sync & Auth

#### BE-001: Supabase Setup, Auth & Database Schema
**User Story:** As a user, I want to sign in so my data can be backed up and accessed across devices.

**Tasks:**
- Install `@supabase/ssr` and `@supabase/supabase-js`.
- Create `lib/supabase/client.ts` (browser client) and `lib/supabase/server.ts` (server client).
- Build Auth pages:
  - Login page (`/login`) with Email/Password and Google OAuth.
  - Sign-up flow with email confirmation.
  - Password reset flow.
- Create `UserProfile` component showing email, display name, sync status.
- Create SQL migration files for all tables (cameras, lenses, films, rolls, frames, **user_profiles**, **waitlist**) with:
  - UUIDs as primary keys.
  - `user_id` column referencing `auth.users(id)`.
  - `deleted_at` column for soft deletes.
  - `updated_at` column with `moddatetime` trigger.
  - Appropriate indexes (user_id, foreign keys, compound indexes for common queries).
  - Partial indexes where relevant (e.g., `WHERE deleted_at IS NULL`).
  - All timestamps as `timestamptz`.
- Create `user_profiles` table: `id` (references auth.users), `tier` (enum: `free`/`pro`, default `free`), `display_name`, `copyright_notice`, `created_at`, `updated_at`.
- Create `waitlist` table: `id`, `email`, `created_at` (for Pro waitlist from pricing page).
- Create a Postgres trigger that auto-creates a `user_profiles` row on new user signup (via `auth.users` insert).
- RLS policies on every table:
  ```sql
  CREATE POLICY "Users CRUD own data" ON [table]
    FOR ALL USING (user_id = auth.uid());
  ```
- Create Supabase Storage bucket for reference images with per-user RLS.
- Auth middleware to protect routes (redirect unauthenticated users to login).
- Guest mode: app works fully without auth (local-only). Auth is optional for sync.
- Write unit tests for auth utilities.
- Write E2E test for login/logout flow.

**Acceptance Criteria:**
- User can sign up, sign in, and sign out.
- Session persists across page refreshes.
- App works fully without authentication (local-only mode).
- All tables have RLS enabled.
- SQL migrations are documented and repeatable.
- Unit and E2E tests pass.

---

#### BE-002: Sync Engine -- Upload
**User Story:** As a user, I want my locally logged data to sync to the cloud when I'm online.

**Tasks:**
- Create `hooks/useSync.ts` custom hook.
- Implement upload sync logic:
  1. Monitor connectivity via `navigator.onLine` + `online`/`offline` events.
  2. On connectivity restore (or manual trigger), process `_syncQueue` table.
  3. Queue entries are processed FIFO, grouped by entity.
  4. Batch upsert to Supabase (200 rows/batch) with `onConflict: 'id'`.
  5. On success: remove from queue, update `_syncMeta.lastUploadSync`.
  6. On failure: increment `retry_count`, apply exponential backoff (1s, 2s, 4s... max 60s). After 5 failures, mark as `failed`.
- All mutations (create/update/delete) go through a `syncWrite()` helper that:
  1. Writes to Dexie (immediate).
  2. Adds entry to `_syncQueue`.
  3. Attempts immediate sync if online.
- Add visual sync status indicator in header:
  - Green dot = all synced.
  - Yellow dot + spinner = syncing.
  - Gray dot = offline.
  - Red dot = sync errors (tappable for details).
- Write unit tests for queue processing, batch logic, retry/backoff.

**Acceptance Criteria:**
- Create a camera while offline. Go online. Camera appears in Supabase dashboard.
- Sync status indicator updates in real-time.
- Failed syncs retry with exponential backoff.
- Queue persists across page refreshes.
- Unit tests pass.

---

#### BE-003: Sync Engine -- Download & Hydrate
**User Story:** As a user, I want to see data created on another device when I open the app.

**Tasks:**
- Extend `useSync` hook with download sync:
  1. On app start (or manual refresh), query Supabase for all rows where `updated_at > lastDownloadSync`.
  2. Bulk put into Dexie.
  3. Update `_syncMeta.lastDownloadSync`.
- Conflict resolution: **Server wins** (LWW). Server's `updated_at` is authoritative.
- Handle full resync scenario: if `_syncMeta` is empty (fresh install or data cleared), download all user data.
- Request `navigator.storage.persist()` on app startup.
- Add "Sync Now" manual trigger button in header/settings.
- Log sync conflicts to a `_syncConflicts` table for debugging.
- Write unit tests for download sync, conflict resolution, full resync.

**Acceptance Criteria:**
- Add a camera in Supabase SQL editor. Refresh app. Camera appears locally.
- Full resync works after clearing IndexedDB.
- Conflict resolution works (server version wins).
- Manual "Sync Now" works.
- Unit tests pass.

---

#### BE-004: Reference Image Sync
**User Story:** As a user, I want my reference photos to be backed up to the cloud.

**Tasks:**
- Extend sync engine for blob data:
  1. When a frame has a `thumbnail` blob and no `image_url`:
     - Compress to JPEG (quality 80%, max 2048px dimension).
     - Upload to Supabase Storage (`reference-images/{user_id}/{roll_id}/{frame_id}.jpg`).
     - On success: store URL in `image_url`, clear local blob.
  2. Download sync: when `image_url` exists but thumbnail is missing, download and cache.
- Supabase Storage RLS: users can only access their own `{user_id}/` path.
- Cache downloaded images in service worker Cache API.
- Write unit tests for image sync flow.

**Acceptance Criteria:**
- Reference photo uploads to Supabase Storage when online.
- Photo URL stored in frame record.
- Photos accessible on other devices after sync.
- Unit tests pass.

---

#### BE-005: User Tier System & Feature Gating
**User Story:** As the app, I need to check a user's subscription tier to enable or restrict Pro features.

**Tasks:**
- Create `hooks/useUserTier.ts`:
  - Returns `{ tier: 'guest' | 'free' | 'pro', isProUser: boolean, isAuthenticated: boolean }`.
  - Guest = no auth session. Free = auth session + `user_profiles.tier === 'free'`. Pro = `tier === 'pro'`.
  - Reads from Supabase `user_profiles` on auth, caches in React context.
- Create `components/ProGate.tsx`:
  - Wrapper component that renders children if Pro, otherwise shows upgrade prompt.
  - Used around sync UI, cloud backup options, etc.
- Create `components/UpgradePrompt.tsx`:
  - Friendly prompt explaining Pro benefits with "Join Waitlist" CTA.
  - Shown when free users try to access Pro features.
- Gate the following behind Pro:
  - Sync engine (BE-002/003) -- sync buttons show UpgradePrompt for free users.
  - Reference image cloud upload (BE-004).
  - Sync status indicator shows "Local only" for free users instead of sync status.
- Settings page (`FE-009`): show tier badge, "Manage Subscription" section (for future billing integration).
- Admin: document how to manually set a user's tier via Supabase dashboard SQL:
  ```sql
  UPDATE user_profiles SET tier = 'pro' WHERE id = '<user-id>';
  ```
- Write unit tests for `useUserTier` hook and `ProGate` component.

**Acceptance Criteria:**
- Free users see upgrade prompts when trying to sync.
- Pro users see sync controls and status indicator.
- Guest users (no account) use the app fully locally with no upgrade prompts for local features.
- Tier changes in Supabase reflect immediately on next app load.
- Unit tests pass.

---

### Phase 3: Export & Polish

#### FE-010: XMP Sidecar Exporter
**User Story:** As a user, I want to download XMP sidecar files to tag my scans with metadata.

**Tasks:**
- Create `lib/exporters/xmp.ts`.
- Generate valid XMP/RDF XML for each frame using standard namespaces:
  - `tiff:Make/Model` from camera.
  - `exifEX:LensModel` from lens.
  - `exif:FNumber`, `exif:ExposureTime`, `exif:ISOSpeedRatings`, `exif:FocalLength` from frame.
  - `exif:DateTimeOriginal` from `captured_at`.
  - `exif:GPSLatitude/Longitude` from frame coords.
  - `dc:description` with film stock + frame # + push/pull info.
  - `dc:subject` with film stock name as keyword.
  - `xmp:CreatorTool` = "Argent Film Logger".
  - `dc:creator` from user settings.
- Filename mapping UI: user enters scan filename pattern (e.g., `scan_{frame_number}.tif`) or uploads a list.
- Generate ZIP containing one `.xmp` file per frame.
- Use `JSZip` for client-side ZIP generation.
- Dynamically import the exporter module on "Export" button click.
- Write unit tests validating generated XMP against expected XML structure.

**Acceptance Criteria:**
- Clicking "Download XMP" generates a ZIP of sidecar files.
- XMP validates as well-formed XML.
- Lightroom reads the sidecars correctly (manual verification).
- Unit tests pass.

---

#### FE-011: CSV & ExifTool Exporters
**User Story:** As a user, I want alternative export formats for different workflows.

**Tasks:**
- Create `lib/exporters/csv.ts`:
  - ExifTool-compatible CSV with `SourceFile` column.
  - Date format: `YYYY:MM:DD HH:MM:SS`.
  - Proper escaping for fields with commas/quotes.
- Create `lib/exporters/exiftool-script.ts`:
  - Generates `.sh` script with `exiftool` commands per frame.
  - Includes `-overwrite_original` flag.
  - Proper shell escaping.
- Create `lib/exporters/json.ts`:
  - Full JSON export of roll + frames data.
- Add Export menu to Roll Detail page with format options.
- Use `file-saver` or native `<a download>` for triggering downloads.
- Write unit tests for each exporter.

**Acceptance Criteria:**
- CSV downloads with correct column headers and data.
- Shell script is executable and generates valid ExifTool commands.
- JSON export contains complete roll data.
- Unit tests pass.

---

#### FE-012: Reference Image Capture
**User Story:** As a user, I want to take a quick reference photo to help identify frames later.

**Tasks:**
- Add camera capture button to the Shot Logger UI.
- Use `<input type="file" accept="image/*" capture="environment" />` for mobile camera access.
- Compress captured image client-side:
  - Resize to max 1024px dimension.
  - JPEG quality 60%.
  - Target: < 100KB per thumbnail.
- Store compressed thumbnail as Blob in frame's `thumbnail` field in Dexie.
- Display thumbnails in frame timeline.
- Tap to view full-size (if available from sync).
- Request camera permission only on button tap, never on page load.
- Handle permission denial gracefully with accessible error message.
- Write unit tests for image compression logic.

**Acceptance Criteria:**
- Can take a reference photo on mobile.
- Photo appears in frame timeline.
- Image is compressed to < 100KB.
- Camera permission requested only on action.
- Unit tests pass.

---

#### FE-013: Search, Filter & Statistics
**User Story:** As a user, I want to find and analyze my shooting data.

**Tasks:**
- Add search functionality to Dashboard:
  - Search across rolls by camera, film stock, date, notes.
  - Filter by status, camera, film stock.
  - Sort by date, status, camera.
- Add Statistics page at `/stats`:
  - Most used film stocks (bar chart).
  - Shots per month (line chart).
  - Most used cameras.
  - Most used focal lengths.
  - Average frames per roll.
- Use a lightweight charting library (e.g., `recharts` or custom SVG).
- All stats computed from local Dexie data.
- Write unit tests for statistics calculations.

**Acceptance Criteria:**
- Search returns relevant results.
- Filters narrow results correctly.
- Statistics page shows accurate data.
- Charts render without layout shift (CLS < 0.1).
- Unit tests pass.

---

### Phase 4: Testing & Quality

#### QA-001: Comprehensive E2E Test Suite
**User Story:** As a developer, I need confidence that core user flows work correctly.

**Tasks:**
- E2E tests covering critical paths:
  1. **Full roll lifecycle**: Create camera -> Load roll -> Log 5 frames -> Finish -> Develop -> Scan -> Archive -> Export XMP.
  2. **Offline resilience**: Log frames offline -> Go online -> Verify sync.
  3. **Auth flow**: Sign up -> Sign in -> Verify data syncs -> Sign out -> Sign in on "new device" -> Data appears.
  4. **i18n**: Switch to Spanish -> Verify all UI text changes -> Core flows work.
  5. **Gear management**: Add/edit/delete cameras, lenses, films.
- Configure Playwright for mobile viewports (iPhone 14, Pixel 7).
- Add CI configuration for running tests on PR.

**Acceptance Criteria:**
- All E2E tests pass on Chrome and Safari (WebKit).
- Tests run in CI.
- Mobile viewport tests pass.

---

#### QA-002: Accessibility Audit
**User Story:** As a developer, I need to verify the app meets WCAG 2.1 AA standards.

**Tasks:**
- Run axe-core audit on all pages.
- Fix any contrast issues (zinc palette on dark mode).
- Verify keyboard navigation on all interactive elements.
- Test with VoiceOver (macOS/iOS) and screen reader.
- Add skip links to main content.
- Verify `aria-live` regions for dynamic content (sync status, frame count).
- Verify modal focus trapping (Load Wizard, Add Camera form).
- Write Playwright tests for keyboard navigation.

**Acceptance Criteria:**
- Zero axe-core violations on all pages.
- Full keyboard navigation works.
- Screen reader announces all dynamic content changes.

---

## Agent Guidelines

1. **Atomic Execution**: Focus on one ticket at a time.
2. **No Placeholders**: Write complete, functional code.
3. **Context Preservation**: Update `CHANGELOG.md` after each ticket with a summary.
4. **Design System**:
   - `shadcn/ui` for all base components (Dialog, Tabs, Select, Sheet, Form, etc.).
   - `lucide-react` for icons (bundled with shadcn/ui).
   - `zinc` palette (dark mode default) via CSS variables.
   - `rounded-xl` border radius set globally in shadcn/ui theme.
   - Mobile-first: design for `sm:` breakpoints first.
5. **File Organization**: Follow the folder structure defined in FE-001.
6. **Testing**: Every ticket includes unit tests. E2E tests for user-facing flows.
7. **Accessibility**: Every component must be keyboard-navigable with proper ARIA attributes.
8. **Performance**: Dynamic import heavy modules. No barrel imports. Watch bundle size.
9. **i18n**: All user-facing strings go through `next-intl`. No hardcoded English text.
