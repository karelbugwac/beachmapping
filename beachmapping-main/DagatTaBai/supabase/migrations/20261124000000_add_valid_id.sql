-- Add valid ID document path to owner applications
ALTER TABLE public.ownerapplications
  ADD COLUMN IF NOT EXISTS valididpath text;
