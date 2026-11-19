UPDATE storage.buckets
SET
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg']
WHERE id = 'beach-media';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/webp']
WHERE id = 'owner-application-documents';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  512000,
  ARRAY['image/webp', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "DagatTaBai avatar public read" ON storage.objects;
CREATE POLICY "DagatTaBai avatar public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "DagatTaBai users manage own avatar" ON storage.objects;
CREATE POLICY "DagatTaBai users manage own avatar"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name IN (
    auth.uid()::text || '/avatar.webp',
    auth.uid()::text || '/avatar.jpg'
  )
)
WITH CHECK (
  bucket_id = 'avatars'
  AND name IN (
    auth.uid()::text || '/avatar.webp',
    auth.uid()::text || '/avatar.jpg'
  )
);

CREATE OR REPLACE FUNCTION public.enforce_cottage_photo_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_count INTEGER;
BEGIN
  PERFORM 1
  FROM public.beach_cottages
  WHERE id = NEW.cottage_id
  FOR UPDATE;

  SELECT COUNT(*) INTO photo_count
  FROM public.beach_cottage_photos
  WHERE cottage_id = NEW.cottage_id;

  IF photo_count >= 10 THEN
    RAISE EXCEPTION 'A cottage can have up to 10 photos.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS beach_cottage_photos_limit ON public.beach_cottage_photos;
CREATE TRIGGER beach_cottage_photos_limit
BEFORE INSERT OR UPDATE OF cottage_id ON public.beach_cottage_photos
FOR EACH ROW
EXECUTE FUNCTION public.enforce_cottage_photo_limit();

CREATE OR REPLACE FUNCTION public.enforce_facility_photo_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_count INTEGER;
BEGIN
  PERFORM 1
  FROM public.beach_facilities
  WHERE id = NEW.facility_id
  FOR UPDATE;

  SELECT COUNT(*) INTO photo_count
  FROM public.beach_facility_photos
  WHERE facility_id = NEW.facility_id;

  IF photo_count >= 10 THEN
    RAISE EXCEPTION 'A facility can have up to 10 photos.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS beach_facility_photos_limit ON public.beach_facility_photos;
CREATE TRIGGER beach_facility_photos_limit
BEFORE INSERT OR UPDATE OF facility_id ON public.beach_facility_photos
FOR EACH ROW
EXECUTE FUNCTION public.enforce_facility_photo_limit();
