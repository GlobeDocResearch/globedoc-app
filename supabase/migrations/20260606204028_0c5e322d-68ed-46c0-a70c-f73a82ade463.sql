CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  tos_at timestamptz;
  health_at timestamptz;
BEGIN
  IF (NEW.raw_user_meta_data->>'account_type') = 'professional' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (user_id, first_name, last_name, language)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );

  tos_at := NULLIF(NEW.raw_user_meta_data->>'consent_tos_at','')::timestamptz;
  health_at := NULLIF(NEW.raw_user_meta_data->>'consent_health_at','')::timestamptz;

  IF tos_at IS NOT NULL OR health_at IS NOT NULL THEN
    INSERT INTO public.consents (user_id, terms_accepted_at, health_data_accepted_at)
    VALUES (NEW.id, tos_at, health_at);
  END IF;

  RETURN NEW;
END;
$function$;

DELETE FROM public.profiles p
USING auth.users u
WHERE p.user_id = u.id
  AND (u.raw_user_meta_data->>'account_type') = 'professional'
  AND p.date_of_birth IS NULL
  AND p.biological_sex IS NULL
  AND p.nationality IS NULL
  AND p.country_of_residence IS NULL
  AND p.phone IS NULL
  AND p.address IS NULL
  AND p.blood_group IS NULL
  AND p.civic_registration_number IS NULL
  AND p.avatar_url IS NULL;