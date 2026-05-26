CREATE TABLE public.pairing_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_pairing_codes_user_id ON public.pairing_codes(user_id);
CREATE INDEX idx_pairing_codes_code ON public.pairing_codes(code);

ALTER TABLE public.pairing_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pairing codes"
ON public.pairing_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pairing codes"
ON public.pairing_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pairing codes"
ON public.pairing_codes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pairing codes"
ON public.pairing_codes FOR DELETE
USING (auth.uid() = user_id);