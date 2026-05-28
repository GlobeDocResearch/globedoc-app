
-- Allergies tables
CREATE TABLE public.drug_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  drug_name TEXT NOT NULL,
  reaction TEXT,
  is_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drug_allergies TO authenticated;
GRANT ALL ON public.drug_allergies TO service_role;
ALTER TABLE public.drug_allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own da" ON public.drug_allergies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own da" ON public.drug_allergies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own da" ON public.drug_allergies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own da" ON public.drug_allergies FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.food_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  food_item TEXT NOT NULL,
  reaction TEXT,
  is_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_allergies TO authenticated;
GRANT ALL ON public.food_allergies TO service_role;
ALTER TABLE public.food_allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own fa" ON public.food_allergies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own fa" ON public.food_allergies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own fa" ON public.food_allergies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own fa" ON public.food_allergies FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.environmental_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  allergen TEXT NOT NULL,
  reaction TEXT,
  is_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.environmental_allergies TO authenticated;
GRANT ALL ON public.environmental_allergies TO service_role;
ALTER TABLE public.environmental_allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own ea" ON public.environmental_allergies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own ea" ON public.environmental_allergies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own ea" ON public.environmental_allergies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own ea" ON public.environmental_allergies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Note: existing public.drug_intolerances is a free-text/nothing-to-report table used by Medications.
-- Create a separate structured table for the Allergies section's drug intolerances.
CREATE TABLE public.allergy_drug_intolerances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  drug_name TEXT NOT NULL,
  symptom TEXT,
  is_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.allergy_drug_intolerances TO authenticated;
GRANT ALL ON public.allergy_drug_intolerances TO service_role;
ALTER TABLE public.allergy_drug_intolerances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own adi" ON public.allergy_drug_intolerances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own adi" ON public.allergy_drug_intolerances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own adi" ON public.allergy_drug_intolerances FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own adi" ON public.allergy_drug_intolerances FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Top-level "nothing to report" toggle for Allergies section
CREATE TABLE public.allergies_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  nothing_to_report BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.allergies_summary TO authenticated;
GRANT ALL ON public.allergies_summary TO service_role;
ALTER TABLE public.allergies_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own asum" ON public.allergies_summary FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own asum" ON public.allergies_summary FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own asum" ON public.allergies_summary FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own asum" ON public.allergies_summary FOR DELETE TO authenticated USING (auth.uid() = user_id);
