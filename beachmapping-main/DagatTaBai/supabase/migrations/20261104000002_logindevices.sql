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
