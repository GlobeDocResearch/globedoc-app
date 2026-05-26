
-- medical_conditions
CREATE TABLE public.medical_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  conditions_text text,
  nothing_to_report boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own mc" ON public.medical_conditions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own mc" ON public.medical_conditions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own mc" ON public.medical_conditions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own mc" ON public.medical_conditions FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER mc_updated BEFORE UPDATE ON public.medical_conditions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- hospital_stays
CREATE TABLE public.hospital_stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event text,
  year text,
  hospital_country text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hospital_stays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own hs" ON public.hospital_stays FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own hs" ON public.hospital_stays FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own hs" ON public.hospital_stays FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own hs" ON public.hospital_stays FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER hs_updated BEFORE UPDATE ON public.hospital_stays FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- past_conditions
CREATE TABLE public.past_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  conditions_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.past_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own pc" ON public.past_conditions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own pc" ON public.past_conditions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own pc" ON public.past_conditions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own pc" ON public.past_conditions FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER pc_updated BEFORE UPDATE ON public.past_conditions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- obstetric_history
CREATE TABLE public.obstetric_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  not_applicable boolean NOT NULL DEFAULT false,
  gave_birth boolean,
  num_children integer,
  complications text,
  assisted_reproduction boolean,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.obstetric_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own oh" ON public.obstetric_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own oh" ON public.obstetric_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own oh" ON public.obstetric_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own oh" ON public.obstetric_history FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER oh_updated BEFORE UPDATE ON public.obstetric_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- audit_log
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  table_name text NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own audit" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own audit" ON public.audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);
