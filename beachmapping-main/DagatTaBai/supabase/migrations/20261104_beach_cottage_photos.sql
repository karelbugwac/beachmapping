CREATE TABLE IF NOT EXISTS public.beach_cottage_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cottage_id uuid NOT NULL REFERENCES public.beach_cottages(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT beach_cottage_photos_cottage_storage_path_key UNIQUE (cottage_id, storage_path)
);

CREATE INDEX IF NOT EXISTS beach_cottage_photos_cottage_sort_idx
  ON public.beach_cottage_photos (cottage_id, sort_order, created_at);

ALTER TABLE public.beach_cottage_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cottage photos are publicly readable" ON public.beach_cottage_photos;
CREATE POLICY "Cottage photos are publicly readable"
ON public.beach_cottage_photos
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Beach owners can add cottage photos" ON public.beach_cottage_photos;
CREATE POLICY "Beach owners can add cottage photos"
ON public.beach_cottage_photos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.beach_cottages cottage
    WHERE cottage.id = cottage_id
      AND public.owns_beach(cottage.beach_id)
  )
);

DROP POLICY IF EXISTS "Beach owners can update cottage photos" ON public.beach_cottage_photos;
CREATE POLICY "Beach owners can update cottage photos"
ON public.beach_cottage_photos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.beach_cottages cottage
    WHERE cottage.id = cottage_id
      AND public.owns_beach(cottage.beach_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.beach_cottages cottage
    WHERE cottage.id = cottage_id
      AND public.owns_beach(cottage.beach_id)
  )
);

DROP POLICY IF EXISTS "Beach owners can delete cottage photos" ON public.beach_cottage_photos;
CREATE POLICY "Beach owners can delete cottage photos"
ON public.beach_cottage_photos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.beach_cottages cottage
    WHERE cottage.id = cottage_id
      AND public.owns_beach(cottage.beach_id)
  )
);

GRANT SELECT ON public.beach_cottage_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.beach_cottage_photos TO authenticated;

INSERT INTO public.beach_cottage_photos (cottage_id, image_url, storage_path, sort_order)
SELECT
  cottage.id,
  cottage.images[1],
  CASE
    WHEN cottage.images[1] ~* '^https?://' THEN regexp_replace(
      cottage.images[1],
      '^.*/storage/v1/object/(public|sign)/beach-media/',
      ''
    )
    ELSE regexp_replace(cottage.images[1], '^/+', '')
  END,
  0
FROM public.beach_cottages cottage
WHERE COALESCE(array_length(cottage.images, 1), 0) > 0
  AND cottage.images[1] IS NOT NULL
  AND cottage.images[1] <> ''
ON CONFLICT (cottage_id, storage_path) DO NOTHING;
