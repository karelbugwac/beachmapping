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
