CREATE TABLE IF NOT EXISTS public.beach_facility_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.beach_facilities(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT beach_facility_photos_facility_storage_path_key UNIQUE (facility_id, storage_path)
);

CREATE INDEX IF NOT EXISTS beach_facility_photos_facility_sort_idx
  ON public.beach_facility_photos (facility_id, sort_order, created_at);

ALTER TABLE public.beach_facility_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Facility photos are publicly readable" ON public.beach_facility_photos;
CREATE POLICY "Facility photos are publicly readable"
ON public.beach_facility_photos
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Beach owners can add facility photos" ON public.beach_facility_photos;
CREATE POLICY "Beach owners can add facility photos"
ON public.beach_facility_photos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.beach_facilities facility
    WHERE facility.id = facility_id
      AND public.owns_beach(facility.beach_id)
  )
);

DROP POLICY IF EXISTS "Beach owners can update facility photos" ON public.beach_facility_photos;
CREATE POLICY "Beach owners can update facility photos"
ON public.beach_facility_photos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.beach_facilities facility
    WHERE facility.id = facility_id
      AND public.owns_beach(facility.beach_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.beach_facilities facility
    WHERE facility.id = facility_id
      AND public.owns_beach(facility.beach_id)
  )
);

DROP POLICY IF EXISTS "Beach owners can delete facility photos" ON public.beach_facility_photos;
CREATE POLICY "Beach owners can delete facility photos"
ON public.beach_facility_photos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.beach_facilities facility
    WHERE facility.id = facility_id
      AND public.owns_beach(facility.beach_id)
  )
);

GRANT SELECT ON public.beach_facility_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.beach_facility_photos TO authenticated;

INSERT INTO public.beach_facility_photos (facility_id, image_url, storage_path, sort_order)
SELECT
  facility.id,
  facility.images[1],
  CASE
    WHEN facility.images[1] ~* '^https?://' THEN regexp_replace(
      facility.images[1],
      '^.*/storage/v1/object/(public|sign)/beach-media/',
      ''
    )
    ELSE regexp_replace(facility.images[1], '^/+', '')
  END,
  0
FROM public.beach_facilities facility
WHERE COALESCE(array_length(facility.images, 1), 0) > 0
  AND facility.images[1] IS NOT NULL
  AND facility.images[1] <> ''
ON CONFLICT (facility_id, storage_path) DO NOTHING;
