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
