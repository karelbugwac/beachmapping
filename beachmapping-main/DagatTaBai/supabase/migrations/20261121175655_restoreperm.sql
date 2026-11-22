BEGIN;

-- Restore function permissions that were incorrectly revoked
-- These functions are needed for RLS policies and triggers

GRANT EXECUTE ON FUNCTION public.enforce_active_account_for_writes() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_cottage_photo_limit() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_facility_photo_limit() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_beach_manager() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_beach_owner() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owns_beach(p_beach_id uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_account_admin_field_changes() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_duplicate_pending_owner_application() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_profile_role_self_change() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_application_received_email() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_application_status_email() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_beach_average_rating() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_beach_rating() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_owner_application_status_history() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_from_auth() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_login_device(p_device_id uuid, p_browser text, p_platform text) TO anon, authenticated;

COMMIT;
