ALTER TABLE public.pairing_codes
  ADD COLUMN IF NOT EXISTS reason_chips text[],
  ADD COLUMN IF NOT EXISTS reason_text text;

ALTER TABLE public.pro_sessions
  ADD COLUMN IF NOT EXISTS reason_chips text[],
  ADD COLUMN IF NOT EXISTS reason_text text;