BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_applications_pending_email
  ON public.owner_applications (lower(trim(applicant_email)))
  WHERE status = 'pending';

COMMIT;
