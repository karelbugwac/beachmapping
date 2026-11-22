-- Fix profiles_status_reason_safe_check constraint to allow NULL status_reason
-- The is_safe_admin_text function was updated to require non-NULL, but profiles.status_reason
-- can be NULL for active users. This constraint should only validate when status_reason is provided.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_reason_safe_check,
  ADD CONSTRAINT profiles_status_reason_safe_check
    CHECK (status_reason IS NULL OR public.is_safe_admin_text(status_reason));
