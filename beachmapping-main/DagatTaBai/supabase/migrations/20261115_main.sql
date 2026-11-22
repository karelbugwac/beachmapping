BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_ends_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check,
  ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'suspended'));

UPDATE public.profiles AS profile
SET status = 'suspended',
    suspension_reason = NULLIF(auth_user.raw_user_meta_data->>'status_reason', ''),
    suspended_at = CASE
      WHEN auth_user.raw_user_meta_data->>'status_updated_at' ~ '^\d{4}-\d{2}-\d{2}T'
        THEN (auth_user.raw_user_meta_data->>'status_updated_at')::TIMESTAMPTZ
      ELSE NULL
    END,
    suspension_ends_at = CASE
      WHEN auth_user.raw_user_meta_data->>'suspension_ends_at' ~ '^\d{4}-\d{2}-\d{2}T'
        THEN (auth_user.raw_user_meta_data->>'suspension_ends_at')::TIMESTAMPTZ
      ELSE NULL
    END
FROM auth.users AS auth_user
WHERE auth_user.id = profile.id
  AND auth_user.raw_user_meta_data->>'status' = 'suspended';

CREATE OR REPLACE FUNCTION public.prevent_user_suspension_edits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND (
    NEW.status IS DISTINCT FROM OLD.status OR
    NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason OR
    NEW.suspended_at IS DISTINCT FROM OLD.suspended_at OR
    NEW.suspension_ends_at IS DISTINCT FROM OLD.suspension_ends_at
  ) THEN
    RAISE EXCEPTION 'Only administrators can change account suspension details'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_user_suspension_edits ON public.profiles;
CREATE TRIGGER prevent_user_suspension_edits
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_suspension_edits();

CREATE OR REPLACE FUNCTION public.enforce_active_account_for_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  account_status TEXT;
  suspension_end TIMESTAMPTZ;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' OR auth.uid() IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  SELECT status, suspension_ends_at
  INTO account_status, suspension_end
  FROM public.profiles
  WHERE id = auth.uid();

  IF account_status = 'suspended' AND (suspension_end IS NULL OR suspension_end > now()) THEN
    RAISE EXCEPTION 'This account is suspended'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  relation_name TEXT;
BEGIN
  FOR relation_name IN
    SELECT format('%I.%I', namespace.nspname, relation.relname)
    FROM pg_class relation
    JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relkind = 'r'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS enforce_active_account_for_writes ON %s', relation_name);
    EXECUTE format(
      'CREATE TRIGGER enforce_active_account_for_writes BEFORE INSERT OR UPDATE OR DELETE ON %s FOR EACH ROW EXECUTE FUNCTION public.enforce_active_account_for_writes()',
      relation_name
    );
  END LOOP;

  IF to_regclass('storage.objects') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS enforce_active_account_for_writes ON storage.objects;
    CREATE TRIGGER enforce_active_account_for_writes
      BEFORE INSERT OR UPDATE OR DELETE ON storage.objects
      FOR EACH ROW EXECUTE FUNCTION public.enforce_active_account_for_writes();
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_active_suspensions
  ON public.profiles (status, suspension_ends_at)
  WHERE status = 'suspended';

NOTIFY pgrst, 'reload schema';

COMMIT;
