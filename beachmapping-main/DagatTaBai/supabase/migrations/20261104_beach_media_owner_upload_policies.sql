INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'beach-media',
  'beach-media',
  true,
  21474836480,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 21474836480,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "DagatTaBai beach media public read" ON storage.objects;
CREATE POLICY "DagatTaBai beach media public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'beach-media');

DROP POLICY IF EXISTS "DagatTaBai beach media owner insert" ON storage.objects;
CREATE POLICY "DagatTaBai beach media owner insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'beach-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND CASE
    WHEN (storage.foldername(name))[2] = 'general' THEN true
    WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.owns_beach(((storage.foldername(name))[2])::uuid)
    ELSE false
  END
);

DROP POLICY IF EXISTS "DagatTaBai beach media owner update" ON storage.objects;
CREATE POLICY "DagatTaBai beach media owner update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'beach-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND CASE
    WHEN (storage.foldername(name))[2] = 'general' THEN true
    WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.owns_beach(((storage.foldername(name))[2])::uuid)
    ELSE false
  END
)
WITH CHECK (
  bucket_id = 'beach-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND CASE
    WHEN (storage.foldername(name))[2] = 'general' THEN true
    WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.owns_beach(((storage.foldername(name))[2])::uuid)
    ELSE false
  END
);

DROP POLICY IF EXISTS "DagatTaBai beach media owner delete" ON storage.objects;
CREATE POLICY "DagatTaBai beach media owner delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'beach-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND CASE
    WHEN (storage.foldername(name))[2] = 'general' THEN true
    WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN public.owns_beach(((storage.foldername(name))[2])::uuid)
    ELSE false
  END
);
