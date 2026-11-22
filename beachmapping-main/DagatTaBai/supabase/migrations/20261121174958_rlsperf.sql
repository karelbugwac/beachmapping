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
