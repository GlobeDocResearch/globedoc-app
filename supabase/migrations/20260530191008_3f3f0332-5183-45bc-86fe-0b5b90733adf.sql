CREATE TABLE public.record_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institution TEXT NOT NULL,
  city TEXT,
  country TEXT,
  years TEXT,
  record_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.record_locations TO authenticated;
GRANT ALL ON public.record_locations TO service_role;

ALTER TABLE public.record_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own rl" ON public.record_locations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own rl" ON public.record_locations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own rl" ON public.record_locations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own rl" ON public.record_locations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_record_locations_updated_at
BEFORE UPDATE ON public.record_locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();