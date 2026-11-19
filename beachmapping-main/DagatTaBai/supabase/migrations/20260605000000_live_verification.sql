BEGIN;

ALTER TABLE public.owner_applications
  ADD COLUMN IF NOT EXISTS liveness_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (liveness_status IN ('passed', 'failed', 'flagged', 'pending')),
  ADD COLUMN IF NOT EXISTS liveness_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS liveness_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS liveness_snapshot_path TEXT,
  ADD COLUMN IF NOT EXISTS liveness_flagged_reasons JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(liveness_flagged_reasons) = 'array');

CREATE TABLE IF NOT EXISTS public.owner_liveness_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce_hash TEXT NOT NULL UNIQUE,
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL,
  challenges JSONB NOT NULL CHECK (jsonb_typeof(challenges) = 'array'),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'passed', 'failed', 'flagged')),
  attempts INTEGER NOT NULL DEFAULT 1,
  snapshot_path TEXT,
  flagged_reasons JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(flagged_reasons) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_owner_liveness_ip_created
  ON public.owner_liveness_sessions(ip_hash, created_at DESC);

ALTER TABLE public.owner_liveness_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.owner_liveness_sessions FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'owner-verification-snapshots',
  'owner-verification-snapshots',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

COMMIT;
