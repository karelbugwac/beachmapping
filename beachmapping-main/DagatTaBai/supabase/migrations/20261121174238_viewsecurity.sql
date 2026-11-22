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
