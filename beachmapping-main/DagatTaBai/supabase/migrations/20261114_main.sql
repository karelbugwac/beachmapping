BEGIN;

ALTER TABLE public.beach_tour_requests
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_note TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.beach_tour_requests'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.beach_tour_requests DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END;
$$;

CREATE TABLE IF NOT EXISTS public.beach_tour_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES public.beach_tour_requests(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT beach_tour_status_history_from_check
    CHECK (from_status IS NULL OR from_status IN ('in_progress', 'review', 'approved')),
  CONSTRAINT beach_tour_status_history_to_check
    CHECK (to_status IN ('in_progress', 'review', 'approved'))
);

CREATE INDEX IF NOT EXISTS idx_beach_tour_status_history_tour_created
  ON public.beach_tour_status_history (tour_id, created_at);

INSERT INTO public.beach_tour_status_history (tour_id, from_status, to_status, note, changed_by, created_at)
SELECT id,
  CASE
    WHEN status = 'approved' THEN 'review'
    WHEN status = 'rejected' THEN 'review'
    WHEN status = 'pending' THEN 'in_progress'
    ELSE NULL
  END,
  CASE
    WHEN status = 'pending' THEN 'review'
    WHEN status = 'rejected' THEN 'in_progress'
    WHEN status = 'approved' THEN 'approved'
    ELSE 'in_progress'
  END,
  CASE
    WHEN status = 'rejected' THEN rejection_reason
    WHEN status NOT IN ('pending', 'approved', 'rejected') THEN 'Previous status: ' || status
    ELSE NULL
  END,
  reviewed_by,
  COALESCE(reviewed_at, updated_at, created_at)
FROM public.beach_tour_requests
WHERE NOT EXISTS (
    SELECT 1
    FROM public.beach_tour_status_history h
    WHERE h.tour_id = beach_tour_requests.id
  );

UPDATE public.beach_tour_requests
SET status = CASE status
    WHEN 'pending' THEN 'review'
    WHEN 'rejected' THEN 'in_progress'
    WHEN 'approved' THEN 'approved'
    ELSE 'in_progress'
  END,
  status_note = CASE
    WHEN status = 'rejected' THEN COALESCE(rejection_reason, status_note)
    WHEN status NOT IN ('pending', 'approved', 'rejected')
      THEN COALESCE(status_note, 'Previous status: ' || status)
    ELSE status_note
  END,
  status_updated_at = COALESCE(status_updated_at, reviewed_at, updated_at, created_at),
  approved_at = CASE
    WHEN status = 'approved' THEN COALESCE(approved_at, reviewed_at, updated_at)
    ELSE approved_at
  END;

ALTER TABLE public.beach_tour_requests
  ALTER COLUMN status SET DEFAULT 'in_progress',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status_updated_at SET DEFAULT now(),
  ALTER COLUMN status_updated_at SET NOT NULL,
  ADD CONSTRAINT beach_tour_requests_status_check
    CHECK (status IN ('in_progress', 'review', 'approved'));

CREATE OR REPLACE FUNCTION public.record_beach_tour_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.beach_tour_status_history (tour_id, from_status, to_status, note, changed_by, created_at)
    VALUES (NEW.id, NULL, NEW.status, NEW.status_note, COALESCE(NEW.reviewed_by, NEW.owner_id), now());
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.beach_tour_status_history (tour_id, from_status, to_status, note, changed_by, created_at)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.status_note, COALESCE(NEW.reviewed_by, NEW.owner_id), now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS beach_tour_status_history_trigger ON public.beach_tour_requests;
CREATE TRIGGER beach_tour_status_history_trigger
  AFTER INSERT OR UPDATE OF status ON public.beach_tour_requests
  FOR EACH ROW EXECUTE FUNCTION public.record_beach_tour_status_history();

ALTER TABLE public.beach_tour_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beach_tour_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own tour requests" ON public.beach_tour_requests;
DROP POLICY IF EXISTS "Admins can update tour requests" ON public.beach_tour_requests;
DROP POLICY IF EXISTS "Owners can read own beach tours" ON public.beach_tour_requests;
DROP POLICY IF EXISTS "Admins can manage beach tours" ON public.beach_tour_requests;
DROP POLICY IF EXISTS "Public can read approved beach tours" ON public.beach_tour_requests;
DROP POLICY IF EXISTS "Owners can submit tours for review" ON public.beach_tour_requests;
DROP POLICY IF EXISTS "Owners can read own tour history" ON public.beach_tour_status_history;
DROP POLICY IF EXISTS "Admins can read tour history" ON public.beach_tour_status_history;

CREATE POLICY "Owners can read own beach tours"
  ON public.beach_tour_requests FOR SELECT TO authenticated
  USING (public.owns_beach(beach_id));

CREATE POLICY "Admins can manage beach tours"
  ON public.beach_tour_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Public can read approved beach tours"
  ON public.beach_tour_requests FOR SELECT TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Owners can submit tours for review"
  ON public.beach_tour_requests FOR UPDATE TO authenticated
  USING (public.owns_beach(beach_id) AND status = 'in_progress')
  WITH CHECK (public.owns_beach(beach_id) AND status = 'review');

CREATE POLICY "Owners can read own tour history"
  ON public.beach_tour_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.beach_tour_requests t
      WHERE t.id = tour_id AND public.owns_beach(t.beach_id)
    )
  );

CREATE POLICY "Admins can read tour history"
  ON public.beach_tour_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

REVOKE ALL ON public.beach_tour_requests, public.beach_tour_status_history FROM anon, authenticated;
GRANT SELECT ON public.beach_tour_requests TO anon, authenticated;
GRANT UPDATE (status, status_updated_at, status_note) ON public.beach_tour_requests TO authenticated;
GRANT SELECT ON public.beach_tour_status_history TO authenticated;
GRANT ALL ON public.beach_tour_requests, public.beach_tour_status_history TO service_role;
REVOKE ALL ON FUNCTION public.record_beach_tour_status_history() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_beach_tour_status_history() TO service_role;

CREATE OR REPLACE VIEW public.beach_published_tours AS
SELECT beach_id, requested_tour_url, approved_at, status_updated_at
FROM (
  SELECT DISTINCT ON (beach_id)
    beach_id, requested_tour_url, approved_at, status_updated_at, status
  FROM public.beach_tour_requests
  ORDER BY beach_id, created_at DESC, id DESC
) latest
WHERE status = 'approved';

REVOKE ALL ON public.beach_published_tours FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.beach_published_tours TO anon, authenticated;

ALTER TABLE public.user_notifications
  ALTER COLUMN login_device_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS action_url TEXT;

ALTER TABLE public.user_notifications DROP CONSTRAINT IF EXISTS user_notifications_type_check;
ALTER TABLE public.user_notifications
  ADD CONSTRAINT user_notifications_type_check
  CHECK (type IN ('new_device_login', 'tour_status'));

ALTER TABLE public.user_notifications
  DROP CONSTRAINT IF EXISTS user_notifications_login_device_id_fkey;
ALTER TABLE public.user_notifications
  ADD CONSTRAINT user_notifications_login_device_id_fkey
  FOREIGN KEY (login_device_id) REFERENCES public.login_devices(id) ON DELETE CASCADE;

GRANT ALL ON public.user_notifications TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
