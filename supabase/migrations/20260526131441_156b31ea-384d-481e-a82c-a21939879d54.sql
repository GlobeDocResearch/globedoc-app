-- vaccination_records
CREATE TABLE public.vaccination_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vaccine TEXT,
  date TEXT,
  batch_number TEXT,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own vr" ON public.vaccination_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own vr" ON public.vaccination_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own vr" ON public.vaccination_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own vr" ON public.vaccination_records FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_vr_updated BEFORE UPDATE ON public.vaccination_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- standard_vaccines
CREATE TABLE public.standard_vaccines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vaccine_name TEXT NOT NULL,
  received BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, vaccine_name)
);
ALTER TABLE public.standard_vaccines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own sv" ON public.standard_vaccines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own sv" ON public.standard_vaccines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own sv" ON public.standard_vaccines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own sv" ON public.standard_vaccines FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_sv_updated BEFORE UPDATE ON public.standard_vaccines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- travel_vaccines
CREATE TABLE public.travel_vaccines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vaccine TEXT,
  date TEXT,
  destination TEXT,
  valid_until TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.travel_vaccines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own tv" ON public.travel_vaccines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own tv" ON public.travel_vaccines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own tv" ON public.travel_vaccines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own tv" ON public.travel_vaccines FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_tv_updated BEFORE UPDATE ON public.travel_vaccines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- vaccination_certificates
CREATE TABLE public.vaccination_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  ihr_card TEXT,
  contraindication_notes TEXT,
  nothing_to_report BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vaccination_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own vc" ON public.vaccination_certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own vc" ON public.vaccination_certificates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own vc" ON public.vaccination_certificates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own vc" ON public.vaccination_certificates FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_vc_updated BEFORE UPDATE ON public.vaccination_certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();