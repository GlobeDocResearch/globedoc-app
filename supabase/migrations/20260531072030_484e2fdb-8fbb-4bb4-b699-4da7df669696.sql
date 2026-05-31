CREATE TABLE public.beta_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('patient','pro')),
  q1_impression smallint CHECK (q1_impression BETWEEN 1 AND 5),
  q2_real_problem smallint CHECK (q2_real_problem BETWEEN 1 AND 5),
  q3_likelihood smallint CHECK (q3_likelihood BETWEEN 1 AND 5),
  q4_recommend smallint CHECK (q4_recommend BETWEEN 1 AND 5),
  q5_willingness_to_pay text,
  q6_open_feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.beta_survey_responses TO authenticated;
GRANT ALL ON public.beta_survey_responses TO service_role;

ALTER TABLE public.beta_survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert own beta survey"
ON public.beta_survey_responses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "select own beta survey"
ON public.beta_survey_responses FOR SELECT TO authenticated
USING (auth.uid() = user_id);