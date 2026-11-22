BEGIN;

-- Revert function search_path changes to original state
-- The previous fix may have caused issues with existing code

CREATE OR REPLACE FUNCTION public.is_safe_admin_text(candidate TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN candidate IS NOT NULL
    AND char_length(normalize(candidate, NFKC)) BETWEEN 10 AND 500
    AND normalize(candidate, NFKC) !~ '[-<>;`{}$|^~*%]'
    AND position('[' in normalize(candidate, NFKC)) = 0
    AND position(']' in normalize(candidate, NFKC)) = 0
    AND position(chr(92) in normalize(candidate, NFKC)) = 0
    AND normalize(candidate, NFKC) !~ '[[:cntrl:]]'
    AND normalize(candidate, NFKC) !~ U&'[\200B-\200F\202A-\202E\2060-\206F\FE00-\FE0F\FEFF]'
    AND normalize(candidate, NFKC) !~ '--|/\*|\*/|\$\{';
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_system_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE EXCEPTION 'System audit log cannot be modified directly'
    USING ERRCODE = '42501';
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_user_suspension_edits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.account_status IS DISTINCT FROM OLD.account_status
     OR NEW.status_reason IS DISTINCT FROM OLD.status_reason
     OR NEW.status_reason_type IS DISTINCT FROM OLD.status_reason_type
     OR NEW.suspended_until IS DISTINCT FROM OLD.suspended_until THEN
    RAISE EXCEPTION 'Account suspension fields can only be changed by authorized backend action'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;
