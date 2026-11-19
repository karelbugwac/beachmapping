BEGIN;

ALTER TABLE public.admin_audit_log
  ADD COLUMN IF NOT EXISTS reason_type TEXT;

ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_action_check,
  ADD CONSTRAINT admin_audit_log_action_check CHECK (
    action IN ('status_change', 'reason_edit', 'reset_password', 'reset_pin')
  ) NOT VALID;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_suspended_reason_check,
  ADD CONSTRAINT profiles_suspended_reason_check CHECK (
    account_status <> 'suspended' OR (
      status_reason IS NOT NULL
      AND char_length(normalize(status_reason, NFKC)) BETWEEN 10 AND 500
      AND public.is_safe_admin_text(status_reason)
      AND status_reason_type IN (
        'Violation of community guidelines',
        'Fake or misleading information',
        'Spam or abuse',
        'Suspected fraud',
        'Owner request',
        'Other'
      )
    )
  ) NOT VALID;

ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_suspended_reason_check,
  ADD CONSTRAINT admin_audit_log_suspended_reason_check CHECK (
    to_status <> 'suspended' OR (
      reason IS NOT NULL
      AND char_length(normalize(reason, NFKC)) BETWEEN 10 AND 500
      AND public.is_safe_admin_text(reason)
      AND reason_type IN (
        'Violation of community guidelines',
        'Fake or misleading information',
        'Spam or abuse',
        'Suspected fraud',
        'Owner request',
        'Other'
      )
    )
  ) NOT VALID;

ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_reason_type_check,
  ADD CONSTRAINT admin_audit_log_reason_type_check CHECK (
    reason_type IS NULL OR reason_type IN (
      'Violation of community guidelines',
      'Fake or misleading information',
      'Spam or abuse',
      'Suspected fraud',
      'Owner request',
      'Other'
    )
  ) NOT VALID;

CREATE TABLE IF NOT EXISTS public.admin_status_change_rate_limits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_status_change_rate_limits_admin_created
  ON public.admin_status_change_rate_limits (admin_id, created_at DESC);

ALTER TABLE public.admin_status_change_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_status_change_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_status_change_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_admin_status_change(p_admin_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  request_count INTEGER;
  oldest_request TIMESTAMPTZ;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_admin_id::TEXT, 8104));

  DELETE FROM public.admin_status_change_rate_limits
  WHERE created_at < now() - INTERVAL '1 day';

  SELECT COUNT(*)::INTEGER, MIN(created_at)
    INTO request_count, oldest_request
  FROM public.admin_status_change_rate_limits
  WHERE admin_id = p_admin_id
    AND created_at >= now() - INTERVAL '1 hour';

  IF request_count >= 30 THEN
    RETURN GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM (oldest_request + INTERVAL '1 hour' - now())))::INTEGER
    );
  END IF;

  INSERT INTO public.admin_status_change_rate_limits (admin_id) VALUES (p_admin_id);
  RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_admin_status_change(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_admin_status_change(UUID) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;