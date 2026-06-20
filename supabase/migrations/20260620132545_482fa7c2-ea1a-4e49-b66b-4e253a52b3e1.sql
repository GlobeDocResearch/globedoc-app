DROP POLICY IF EXISTS "patient update own pro sessions" ON public.pro_sessions;
CREATE POLICY "patient update own pro sessions"
ON public.pro_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);