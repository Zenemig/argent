---
paths:
  - "hooks/useSync*"
  - "lib/sync*"
  - "lib/db*"
---

# Sync Engine Rules

## Architecture

```
[React UI] <-> [useLiveQuery] <-> [Dexie.js / IndexedDB]
                                        |
                                   [Sync Engine]
                                   /           \
                          [Upload Sync]    [Download Sync]
                          (retry queue)    (catch-up query)
                                   \           /
                                    [Supabase]
```

## Write Path (Local-First)

All mutations go through `syncWrite()`:
1. Write to Dexie immediately (user sees instant result)
2. Add entry to `_syncQueue` table
3. If online and Pro tier, attempt immediate sync

Never write to Supabase directly from UI. Dexie is always the source of truth locally.

## Upload Sync

- Process `_syncQueue` FIFO, grouped by entity table
- Batch upsert: 200 rows/batch via `.upsert()` with `onConflict: 'id'`
- On success: remove from queue, update `_syncMeta.lastUploadSync`
- On failure: increment `retry_count`, exponential backoff (1s, 2s, 4s... cap at 60s)
- After 5 consecutive failures: mark entry as `failed`
- Connectivity: `navigator.onLine` + `online`/`offline` events

## Download Sync

- On app start or manual trigger: query rows where `updated_at > lastDownloadSync`
- Bulk put into Dexie
- Conflict resolution: **Server wins** (LWW with server-assigned timestamps)
- Full resync: if `_syncMeta` empty (fresh install or cleared), download all user data

## Feature Gating

- Sync only runs for Pro users (`useUserTier().isProUser`)
- Free users: `syncWrite()` still queues locally but never uploads
- Guest users: no queue entries created
- Status indicator: green (synced), yellow (syncing), gray (offline), red (errors)

## iOS Considerations

- No Background Sync API — process queue on app foreground (`visibilitychange` event)
- Request `navigator.storage.persist()` on first app start
- Store sync metadata in Dexie `_syncMeta`, never in localStorage (subject to eviction)
