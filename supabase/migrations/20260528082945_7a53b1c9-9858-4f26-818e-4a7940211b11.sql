
-- Drop old vaccination tables
DROP TABLE IF EXISTS public.standard_vaccines CASCADE;
DROP TABLE IF EXISTS public.vaccination_records CASCADE;
DROP TABLE IF EXISTS public.vaccination_certificates CASCADE;
DROP TABLE IF EXISTS public.additional_vaccines CASCADE;
DROP TABLE IF EXISTS public.travel_vaccines CASCADE;

-- Childhood vaccines
CREATE TABLE public.childhood_vaccines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vaccine_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unsure',
  year_received TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, vaccine_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.childhood_vaccines TO authenticated;
GRANT ALL ON public.childhood_vaccines TO service_role;
ALTER TABLE public.childhood_vaccines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own cv" ON public.childhood_vaccines FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own cv" ON public.childhood_vaccines FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own cv" ON public.childhood_vaccines FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own cv" ON public.childhood_vaccines FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Travel vaccines (new shape)
CREATE TABLE public.travel_vaccines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  destination TEXT NOT NULL,
  vaccine_name TEXT NOT NULL,
  date_received TEXT,
  booster_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_vaccines TO authenticated;
GRANT ALL ON public.travel_vaccines TO service_role;
ALTER TABLE public.travel_vaccines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own tv" ON public.travel_vaccines FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own tv" ON public.travel_vaccines FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own tv" ON public.travel_vaccines FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own tv" ON public.travel_vaccines FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Other vaccines
CREATE TABLE public.other_vaccines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vaccine_name TEXT NOT NULL,
  date_received TEXT,
  booster_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.other_vaccines TO authenticated;
GRANT ALL ON public.other_vaccines TO service_role;
ALTER TABLE public.other_vaccines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own ov" ON public.other_vaccines FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own ov" ON public.other_vaccines FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own ov" ON public.other_vaccines FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own ov" ON public.other_vaccines FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Vaccination contraindications
CREATE TABLE public.vaccination_contraindications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  contraindication_notes TEXT,
  nothing_to_report BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccination_contraindications TO authenticated;
GRANT ALL ON public.vaccination_contraindications TO service_role;
ALTER TABLE public.vaccination_contraindications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own vco" ON public.vaccination_contraindications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own vco" ON public.vaccination_contraindications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own vco" ON public.vaccination_contraindications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own vco" ON public.vaccination_contraindications FOR DELETE TO authenticated USING (auth.uid() = user_id);
