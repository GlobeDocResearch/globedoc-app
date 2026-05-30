-- 1. Extend pairing_codes with chosen validity
ALTER TABLE public.pairing_codes
  ADD COLUMN IF NOT EXISTS validity_minutes integer NOT NULL DEFAULT 10;

-- 2. Pro sessions table
CREATE TABLE public.pro_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pairing_code_id uuid,
  pro_name text NOT NULL,
  pro_title text,
  institution text,
  access_level text NOT NULL DEFAULT 'passport_records',
  session_token text NOT NULL UNIQUE,
  paired_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.pro_sessions TO authenticated;
GRANT ALL ON public.pro_sessions TO service_role;

ALTER TABLE public.pro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient view own pro sessions"
  ON public.pro_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "patient update own pro sessions"
  ON public.pro_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER pro_sessions_updated_at
  BEFORE UPDATE ON public.pro_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pro_sessions_user ON public.pro_sessions(user_id);
CREATE INDEX idx_pro_sessions_token ON public.pro_sessions(session_token);

-- 3. Pro-authored entries on record_entries
ALTER TABLE public.record_entries
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_role text,
  ADD COLUMN IF NOT EXISTS pro_session_id uuid;