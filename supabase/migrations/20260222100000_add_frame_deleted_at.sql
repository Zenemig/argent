-- Add soft-delete column to frames for consistency with other entity tables.
-- Previously frames relied on cascade deletes from rolls, but the local
-- Dexie schema includes deleted_at which caused sync upload failures.
ALTER TABLE frames ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
