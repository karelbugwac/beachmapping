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
BEGIN;

CREATE TABLE IF NOT EXISTS public.login_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL,
  browser TEXT NOT NULL,
  platform TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_device_id UUID NOT NULL REFERENCES public.login_devices(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_device_login')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  response TEXT CHECK (response IN ('confirmed', 'unrecognized')),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_owner_created
  ON public.user_notifications (user_id, created_at DESC);

ALTER TABLE public.login_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.login_devices, public.user_notifications FROM anon, authenticated;
GRANT SELECT ON public.login_devices, public.user_notifications TO authenticated;
GRANT UPDATE (read_at, response, responded_at) ON public.user_notifications TO authenticated;
GRANT ALL ON public.login_devices, public.user_notifications TO service_role;

DROP POLICY IF EXISTS "Users can view their login devices" ON public.login_devices;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.user_notifications;

CREATE POLICY "Users can view their login devices"
  ON public.login_devices FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their notifications"
  ON public.user_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
  ON public.user_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.register_login_device(
  p_device_id UUID,
  p_browser TEXT,
  p_platform TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_known_device_count INTEGER;
  v_device_id UUID;
  v_is_new BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to register a login device.';
  END IF;

  PERFORM 1
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  SELECT count(*) INTO v_known_device_count
  FROM public.login_devices
  WHERE user_id = v_user_id;

  INSERT INTO public.login_devices (user_id, device_id, browser, platform)
  VALUES (v_user_id, p_device_id, p_browser, p_platform)
  ON CONFLICT (user_id, device_id) DO NOTHING
  RETURNING id INTO v_device_id;

  v_is_new := FOUND;

  IF v_is_new THEN
    IF v_known_device_count > 0 THEN
      INSERT INTO public.user_notifications (user_id, login_device_id, type)
      VALUES (v_user_id, v_device_id, 'new_device_login');
    END IF;
  ELSE
    UPDATE public.login_devices
    SET browser = p_browser,
        platform = p_platform,
        last_seen_at = now()
    WHERE user_id = v_user_id
      AND device_id = p_device_id;
  END IF;

  RETURN v_is_new;
END;
$$;

REVOKE ALL ON FUNCTION public.register_login_device(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_login_device(UUID, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
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
