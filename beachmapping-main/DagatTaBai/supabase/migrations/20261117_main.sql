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

COMMIT;BEGIN;

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
    AND normalize(candidate, NFKC) !~ U&'[\00AD\034F\0600-\0605\061C\06DD\070F\0890-\0891\08E2\115F\1160\17B4\17B5\180B-\180F\200B-\200F\202A-\202E\2060-\206F\FE00-\FE0F\FEFF\FFF9-\FFFB\+0110BD\+0110CD\+013430-\+01343F\+01BCA0-\+01BCA3\+01D173-\+01D17A\+0E0001\+0E0020-\+0E007F]'
    AND normalize(candidate, NFKC) !~ '--|/\*|\*/|\$\{'
  );
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
BEGIN;

CREATE OR REPLACE FUNCTION public.is_safe_admin_text(candidate TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT candidate IS NULL OR (
    char_length(normalize(candidate, NFKC)) <= 500
    AND normalize(candidate, NFKC) !~ '[[:cntrl:]]'
    AND normalize(candidate, NFKC) ~ '^[[:alpha:][:digit:][:space:].,:!?''"()+@#&/-]*$'
    AND normalize(candidate, NFKC) !~ '--|/\*|\*/|\$\{'
  );
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
BEGIN;

ALTER TABLE public.owner_applications
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_note TEXT,
  ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;

UPDATE public.owner_applications
SET status_updated_at = COALESCE(status_updated_at, reviewed_at, updated_at, created_at)
WHERE status_updated_at IS NULL;

ALTER TABLE public.owner_applications
  ALTER COLUMN status_updated_at SET DEFAULT now(),
  ALTER COLUMN status_updated_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_owner_applications_applicant_created
  ON public.owner_applications (applicant_user_id, created_at DESC);

ALTER TABLE public.owner_applications
  DROP CONSTRAINT IF EXISTS owner_applications_status_check,
  DROP CONSTRAINT IF EXISTS owner_applications_status_check1;

ALTER TABLE public.owner_applications
  ADD CONSTRAINT owner_applications_status_check
  CHECK (status IN ('draft', 'pending', 'under_review', 'needs_changes', 'approved', 'rejected'));

ALTER TABLE public.email_notifications
  DROP CONSTRAINT IF EXISTS email_notifications_notification_type_check;

ALTER TABLE public.email_notifications
  ADD CONSTRAINT email_notifications_notification_type_check
  CHECK (notification_type IN (
    'application_received',
    'application_approved',
    'application_rejected',
    'application_needs_changes'
  ));

CREATE OR REPLACE FUNCTION public.queue_application_status_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    INSERT INTO public.email_notifications (
      recipient_email, recipient_name, notification_type, application_id, subject, message
    )
    VALUES (
      NEW.applicant_email, NEW.applicant_full_name, 'application_approved', NEW.id,
      'Dagat Ta Bai - Application Approved',
      'Your beach owner application has been approved. You may now access your beach portal.'
    );
  ELSIF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected' THEN
    INSERT INTO public.email_notifications (
      recipient_email, recipient_name, notification_type, application_id, subject, message
    )
    VALUES (
      NEW.applicant_email, NEW.applicant_full_name, 'application_rejected', NEW.id,
      'Dagat Ta Bai - Application Update',
      COALESCE(
        'Your beach owner application was not approved. Reason: ' || NEW.rejection_reason,
        'Your beach owner application was not approved.'
      )
    );
  ELSIF NEW.status = 'needs_changes' AND OLD.status IS DISTINCT FROM 'needs_changes' THEN
    INSERT INTO public.email_notifications (
      recipient_email, recipient_name, notification_type, application_id, subject, message
    )
    VALUES (
      NEW.applicant_email, NEW.applicant_full_name, 'application_needs_changes', NEW.id,
      'Dagat Ta Bai - Changes Requested',
      'Please review the changes requested for your beach owner application: '
        || COALESCE(NEW.status_note, 'Please sign in to view your application update.')
    );
  ELSIF NEW.status = 'pending' AND OLD.status = 'needs_changes' THEN
    INSERT INTO public.email_notifications (
      recipient_email, recipient_name, notification_type, application_id, subject, message
    )
    VALUES (
      NEW.applicant_email, NEW.applicant_full_name, 'application_received', NEW.id,
      'Dagat Ta Bai - Application Resubmitted',
      'Your updated beach owner application has been received and is back in review.'
    );
  END IF;
  RETURN NEW;
END;
$$;

UPDATE public.owner_applications
SET decided_at = COALESCE(decided_at, reviewed_at, updated_at)
WHERE status IN ('approved', 'rejected') AND decided_at IS NULL;

CREATE TABLE IF NOT EXISTS public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.owner_applications(id) ON DELETE CASCADE,
  from_status TEXT CHECK (from_status IS NULL OR from_status IN ('draft', 'pending', 'under_review', 'needs_changes', 'approved', 'rejected')),
  to_status TEXT NOT NULL CHECK (to_status IN ('draft', 'pending', 'under_review', 'needs_changes', 'approved', 'rejected')),
  note TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_status_history_application_created
  ON public.application_status_history (application_id, created_at);

INSERT INTO public.application_status_history (application_id, from_status, to_status, note, changed_by, created_at)
SELECT id, NULL, status, COALESCE(status_note, rejection_reason), reviewed_by, COALESCE(status_updated_at, updated_at, created_at)
FROM public.owner_applications
WHERE NOT EXISTS (
  SELECT 1 FROM public.application_status_history history
  WHERE history.application_id = owner_applications.id
);

CREATE OR REPLACE FUNCTION public.record_owner_application_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.application_status_history (
      application_id, from_status, to_status, note, changed_by, created_at
    )
    VALUES (
      NEW.id,
      NULL,
      NEW.status,
      COALESCE(NEW.status_note, NEW.rejection_reason),
      COALESCE(NEW.reviewed_by, NEW.applicant_user_id, auth.uid()),
      COALESCE(NEW.status_updated_at, now())
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.application_status_history (
      application_id, from_status, to_status, note, changed_by, created_at
    )
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.status_note, NEW.rejection_reason),
      COALESCE(NEW.reviewed_by, NEW.applicant_user_id, auth.uid()),
      COALESCE(NEW.status_updated_at, now())
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS owner_application_status_history_trigger ON public.owner_applications;
CREATE TRIGGER owner_application_status_history_trigger
AFTER INSERT OR UPDATE OF status ON public.owner_applications
FOR EACH ROW EXECUTE FUNCTION public.record_owner_application_status_history();

ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.application_status_history FROM anon, authenticated;
GRANT SELECT ON public.application_status_history TO authenticated;
GRANT ALL ON public.application_status_history TO service_role;

DROP POLICY IF EXISTS "Applicants can read own application status history" ON public.application_status_history;
CREATE POLICY "Applicants can read own application status history"
ON public.application_status_history
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.owner_applications application
    WHERE application.id = application_id
      AND application.applicant_user_id = auth.uid()
  )
  OR public.is_admin()
);

GRANT SELECT ON public.owner_applications TO authenticated;

COMMIT;
