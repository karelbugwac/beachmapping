BEGIN;

-- ============================================
-- FIX: Revoke EXECUTE on internal SECURITY DEFINER functions
-- These should only be callable by service_role
-- Functions used in RLS policies are EXCLUDED
-- ============================================

-- Trigger functions (used by database triggers, not RLS)
REVOKE EXECUTE ON FUNCTION public.prevent_account_admin_field_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_duplicate_pending_owner_application() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_self_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_system_audit_log_mutation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_user_suspension_edits() FROM anon, authenticated;

-- Internal service functions (not used in RLS)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_profile_from_auth() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.register_login_device(p_device_id uuid, p_browser text, p_platform text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_application_received_email() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_application_status_email() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_beach_average_rating() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_beach_rating() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_owner_application_status_history() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_active_account_for_writes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_cottage_photo_limit() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_facility_photo_limit() FROM anon, authenticated;

-- Ensure service_role can execute them
GRANT EXECUTE ON FUNCTION public.prevent_account_admin_field_changes() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_duplicate_pending_owner_application() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_profile_role_self_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_system_audit_log_mutation() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_user_suspension_edits() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_profile_from_auth() TO service_role;
GRANT EXECUTE ON FUNCTION public.register_login_device(p_device_id uuid, p_browser text, p_platform text) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_application_received_email() TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_application_status_email() TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_beach_average_rating() TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_beach_rating() TO service_role;
GRANT EXECUTE ON FUNCTION public.record_owner_application_status_history() TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_active_account_for_writes() TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_cottage_photo_limit() TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_facility_photo_limit() TO service_role;

-- ============================================
-- KEEP these functions as SECURITY DEFINER and callable
-- They are REQUIRED for RLS policies to work:
-- - is_admin()
-- - is_beach_manager()
-- - is_beach_owner()
-- - owns_beach(p_beach_id uuid)
-- - is_safe_admin_text(candidate text)
-- ============================================

COMMIT;
