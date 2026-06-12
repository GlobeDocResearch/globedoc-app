-- Restrict which pro_sessions columns patients (and any non-service-role caller)
-- can modify. Only revoked_at and expires_at may change; everything else is
-- immutable from RLS-scoped clients. Service role bypasses this trigger.

CREATE OR REPLACE FUNCTION public.enforce_pro_sessions_patient_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- service_role / superuser bypass: they aren't constrained by RLS either
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id        IS DISTINCT FROM OLD.user_id
   OR NEW.pro_user_id   IS DISTINCT FROM OLD.pro_user_id
   OR NEW.pairing_code_id IS DISTINCT FROM OLD.pairing_code_id
   OR NEW.pro_name      IS DISTINCT FROM OLD.pro_name
   OR NEW.pro_title     IS DISTINCT FROM OLD.pro_title
   OR NEW.institution   IS DISTINCT FROM OLD.institution
   OR NEW.access_level  IS DISTINCT FROM OLD.access_level
   OR NEW.session_token IS DISTINCT FROM OLD.session_token
   OR NEW.reason_chips  IS DISTINCT FROM OLD.reason_chips
   OR NEW.reason_text   IS DISTINCT FROM OLD.reason_text
   OR NEW.created_at    IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Only revoked_at, expires_at, last_accessed_at may be updated on pro_sessions from the client'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pro_sessions_restrict_patient_update ON public.pro_sessions;
CREATE TRIGGER pro_sessions_restrict_patient_update
  BEFORE UPDATE ON public.pro_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pro_sessions_patient_update();