-- Add detail columns to existing allergy tables
ALTER TABLE public.drug_allergies
  ADD COLUMN IF NOT EXISTS reaction_type text,
  ADD COLUMN IF NOT EXISTS severity text,
  ADD COLUMN IF NOT EXISTS carry_epipen boolean NOT NULL DEFAULT false;

ALTER TABLE public.food_allergies
  ADD COLUMN IF NOT EXISTS reaction_type text,
  ADD COLUMN IF NOT EXISTS severity text,
  ADD COLUMN IF NOT EXISTS carry_epipen boolean NOT NULL DEFAULT false;

ALTER TABLE public.environmental_allergies
  ADD COLUMN IF NOT EXISTS reaction_type text,
  ADD COLUMN IF NOT EXISTS severity text,
  ADD COLUMN IF NOT EXISTS carry_epipen boolean NOT NULL DEFAULT false;

-- New contrast & anaesthetic reactions table
CREATE TABLE public.contrast_allergies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agent text NOT NULL,
  reaction text,
  reaction_type text,
  severity text,
  carry_epipen boolean NOT NULL DEFAULT false,
  is_preset boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrast_allergies TO authenticated;
GRANT ALL ON public.contrast_allergies TO service_role;

ALTER TABLE public.contrast_allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own ca" ON public.contrast_allergies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own ca" ON public.contrast_allergies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own ca" ON public.contrast_allergies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own ca" ON public.contrast_allergies FOR DELETE TO authenticated USING (auth.uid() = user_id);