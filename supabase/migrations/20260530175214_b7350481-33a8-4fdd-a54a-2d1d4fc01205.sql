
-- record_entries
CREATE TABLE public.record_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_type text NOT NULL,
  title text NOT NULL,
  body text,
  file_path text,
  file_name text,
  file_mime text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.record_entries TO authenticated;
GRANT ALL ON public.record_entries TO service_role;

ALTER TABLE public.record_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own re" ON public.record_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own re" ON public.record_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own re" ON public.record_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own re" ON public.record_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_record_entries_updated_at
BEFORE UPDATE ON public.record_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_record_entries_user_created ON public.record_entries (user_id, created_at DESC);

-- record_comments
CREATE TABLE public.record_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.record_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.record_comments TO authenticated;
GRANT ALL ON public.record_comments TO service_role;

ALTER TABLE public.record_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own rc" ON public.record_comments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own rc" ON public.record_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own rc" ON public.record_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own rc" ON public.record_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_record_comments_updated_at
BEFORE UPDATE ON public.record_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_record_comments_entry_created ON public.record_comments (entry_id, created_at);

-- records storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('records', 'records', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "records select own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'records' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "records insert own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'records' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "records update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'records' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "records delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'records' AND auth.uid()::text = (storage.foldername(name))[1]);
