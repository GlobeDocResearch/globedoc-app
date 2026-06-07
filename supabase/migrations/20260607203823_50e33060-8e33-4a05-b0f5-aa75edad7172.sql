DROP POLICY IF EXISTS "insert own audit" ON public.audit_log;
DROP POLICY IF EXISTS "select own audit" ON public.audit_log;

CREATE POLICY "insert own audit"
  ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "select own audit"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "pro update own pro sessions" ON public.pro_sessions;
DROP POLICY IF EXISTS "pro view own pro sessions" ON public.pro_sessions;

CREATE POLICY "pro view own pro sessions"
  ON public.pro_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = pro_user_id);

CREATE POLICY "pro update own pro sessions"
  ON public.pro_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = pro_user_id)
  WITH CHECK (auth.uid() = pro_user_id);