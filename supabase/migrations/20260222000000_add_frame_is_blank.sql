-- Add is_blank flag for skipped/blank frames
ALTER TABLE frames ADD COLUMN IF NOT EXISTS is_blank boolean DEFAULT false;
