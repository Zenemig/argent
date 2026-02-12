-- Add mount/type columns to cameras and lenses (Dexie v5),
-- and gear constraint fields (Dexie v6):
--   cameras: shutter_speed_min/max, has_bulb, metering_modes
--   lenses: aperture_min
-- All nullable — existing rows keep NULL values.

-- Cameras: mount and type (added in Dexie v5, missing from Supabase)
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS mount text;
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS type text;

-- Cameras: gear constraint fields (Dexie v6)
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS shutter_speed_min text;
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS shutter_speed_max text;
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS has_bulb boolean;
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS metering_modes text[];

-- Lenses: mount (added in Dexie v5, missing from Supabase)
ALTER TABLE lenses ADD COLUMN IF NOT EXISTS mount text;

-- Lenses: aperture_min constraint field (Dexie v6)
ALTER TABLE lenses ADD COLUMN IF NOT EXISTS aperture_min real;
