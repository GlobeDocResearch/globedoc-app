ALTER TABLE public.record_entries ADD COLUMN IF NOT EXISTS code_icd11 text;
ALTER TABLE public.record_entries ADD COLUMN IF NOT EXISTS code_ichi text;
ALTER TABLE public.hospital_stays ADD COLUMN IF NOT EXISTS diagnosis_code text;