UPDATE storage.buckets
SET file_size_limit = 21474836480
WHERE id = 'beach-media';

DROP POLICY IF EXISTS "Beach owners upload beach media" ON storage.objects;
CREATE POLICY "Beach owners upload beach media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'beach-media'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
    AND CASE
        WHEN (storage.foldername(name))[2] = 'general' THEN true
        WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            THEN public.owns_beach(((storage.foldername(name))[2])::uuid)
        ELSE false
    END
);
