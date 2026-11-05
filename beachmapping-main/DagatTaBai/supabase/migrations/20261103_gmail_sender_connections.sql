BEGIN;

CREATE TABLE IF NOT EXISTS public.gmail_sender_connections (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gmail_sender_connections ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.gmail_sender_connections FROM anon, authenticated;
GRANT ALL ON public.gmail_sender_connections TO service_role;

COMMIT;
