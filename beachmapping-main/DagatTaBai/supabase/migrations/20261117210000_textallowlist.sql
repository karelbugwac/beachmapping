BEGIN;

CREATE OR REPLACE FUNCTION public.is_safe_admin_text(candidate TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT candidate IS NULL OR (
    char_length(normalize(candidate, NFKC)) <= 500
    AND normalize(candidate, NFKC) !~ '[[:cntrl:]]'
    AND normalize(candidate, NFKC) ~ '^[[:alpha:][:digit:][:space:].,:!?''"()+@#&/-]*$'
    AND normalize(candidate, NFKC) !~ '--|/\*|\*/|\$\{'
  );
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
