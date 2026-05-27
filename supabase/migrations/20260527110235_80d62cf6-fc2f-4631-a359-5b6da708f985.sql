CREATE TABLE public.lifestyle_risk (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  nothing_to_report boolean NOT NULL DEFAULT false,
  tobacco_status text,
  tobacco_products text[],
  tobacco_amount text,
  tobacco_duration text,
  tobacco_year_stopped text,
  alcohol_frequency text,
  alcohol_drinks_per_week integer,
  alcohol_type text,
  height_cm numeric,
  weight_kg numeric,
  exercise_frequency text,
  exercise_types text[],
  exercise_other text,
  exercise_duration text,
  diet_restrictions text[],
  diet_other text,
  sleep_status text,
  sleep_issues text[],
  uses_cpap boolean,
  mental_health_treated boolean,
  mental_health_conditions text[],
  mental_health_other text,
  currently_in_treatment boolean,
  treatment_type text[],
  substances text[],
  substances_other text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lifestyle_risk TO authenticated;
GRANT ALL ON public.lifestyle_risk TO service_role;

ALTER TABLE public.lifestyle_risk ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own lr" ON public.lifestyle_risk FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own lr" ON public.lifestyle_risk FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own lr" ON public.lifestyle_risk FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own lr" ON public.lifestyle_risk FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_lifestyle_risk_updated_at
BEFORE UPDATE ON public.lifestyle_risk
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();