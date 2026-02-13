<p align="center">
  <img src="public/icons/icon-512.png" alt="Argent" width="120" height="120" />
</p>

<h1 align="center">Argent</h1>

<p align="center">
  <strong>The offline-first field notebook for analogue photographers.</strong><br />
  Log shots, manage your gear &amp; film inventory, and export metadata to your digital scans.
</p>

<p align="center">
  <a href="https://github.com/Zenemig/argent/actions"><img src="https://github.com/Zenemig/argent/actions/workflows/test.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/Zenemig/argent/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

---

## Why Argent?

Shooting film means losing the automatic metadata that digital cameras embed. Argent bridges that gap: log every shot in the field, then export XMP sidecars or ExifTool scripts to embed shutter speed, aperture, lens, GPS, and notes directly into your scans -- as if your film camera wrote EXIF data all along.

Everything works **fully offline** as a Progressive Web App. Install it on your phone, take it into the field, and sync later if you want to.

## Features

- **Shot Logger** -- Record frame-by-frame metadata: shutter speed, aperture, lens, GPS coordinates, notes. Smart defaults from your camera's capabilities.
- **Gear Bag** -- Manage cameras, lenses, and custom film stocks. Gear constraints filter dropdowns automatically (e.g., only lenses that fit your camera's mount).
- **Film Catalog** -- ~990 film stocks built in. Add custom stocks for discontinued or hand-rolled film.
- **Roll Lifecycle** -- Track rolls through: loaded, active, finished, developed, scanned, archived.
- **Export to Scans** -- Generate XMP sidecars (Lightroom/Capture One compatible), ExifTool CSV, ExifTool shell scripts, or JSON backups.
- **Offline-First PWA** -- Works without internet. Install on any device. Data lives in IndexedDB.
- **Cloud Sync (Pro)** -- Optional Supabase-powered sync across devices with image backup.
- **Bilingual** -- English and Spanish (i18n-ready for more).
- **Statistics** -- Visualize your shooting habits: favorite stocks, cameras, focal lengths.
- **Accessible** -- WCAG 2.1 AA compliant. Keyboard navigable. Screen reader friendly.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Local Database | [Dexie.js](https://dexie.org/) (IndexedDB) |
| Cloud Backend | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage) |
| PWA | [Serwist](https://serwist.pages.dev/) |
| i18n | [next-intl](https://next-intl.dev/) |
| Validation | [Zod 4](https://zod.dev/) |
| Testing | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) |
| Deployment | [Vercel](https://vercel.com/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm 10+
- A [Supabase](https://supabase.com/) project (free tier works -- only needed for auth/sync features)

### Setup

```bash
# Clone the repository
git clone https://github.com/Zenemig/argent.git
cd argent

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```bash
# .env.local

# Supabase (required for auth & cloud sync; app works offline without these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# E2E test credentials (optional, for running Playwright tests)
E2E_USER_EMAIL=test@example.com
E2E_USER_PASSWORD=testpassword123
```

### Supabase Setup

1. Create a [Supabase project](https://supabase.com/dashboard).
2. Copy the project URL and anon key into `.env.local`.
3. Run the database migrations:

```bash
npx supabase db push
```

4. Enable **Email** and/or **Google** auth providers in the Supabase dashboard.

> **Note:** The app works fully offline without Supabase. Auth and cloud sync are optional features.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict check |
| `npm test` | Unit tests (Vitest) |
| `npm test -- path/to/file.test.ts` | Run a single test file |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run test:e2e -- --headed` | E2E with visible browser |

## Project Structure

```
app/[locale]/(marketing)/     Landing page (SEO-optimized locale routing)
app/(app)/                    App dashboard (clean URLs: /gear, /roll/abc, /stats)
app/(auth)/login/             Authentication
components/                   Domain components (shot-logger, roll-card, etc.)
components/ui/                shadcn/ui primitives
lib/db.ts                     Dexie.js database schema
lib/schemas.ts                Zod schemas (single source of truth)
lib/types.ts                  TypeScript interfaces
lib/constants.ts              Enums & constants
lib/exporters/                XMP, CSV, ExifTool, JSON exporters
lib/supabase/                 Supabase client (browser + server)
hooks/                        Custom React hooks
messages/                     i18n translations (en, es)
supabase/migrations/          SQL migrations
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

**Quick version:**

1. Find or create a [GitHub issue](https://github.com/Zenemig/argent/issues).
2. Fork the repo and create a branch: `feat/your-feature` or `fix/your-bug`.
3. Follow TDD: write tests first, then implement.
4. Make sure CI passes: `npm run typecheck && npm run lint && npm test`.
5. Open a PR against `main` and reference the issue.

## Export Formats

Argent can export your roll data in multiple formats for embedding metadata into scanned images:

| Format | Use Case |
|--------|----------|
| **XMP Sidecar** | Drop alongside scans for Lightroom Classic / Capture One |
| **ExifTool CSV** | Batch embed via `exiftool -csv=export.csv` |
| **ExifTool Script** | Shell script with one `exiftool` command per frame |
| **JSON** | Full data backup for portability |

## User Tiers

| Tier | Features | Auth |
|------|----------|------|
| **Free** | Full app, local storage only | Email / Google |
| **Pro** | Cloud sync + image backup | Invitation-based (MVP) |

## Roadmap

See the [open issues](https://github.com/Zenemig/argent/issues) for planned features and known bugs.

## License

Argent is licensed under the [GNU Affero General Public License v3.0](LICENSE).

You are free to use, modify, and distribute this software. If you run a modified version as a network service, you must make the source code available to users of that service.

## Acknowledgments

- Film stock data sourced from community-maintained databases
- Built with the incredible open-source ecosystem: Next.js, Supabase, Dexie.js, shadcn/ui, and many more
- Inspired by the analogue photography community

---

<p align="center">
  Made with 🩶 and 🎞️ by <a href="https://github.com/Zenemig">@Zenemig</a>
</p>
