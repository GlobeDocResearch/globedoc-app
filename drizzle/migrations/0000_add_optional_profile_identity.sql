ALTER TABLE public.profiles
  ADD COLUMN gender_identity text,
  ADD COLUMN gender_identity_description text,
  ADD COLUMN pronouns text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_gender_identity_options CHECK (gender_identity IS NULL OR gender_identity IN ('Woman', 'Man', 'Non-binary', 'Prefer to self-describe', 'Prefer not to say')),
  ADD CONSTRAINT profiles_identity_description_length CHECK (gender_identity_description IS NULL OR char_length(gender_identity_description) <= 100),
  ADD CONSTRAINT profiles_pronouns_length CHECK (pronouns IS NULL OR char_length(pronouns) <= 30);

COMMENT ON COLUMN public.profiles.gender_identity IS 'Optional health-related personal data; never send to translation services.';
COMMENT ON COLUMN public.profiles.gender_identity_description IS 'Optional self-described gender identity, maximum 100 characters; never translate.';
COMMENT ON COLUMN public.profiles.pronouns IS 'Optional pronouns, maximum 30 characters; never translate.';