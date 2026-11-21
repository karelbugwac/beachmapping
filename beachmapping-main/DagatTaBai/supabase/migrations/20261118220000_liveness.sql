BEGIN;

ALTER TABLE public.owner_liveness_sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_owner_liveness_user_created
  ON public.owner_liveness_sessions(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

COMMIT;
