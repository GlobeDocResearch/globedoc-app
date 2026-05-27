
CREATE TABLE public.heredity_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  nothing_to_report BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.heredity_summary TO authenticated;
GRANT ALL ON public.heredity_summary TO service_role;
ALTER TABLE public.heredity_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own hsum" ON public.heredity_summary FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own hsum" ON public.heredity_summary FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own hsum" ON public.heredity_summary FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own hsum" ON public.heredity_summary FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.heredity_parents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('father','mother')),
  unknown BOOLEAN NOT NULL DEFAULT false,
  living_status TEXT,
  current_age INTEGER,
  age_at_death INTEGER,
  cause_of_death TEXT,
  known_conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, parent_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.heredity_parents TO authenticated;
GRANT ALL ON public.heredity_parents TO service_role;
ALTER TABLE public.heredity_parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own hp" ON public.heredity_parents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own hp" ON public.heredity_parents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own hp" ON public.heredity_parents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own hp" ON public.heredity_parents FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.heredity_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  condition_name TEXT NOT NULL,
  which_relative TEXT,
  other_specify TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, condition_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.heredity_conditions TO authenticated;
GRANT ALL ON public.heredity_conditions TO service_role;
ALTER TABLE public.heredity_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own hc" ON public.heredity_conditions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own hc" ON public.heredity_conditions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own hc" ON public.heredity_conditions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own hc" ON public.heredity_conditions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.heredity_siblings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  has_siblings BOOLEAN,
  sibling_count INTEGER,
  sibling_conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.heredity_siblings TO authenticated;
GRANT ALL ON public.heredity_siblings TO service_role;
ALTER TABLE public.heredity_siblings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own hs" ON public.heredity_siblings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own hs" ON public.heredity_siblings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own hs" ON public.heredity_siblings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own hs" ON public.heredity_siblings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.heredity_genetic_testing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tested BOOLEAN,
  findings TEXT,
  under_counselling BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.heredity_genetic_testing TO authenticated;
GRANT ALL ON public.heredity_genetic_testing TO service_role;
ALTER TABLE public.heredity_genetic_testing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own hgt" ON public.heredity_genetic_testing FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own hgt" ON public.heredity_genetic_testing FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own hgt" ON public.heredity_genetic_testing FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own hgt" ON public.heredity_genetic_testing FOR DELETE TO authenticated USING (auth.uid() = user_id);
