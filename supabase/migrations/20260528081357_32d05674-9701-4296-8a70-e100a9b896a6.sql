DROP TABLE IF EXISTS public.past_conditions;
DROP TABLE IF EXISTS public.medical_conditions;

CREATE TABLE public.medical_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  condition_name text NOT NULL,
  year text,
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_conditions TO authenticated;
GRANT ALL ON public.medical_conditions TO service_role;

ALTER TABLE public.medical_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own mc" ON public.medical_conditions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own mc" ON public.medical_conditions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own mc" ON public.medical_conditions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own mc" ON public.medical_conditions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_medical_conditions_updated_at
  BEFORE UPDATE ON public.medical_conditions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.medical_conditions_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nothing_to_report boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_conditions_summary TO authenticated;
GRANT ALL ON public.medical_conditions_summary TO service_role;

ALTER TABLE public.medical_conditions_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own mcs" ON public.medical_conditions_summary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own mcs" ON public.medical_conditions_summary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own mcs" ON public.medical_conditions_summary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own mcs" ON public.medical_conditions_summary FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_medical_conditions_summary_updated_at
  BEFORE UPDATE ON public.medical_conditions_summary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();