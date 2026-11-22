UPDATE public.beach_facilities
SET category = 'comfort_room'
WHERE category = 'amenity';ALTER TABLE public.beach_facilities
  ADD COLUMN IF NOT EXISTS rates JSONB NOT NULL DEFAULT '[]'::jsonb;