CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tos_at timestamptz;
  health_at timestamptz;
BEGIN
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
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();