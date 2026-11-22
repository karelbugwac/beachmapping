BEGIN;

-- Force re-apply function permission revokes
-- This ensures the linter sees the updated permissions

REVOKE EXECUTE ON FUNCTION public.recalculate_beach_average_rating() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_beach_rating() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_owner_application_status_history() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_active_account_for_writes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_cottage_photo_limit() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_facility_photo_limit() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_profile_from_auth() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.register_login_device(p_device_id uuid, p_browser text, p_platform text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_application_received_email() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_application_status_email() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_account_admin_field_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_duplicate_pending_owner_application() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_self_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_system_audit_log_mutation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_user_suspension_edits() FROM anon, authenticated;

COMMIT;
