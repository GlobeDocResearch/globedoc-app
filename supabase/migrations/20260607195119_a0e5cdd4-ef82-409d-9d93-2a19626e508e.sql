
ALTER TABLE public.pro_sessions
  ADD COLUMN IF NOT EXISTS pro_user_id uuid;

CREATE INDEX IF NOT EXISTS pro_sessions_pro_user_id_idx
  ON public.pro_sessions(pro_user_id);

-- Allow the professional to read their own sessions
DROP POLICY IF EXISTS "pro view own pro sessions" ON public.pro_sessions;
CREATE POLICY "pro view own pro sessions"
  ON public.pro_sessions
  FOR SELECT
  USING (auth.uid() = pro_user_id);

-- Allow the professional to update (e.g. revoke) their own sessions
DROP POLICY IF EXISTS "pro update own pro sessions" ON public.pro_sessions;
CREATE POLICY "pro update own pro sessions"
  ON public.pro_sessions
  FOR UPDATE
  USING (auth.uid() = pro_user_id)
  WITH CHECK (auth.uid() = pro_user_id);
