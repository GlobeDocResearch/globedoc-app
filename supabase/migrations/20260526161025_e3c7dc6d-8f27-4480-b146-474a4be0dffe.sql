
ALTER TABLE public.standard_vaccines ADD COLUMN IF NOT EXISTS date text;

CREATE TABLE IF NOT EXISTS public.additional_vaccines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category text NOT NULL,
  vaccine_name text,
  date text,
  year text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.additional_vaccines TO authenticated;
GRANT ALL ON public.additional_vaccines TO service_role;

ALTER TABLE public.additional_vaccines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own av" ON public.additional_vaccines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own av" ON public.additional_vaccines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own av" ON public.additional_vaccines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own av" ON public.additional_vaccines FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_additional_vaccines_updated_at
BEFORE UPDATE ON public.additional_vaccines
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
