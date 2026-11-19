BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_reason_type TEXT,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pin_reset_required BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check,
  ADD CONSTRAINT profiles_account_status_check
    CHECK (account_status IN ('active', 'under_review', 'suspended'));

UPDATE public.profiles
SET account_status = CASE
      WHEN status = 'suspended' AND (suspension_ends_at IS NULL OR suspension_ends_at > now())
        THEN 'suspended'
      ELSE 'active'
    END,
    status_reason = CASE
      WHEN status = 'suspended' AND (suspension_ends_at IS NULL OR suspension_ends_at > now())
        THEN suspension_reason
      ELSE NULL
    END,
    suspended_until = CASE
      WHEN status = 'suspended' AND (suspension_ends_at IS NULL OR suspension_ends_at > now())
        THEN suspension_ends_at
      ELSE NULL
    END,
    status_changed_at = COALESCE(suspended_at, updated_at)
WHERE account_status = 'active'
  AND status = 'suspended';

CREATE OR REPLACE FUNCTION public.is_safe_admin_text(candidate TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT candidate IS NULL OR (
    char_length(normalize(candidate, NFKC)) <= 500
    AND normalize(candidate, NFKC) !~ '[=<>;`{}$|^~*%]'
    AND position('[' in normalize(candidate, NFKC)) = 0
    AND position(']' in normalize(candidate, NFKC)) = 0
    AND position(chr(92) in normalize(candidate, NFKC)) = 0
    AND normalize(candidate, NFKC) !~ '[[:cntrl:]]'
    AND normalize(candidate, NFKC) !~ U&'[\200B-\200F\202A-\202E\2060-\206F\FE00-\FE0F\FEFF]'
    AND normalize(candidate, NFKC) !~ '--|/\*|\*/|\$\{'
  );
$$;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_reason_safe_check,
  ADD CONSTRAINT profiles_status_reason_safe_check
    CHECK (public.is_safe_admin_text(status_reason)),
  DROP CONSTRAINT IF EXISTS profiles_status_reason_type_check,
  ADD CONSTRAINT profiles_status_reason_type_check
    CHECK (
      status_reason_type IS NULL OR status_reason_type IN (
        'Violation of community guidelines',
        'Fake or misleading information',
        'Spam or abuse',
        'Suspected fraud',
        'Owner request',
        'Other'
      )
    );

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('status_change', 'reset_password', 'reset_pin')),
  from_status TEXT CHECK (from_status IS NULL OR from_status IN ('active', 'under_review', 'suspended')),
  to_status TEXT CHECK (to_status IS NULL OR to_status IN ('active', 'under_review', 'suspended')),
  reason TEXT CHECK (public.is_safe_admin_text(reason)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_created
  ON public.admin_audit_log (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_created
  ON public.admin_audit_log (admin_id, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

DROP POLICY IF EXISTS "Admins can read account audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can read account audit log"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.prevent_account_admin_field_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin()
     AND (
       NEW.role IS DISTINCT FROM OLD.role OR
       NEW.account_status IS DISTINCT FROM OLD.account_status OR
       NEW.status_reason IS DISTINCT FROM OLD.status_reason OR
       NEW.status_reason_type IS DISTINCT FROM OLD.status_reason_type OR
       NEW.suspended_until IS DISTINCT FROM OLD.suspended_until OR
       NEW.status_changed_by IS DISTINCT FROM OLD.status_changed_by OR
       NEW.status_changed_at IS DISTINCT FROM OLD.status_changed_at OR
       NEW.pin_reset_required IS DISTINCT FROM OLD.pin_reset_required
     ) THEN
    RAISE EXCEPTION 'Only administrators can change account controls'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_account_admin_field_changes ON public.profiles;
CREATE TRIGGER prevent_account_admin_field_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_account_admin_field_changes();

ALTER TABLE public.user_notifications
  DROP CONSTRAINT IF EXISTS user_notifications_type_check,
  ADD CONSTRAINT user_notifications_type_check
    CHECK (type IN ('new_device_login', 'tour_status', 'account_status', 'pin_reset'));

GRANT ALL ON public.admin_audit_log TO service_role;

CREATE TABLE IF NOT EXISTS public.admin_reset_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_reset_rate_limits_admin_created
  ON public.admin_reset_rate_limits (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_reset_rate_limits_target_created
  ON public.admin_reset_rate_limits (target_user_id, created_at DESC);
ALTER TABLE public.admin_reset_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_reset_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_reset_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_admin_reset_rate_limit(
  p_admin_id UUID,
  p_target_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_count INTEGER;
  target_oldest TIMESTAMPTZ;
  admin_count INTEGER;
  admin_oldest TIMESTAMPTZ;
  retry_after INTEGER := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_admin_id::TEXT, 8102));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_target_user_id::TEXT, 8103));

  DELETE FROM public.admin_reset_rate_limits
  WHERE created_at < now() - INTERVAL '1 day';

  SELECT COUNT(*)::INTEGER, MIN(created_at)
    INTO target_count, target_oldest
  FROM public.admin_reset_rate_limits
  WHERE target_user_id = p_target_user_id
    AND created_at >= now() - INTERVAL '10 minutes';

  SELECT COUNT(*)::INTEGER, MIN(created_at)
    INTO admin_count, admin_oldest
  FROM public.admin_reset_rate_limits
  WHERE admin_id = p_admin_id
    AND created_at >= now() - INTERVAL '1 hour';

  IF target_count >= 1 THEN
    retry_after := GREATEST(
      retry_after,
      CEIL(EXTRACT(EPOCH FROM (target_oldest + INTERVAL '10 minutes' - now())))::INTEGER
    );
  END IF;
  IF admin_count >= 20 THEN
    retry_after := GREATEST(
      retry_after,
      CEIL(EXTRACT(EPOCH FROM (admin_oldest + INTERVAL '1 hour' - now())))::INTEGER
    );
  END IF;
  IF retry_after > 0 THEN
    RETURN retry_after;
  END IF;

  INSERT INTO public.admin_reset_rate_limits (admin_id, target_user_id)
  VALUES (p_admin_id, p_target_user_id);
  RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_admin_reset_rate_limit(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_admin_reset_rate_limit(UUID, UUID) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
