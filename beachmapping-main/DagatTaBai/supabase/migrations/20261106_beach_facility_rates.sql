ALTER TABLE public.beach_facilities
  ADD COLUMN IF NOT EXISTS rates JSONB NOT NULL DEFAULT '[]'::jsonb;