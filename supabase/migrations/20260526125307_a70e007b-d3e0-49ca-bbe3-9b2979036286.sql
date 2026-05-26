
CREATE TABLE public.prescription_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  drug_generic text,
  brand_name text,
  dose_form text,
  frequency text,
  prescriber text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prescription_medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own pm" ON public.prescription_medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own pm" ON public.prescription_medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own pm" ON public.prescription_medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own pm" ON public.prescription_medications FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_pm_updated BEFORE UPDATE ON public.prescription_medications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.otc_supplements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product text,
  dose text,
  frequency text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.otc_supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own otc" ON public.otc_supplements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own otc" ON public.otc_supplements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own otc" ON public.otc_supplements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own otc" ON public.otc_supplements FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_otc_updated BEFORE UPDATE ON public.otc_supplements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.stopped_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  drug_generic text,
  dose text,
  period text,
  reason_stopped text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stopped_medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own sm" ON public.stopped_medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own sm" ON public.stopped_medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own sm" ON public.stopped_medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own sm" ON public.stopped_medications FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_sm_updated BEFORE UPDATE ON public.stopped_medications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.drug_intolerances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  intolerances_text text,
  nothing_to_report boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.drug_intolerances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own di" ON public.drug_intolerances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own di" ON public.drug_intolerances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own di" ON public.drug_intolerances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own di" ON public.drug_intolerances FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_di_updated BEFORE UPDATE ON public.drug_intolerances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
