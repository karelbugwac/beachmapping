BEGIN;

CREATE INDEX IF NOT EXISTS idx_owner_applications_pending_applicant
  ON public.owner_applications (applicant_user_id)
  WHERE applicant_user_id IS NOT NULL AND status = 'pending';

CREATE OR REPLACE FUNCTION public.prevent_duplicate_pending_owner_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.applicant_user_id IS NULL OR NEW.status IS DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.applicant_user_id::text, 0));

  IF EXISTS (
    SELECT 1
    FROM public.owner_applications existing
    WHERE existing.applicant_user_id = NEW.applicant_user_id
      AND existing.status = 'pending'
      AND existing.id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'A pending owner application already exists.'
      USING ERRCODE = '23505',
            CONSTRAINT = 'owner_applications_one_pending_per_applicant';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_duplicate_pending_owner_application_trigger
  ON public.owner_applications;
CREATE TRIGGER prevent_duplicate_pending_owner_application_trigger
BEFORE INSERT OR UPDATE OF applicant_user_id, status
ON public.owner_applications
FOR EACH ROW
EXECUTE FUNCTION public.prevent_duplicate_pending_owner_application();

COMMIT;
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_applications_pending_email
  ON public.owner_applications (lower(trim(applicant_email)))
  WHERE status = 'pending';

COMMIT;
BEGIN;

ALTER TABLE public.owner_liveness_sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_owner_liveness_user_created
  ON public.owner_liveness_sessions(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

COMMIT;
