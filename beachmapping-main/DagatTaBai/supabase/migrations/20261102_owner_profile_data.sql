-- Additive migration for owner-managed beach content and owner verification.
-- Safe to apply to an existing database: no tables or rows are dropped.
-- Beach details, hours, rules, and gallery images remain on public.beaches,
-- which is the source currently shared by the owner form and public profile.
BEGIN;

ALTER TABLE public.beaches
  ADD COLUMN IF NOT EXISTS peak_days TEXT,
  ADD COLUMN IF NOT EXISTS peak_hours TEXT,
  ADD COLUMN IF NOT EXISTS best_visiting_time TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Existing catalogue tables already hold cottages, facilities, and rules.
-- These extra labels preserve the owner form's display values without
-- changing or discarding their existing numeric columns.
ALTER TABLE public.beach_cottages
  ADD COLUMN IF NOT EXISTS capacity_label TEXT;

ALTER TABLE public.beach_facilities
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS price_label TEXT;

-- Keep the selfie file in private Supabase Storage; the database stores only
-- its object path and capture time, never the image bytes or face template.
ALTER TABLE public.owner_applications
  ADD COLUMN IF NOT EXISTS live_selfie_path TEXT,
  ADD COLUMN IF NOT EXISTS live_selfie_captured_at TIMESTAMPTZ;

-- Record beach posts separately from the beach's branding/gallery images.
CREATE TABLE IF NOT EXISTS public.beach_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beach_id UUID NOT NULL REFERENCES public.beaches(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  caption TEXT,
  image_path TEXT,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT beach_posts_content_required
    CHECK (NULLIF(BTRIM(caption), '') IS NOT NULL OR image_path IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_beach_posts_public_feed
  ON public.beach_posts(beach_id, created_at DESC)
  WHERE status = 'published';

ALTER TABLE public.beach_posts ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.beach_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.beach_posts TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'beach_posts'
      AND policyname = 'Public can view published posts for active beaches'
  ) THEN
    CREATE POLICY "Public can view published posts for active beaches"
      ON public.beach_posts
      FOR SELECT
      USING (
        status = 'published'
        AND EXISTS (
          SELECT 1
          FROM public.beaches
          WHERE beaches.id = beach_posts.beach_id
            AND beaches.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'beach_posts'
      AND policyname = 'Beach owners manage their posts'
  ) THEN
    CREATE POLICY "Beach owners manage their posts"
      ON public.beach_posts
      FOR ALL
      TO authenticated
      USING (public.owns_beach(beach_id))
      WITH CHECK (
        public.owns_beach(beach_id)
        AND (author_id IS NULL OR author_id = auth.uid() OR public.is_admin())
      );
  END IF;
END
$$;

-- Keep a durable owner-side caretaker invitation list. This table records
-- invitations only; it does not itself grant portal permissions or create
-- Supabase Auth accounts.
CREATE TABLE IF NOT EXISTS public.beach_caretaker_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beach_id UUID NOT NULL REFERENCES public.beaches(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  invited_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role_title TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(permissions) = 'array'),
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'accepted', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_beach_caretaker_active_email
  ON public.beach_caretaker_invitations(beach_id, LOWER(email))
  WHERE status IN ('invited', 'accepted');

ALTER TABLE public.beach_caretaker_invitations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.beach_caretaker_invitations TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'beach_caretaker_invitations'
      AND policyname = 'Beach owners manage their caretaker invitations'
  ) THEN
    CREATE POLICY "Beach owners manage their caretaker invitations"
      ON public.beach_caretaker_invitations
      FOR ALL
      TO authenticated
      USING (public.owns_beach(beach_id))
      WITH CHECK (
        public.owns_beach(beach_id)
        AND invited_by = auth.uid()
      );
  END IF;
END
$$;

-- Ensure the existing private application-document bucket is present without
-- changing its settings if it already exists. Selfie uploads should use JPEG
-- or PNG and go through a server route using the service-role client.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'owner-application-documents',
  'owner-application-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
