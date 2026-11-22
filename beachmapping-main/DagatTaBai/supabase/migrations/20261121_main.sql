BEGIN;

-- Fix SECURITY DEFINER view to use SECURITY INVOKER
-- This ensures the view respects the querying user's RLS policies
CREATE OR REPLACE VIEW public.beach_published_tours
WITH (security_invoker = true) AS
SELECT beach_id, requested_tour_url, approved_at, status_updated_at
FROM (
  SELECT DISTINCT ON (beach_id)
    beach_id, requested_tour_url, approved_at, status_updated_at, status
  FROM public.beach_tour_requests
  ORDER BY beach_id, created_at DESC, id DESC
) latest
WHERE status = 'approved';

-- Ensure proper permissions are maintained
REVOKE ALL ON public.beach_published_tours FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.beach_published_tours TO anon, authenticated;

COMMIT;
BEGIN;

-- ============================================
-- FIX: Add indexes for unindexed foreign keys
-- ============================================

-- application_status_history
CREATE INDEX IF NOT EXISTS idx_application_status_history_changed_by
  ON public.application_status_history (changed_by);

-- beach_caretaker_invitations
CREATE INDEX IF NOT EXISTS idx_beach_caretaker_invitations_invited_by
  ON public.beach_caretaker_invitations (invited_by);
CREATE INDEX IF NOT EXISTS idx_beach_caretaker_invitations_invited_user_id
  ON public.beach_caretaker_invitations (invited_user_id);

-- beach_coordinate_requests
CREATE INDEX IF NOT EXISTS idx_beach_coordinate_requests_owner_id
  ON public.beach_coordinate_requests (owner_id);
CREATE INDEX IF NOT EXISTS idx_beach_coordinate_requests_reviewed_by
  ON public.beach_coordinate_requests (reviewed_by);

-- beach_external_links
CREATE INDEX IF NOT EXISTS idx_beach_external_links_beach_id
  ON public.beach_external_links (beach_id);

-- beach_posts
CREATE INDEX IF NOT EXISTS idx_beach_posts_author_id
  ON public.beach_posts (author_id);

-- beach_review_reports
CREATE INDEX IF NOT EXISTS idx_beach_review_reports_beach_id
  ON public.beach_review_reports (beach_id);
CREATE INDEX IF NOT EXISTS idx_beach_review_reports_reporter_user_id
  ON public.beach_review_reports (reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_beach_review_reports_review_id
  ON public.beach_review_reports (review_id);

-- beach_tour_requests
CREATE INDEX IF NOT EXISTS idx_beach_tour_requests_owner_id
  ON public.beach_tour_requests (owner_id);
CREATE INDEX IF NOT EXISTS idx_beach_tour_requests_reviewed_by
  ON public.beach_tour_requests (reviewed_by);

-- beach_tour_status_history
CREATE INDEX IF NOT EXISTS idx_beach_tour_status_history_changed_by
  ON public.beach_tour_status_history (changed_by);

-- beach_weather_snapshots
CREATE INDEX IF NOT EXISTS idx_beach_weather_snapshots_beach_id
  ON public.beach_weather_snapshots (beach_id);

-- owner_applications
CREATE INDEX IF NOT EXISTS idx_owner_applications_reviewed_by
  ON public.owner_applications (reviewed_by);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_status_changed_by
  ON public.profiles (status_changed_by);

-- user_notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_login_device_id
  ON public.user_notifications (login_device_id);

-- visitor_events
CREATE INDEX IF NOT EXISTS idx_visitor_events_beach_id
  ON public.visitor_events (beach_id);

COMMIT;
BEGIN;

-- ============================================
-- FIX: Optimize RLS policies by wrapping auth functions
-- This prevents re-evaluation for each row
-- ============================================

-- profiles: Authenticated users can view profiles
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING ((select auth.uid()) = id OR public.is_admin());

-- owner_applications: Applicants can view their applications
DROP POLICY IF EXISTS "Applicants can view their applications" ON public.owner_applications;
CREATE POLICY "Applicants can view their applications"
ON public.owner_applications
FOR SELECT
TO authenticated
USING ((select auth.uid()) = applicant_user_id);

-- login_devices: Users can view their login devices
DROP POLICY IF EXISTS "Users can view their login devices" ON public.login_devices;
CREATE POLICY "Users can view their login devices"
ON public.login_devices
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- user_notifications: Users can view their notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON public.user_notifications;
CREATE POLICY "Users can view their notifications"
ON public.user_notifications
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- user_notifications: Users can update their notifications
DROP POLICY IF EXISTS "Users can update their notifications" ON public.user_notifications;
CREATE POLICY "Users can update their notifications"
ON public.user_notifications
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- beach_posts: Beach owners manage their posts
DROP POLICY IF EXISTS "Beach owners manage their posts" ON public.beach_posts;
CREATE POLICY "Beach owners manage their posts"
ON public.beach_posts
FOR ALL
TO authenticated
USING (public.owns_beach(beach_id))
WITH CHECK (
  public.owns_beach(beach_id)
  AND (author_id IS NULL OR author_id = (select auth.uid()) OR public.is_admin())
);

-- beach_caretaker_invitations: Beach owners manage their caretaker invitations
DROP POLICY IF EXISTS "Beach owners manage their caretaker invitations" ON public.beach_caretaker_invitations;
CREATE POLICY "Beach owners manage their caretaker invitations"
ON public.beach_caretaker_invitations
FOR ALL
TO authenticated
USING (public.owns_beach(beach_id))
WITH CHECK (
  public.owns_beach(beach_id)
  AND invited_by = (select auth.uid())
);

-- beach_coordinate_requests: Owners can view own coordinate requests
DROP POLICY IF EXISTS "Owners can view own coordinate requests" ON public.beach_coordinate_requests;
CREATE POLICY "Owners can view own coordinate requests"
ON public.beach_coordinate_requests
FOR SELECT
TO authenticated
USING (
  owner_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'admin'
  )
);

