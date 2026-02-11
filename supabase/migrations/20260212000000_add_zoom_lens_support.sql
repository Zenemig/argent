-- Add zoom lens support: focal_length_max and min_aperture for lenses,
-- per-frame focal_length for frames (zoom lens shots).
-- All nullable: existing primes keep NULL values.

ALTER TABLE lenses ADD COLUMN IF NOT EXISTS focal_length_max real;
ALTER TABLE lenses ADD COLUMN IF NOT EXISTS min_aperture real;
ALTER TABLE frames ADD COLUMN IF NOT EXISTS focal_length real;
