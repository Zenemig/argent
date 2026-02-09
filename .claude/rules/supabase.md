---
paths:
  - "lib/supabase/**"
  - "supabase/**"
  - "app/**/actions.ts"
---

# Supabase Rules

## Client Setup

Browser client (`lib/supabase/client.ts`):
```ts
import { createBrowserClient } from '@supabase/ssr'
```

Server client (`lib/supabase/server.ts`):
```ts
import { createServerClient } from '@supabase/ssr'
// Uses cookies() from next/headers
// Only getAll() and setAll() — never individual get/set/remove
```

## Auth

- Server-side: always `supabase.auth.getUser()` to validate JWT. Never `getSession()`.
- Middleware refreshes auth tokens via Supabase client.
- Auto-create `user_profiles` row on signup via Postgres trigger.
- Guest mode: app works fully without auth. Auth is optional for sync.

## Database

- RLS enabled on every table. Policy: `user_id = auth.uid()`.
- All timestamps as `timestamptz`.
- `updated_at` auto-managed by `moddatetime` trigger.
- Partial indexes on `WHERE deleted_at IS NULL` for active record queries.
- Never modify existing migration files. Always create new ones.
- Migration naming: `YYYYMMDDHHMMSS_description.sql`.

## Storage

- Bucket: `reference-images` with per-user path RLS.
- Path pattern: `{user_id}/{roll_id}/{frame_id}.jpg`.
- Users can only access their own `{user_id}/` prefix.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      -- Project URL (safe for client)
NEXT_PUBLIC_SUPABASE_ANON_KEY -- Anon key (safe for client)
SUPABASE_SERVICE_ROLE_KEY     -- Secret (server-only, never expose to client)
```
