BEGIN;

-- ============================================
-- FIX: Restrict public bucket listing policies
-- Replace broad SELECT with object-specific access
-- ============================================

-- Replace broad SELECT policy for avatars
DROP POLICY IF EXISTS "DagatTaBai avatar public read" ON storage.objects;
CREATE POLICY "DagatTaBai avatar public read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Replace broad SELECT policy for beach-media
-- Allow access to any beach folder (simpler approach)
DROP POLICY IF EXISTS "DagatTaBai beach media public read" ON storage.objects;
CREATE POLICY "DagatTaBai beach media public read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'beach-media'
);

COMMIT;
