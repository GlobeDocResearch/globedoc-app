ALTER TABLE public.lifestyle_risk
  ADD COLUMN IF NOT EXISTS alcohol_units_per_week text,
  ADD COLUMN IF NOT EXISTS narcotics_status text,
  ADD COLUMN IF NOT EXISTS narcotics_substances text[],
  ADD COLUMN IF NOT EXISTS narcotics_substances_other text,
  ADD COLUMN IF NOT EXISTS narcotics_use_status text,
  ADD COLUMN IF NOT EXISTS narcotics_ever_injected boolean;