-- Update beach slugs to simpler names
UPDATE public.beaches 
SET slug = 'ranola' 
WHERE slug = 'ra-ola-beach' OR name ILIKE '%ranola%';

UPDATE public.beaches 
SET slug = 'litebay' 
WHERE slug = 'litebay-resort' OR name ILIKE '%litebay%';

UPDATE public.beaches 
SET slug = 'majestiqueview' 
WHERE slug = 'majestique-beach' OR name ILIKE '%majestique%';

UPDATE public.beaches 
SET slug = 'hinagdan' 
WHERE slug = 'hinagdan-beach' OR name ILIKE '%hinagdan%';