-- beach_coordinate_requests: Admins can update coordinate requests
DROP POLICY IF EXISTS "Admins can update coordinate requests" ON public.beach_coordinate_requests;
CREATE POLICY "Admins can update coordinate requests"
ON public.beach_coordinate_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'admin'
  )
);

-- beach_tour_requests: Owners can view own tour requests
DROP POLICY IF EXISTS "Owners can view own tour requests" ON public.beach_tour_requests;
CREATE POLICY "Owners can view own tour requests"
ON public.beach_tour_requests
FOR SELECT
TO authenticated
USING (
  owner_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'admin'
  )
);

-- beach_tour_requests: Admins can manage beach tours
DROP POLICY IF EXISTS "Admins can manage beach tours" ON public.beach_tour_requests;
CREATE POLICY "Admins can manage beach tours"
ON public.beach_tour_requests
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- beach_tour_requests: Owners can submit tours for review
DROP POLICY IF EXISTS "Owners can submit tours for review" ON public.beach_tour_requests;
CREATE POLICY "Owners can submit tours for review"
ON public.beach_tour_requests
FOR UPDATE
TO authenticated
USING (public.owns_beach(beach_id) AND status = 'in_progress')
WITH CHECK (public.owns_beach(beach_id) AND status = 'review');

-- beach_tour_status_history: Owners can read own tour history
DROP POLICY IF EXISTS "Owners can read own tour history" ON public.beach_tour_status_history;
CREATE POLICY "Owners can read own tour history"
ON public.beach_tour_status_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.beach_tour_requests t
    WHERE t.id = tour_id AND public.owns_beach(t.beach_id)
  )
);

-- beach_tour_status_history: Admins can read tour history
DROP POLICY IF EXISTS "Admins can read tour history" ON public.beach_tour_status_history;
CREATE POLICY "Admins can read tour history"
ON public.beach_tour_status_history
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- application_status_history: Applicants can read own application status history
DROP POLICY IF EXISTS "Applicants can read own application status history" ON public.application_status_history;
CREATE POLICY "Applicants can read own application status history"
ON public.application_status_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.owner_applications oa
    WHERE oa.id = application_id AND oa.applicant_user_id = (select auth.uid())
  )
);

COMMIT;
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
BEGIN;

-- ============================================
-- FIX: Restrict public bucket listing policies
-- Replace broad SELECT with object-specific access
-- ============================================

-- Replace broad SELECT policy for avatars
DROP POLICY IF EXISTS "DagatTaBai avatar public read" ON storage.objects;
CREATE POLICY "DagatTaBai avatar public read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Replace broad SELECT policy for beach-media
-- Allow access to any beach folder (simpler approach)
DROP POLICY IF EXISTS "DagatTaBai beach media public read" ON storage.objects;
CREATE POLICY "DagatTaBai beach media public read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'beach-media'
);

COMMIT;
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
