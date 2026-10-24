-- Fixes admin/owner/staff PIN login failing with:
--   "column profiles.pin does not exist"
-- The `pin` column was defined in the original dagattabai.sql schema but is
-- missing from the live database. This migration adds it back safely.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pin TEXT;
