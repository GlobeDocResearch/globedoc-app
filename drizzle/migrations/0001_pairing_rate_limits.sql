ALTER TABLE public.pairing_codes ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS pairing_codes_active_code_unique ON public.pairing_codes (code) WHERE used = false;

CREATE TABLE public.pairing_failed_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.pairing_failed_attempts TO service_role;
ALTER TABLE public.pairing_failed_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages pairing attempts" ON public.pairing_failed_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX pairing_failed_attempts_ip_time ON public.pairing_failed_attempts (ip_hash, created_at);

CREATE OR REPLACE FUNCTION public.enforce_live_pairing_code_cap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.pairing_codes SET expires_at = now()
  WHERE id IN (
    SELECT id FROM public.pairing_codes
    WHERE user_id = NEW.user_id AND used = false AND expires_at > now()
    ORDER BY created_at DESC
    OFFSET 4
  );
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.enforce_live_pairing_code_cap() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER pairing_codes_live_cap BEFORE INSERT ON public.pairing_codes
FOR EACH ROW EXECUTE FUNCTION public.enforce_live_pairing_code_cap();