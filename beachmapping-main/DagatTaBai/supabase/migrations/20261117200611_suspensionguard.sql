BEGIN;

CREATE OR REPLACE FUNCTION public.is_safe_admin_text(candidate TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT candidate IS NULL OR (
    char_length(normalize(candidate, NFKC)) <= 500
    AND normalize(candidate, NFKC) !~ '[=<>;`{}$|^~*%]'
    AND position('[' in normalize(candidate, NFKC)) = 0
    AND position(']' in normalize(candidate, NFKC)) = 0
    AND position(chr(92) in normalize(candidate, NFKC)) = 0
    AND normalize(candidate, NFKC) !~ '[[:cntrl:]]'
    AND normalize(candidate, NFKC) !~ U&'[\00AD\034F\0600-\0605\061C\06DD\070F\0890-\0891\08E2\115F\1160\17B4\17B5\180B-\180F\200B-\200F\202A-\202E\2060-\206F\FE00-\FE0F\FEFF\FFF9-\FFFB\+0110BD\+0110CD\+013430-\+01343F\+01BCA0-\+01BCA3\+01D173-\+01D17A\+0E0001\+0E0020-\+0E007F]'
    AND normalize(candidate, NFKC) !~ '--|/\*|\*/|\$\{'
  );
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
