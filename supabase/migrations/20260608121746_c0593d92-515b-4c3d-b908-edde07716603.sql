
-- Recreate policies scoped to the authenticated role instead of public

-- consents
DROP POLICY IF EXISTS "Users can delete own consents" ON public.consents;
DROP POLICY IF EXISTS "Users can insert own consents" ON public.consents;
DROP POLICY IF EXISTS "Users can update own consents" ON public.consents;
DROP POLICY IF EXISTS "Users can view own consents" ON public.consents;
CREATE POLICY "Users can view own consents" ON public.consents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consents" ON public.consents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own consents" ON public.consents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own consents" ON public.consents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- drug_intolerances
DROP POLICY IF EXISTS "select own di" ON public.drug_intolerances;
DROP POLICY IF EXISTS "insert own di" ON public.drug_intolerances;
DROP POLICY IF EXISTS "update own di" ON public.drug_intolerances;
DROP POLICY IF EXISTS "delete own di" ON public.drug_intolerances;
CREATE POLICY "select own di" ON public.drug_intolerances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own di" ON public.drug_intolerances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own di" ON public.drug_intolerances FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own di" ON public.drug_intolerances FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- hospital_stays
DROP POLICY IF EXISTS "select own hs" ON public.hospital_stays;
DROP POLICY IF EXISTS "insert own hs" ON public.hospital_stays;
DROP POLICY IF EXISTS "update own hs" ON public.hospital_stays;
DROP POLICY IF EXISTS "delete own hs" ON public.hospital_stays;
CREATE POLICY "select own hs" ON public.hospital_stays FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own hs" ON public.hospital_stays FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own hs" ON public.hospital_stays FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own hs" ON public.hospital_stays FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- medical_conditions
DROP POLICY IF EXISTS "select own mc" ON public.medical_conditions;
DROP POLICY IF EXISTS "insert own mc" ON public.medical_conditions;
DROP POLICY IF EXISTS "update own mc" ON public.medical_conditions;
DROP POLICY IF EXISTS "delete own mc" ON public.medical_conditions;
CREATE POLICY "select own mc" ON public.medical_conditions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own mc" ON public.medical_conditions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own mc" ON public.medical_conditions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own mc" ON public.medical_conditions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- medical_conditions_summary
DROP POLICY IF EXISTS "select own mcs" ON public.medical_conditions_summary;
DROP POLICY IF EXISTS "insert own mcs" ON public.medical_conditions_summary;
DROP POLICY IF EXISTS "update own mcs" ON public.medical_conditions_summary;
DROP POLICY IF EXISTS "delete own mcs" ON public.medical_conditions_summary;
CREATE POLICY "select own mcs" ON public.medical_conditions_summary FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own mcs" ON public.medical_conditions_summary FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own mcs" ON public.medical_conditions_summary FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own mcs" ON public.medical_conditions_summary FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- obstetric_history
DROP POLICY IF EXISTS "select own oh" ON public.obstetric_history;
DROP POLICY IF EXISTS "insert own oh" ON public.obstetric_history;
DROP POLICY IF EXISTS "update own oh" ON public.obstetric_history;
DROP POLICY IF EXISTS "delete own oh" ON public.obstetric_history;
CREATE POLICY "select own oh" ON public.obstetric_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own oh" ON public.obstetric_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own oh" ON public.obstetric_history FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own oh" ON public.obstetric_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- otc_supplements
DROP POLICY IF EXISTS "select own otc" ON public.otc_supplements;
DROP POLICY IF EXISTS "insert own otc" ON public.otc_supplements;
DROP POLICY IF EXISTS "update own otc" ON public.otc_supplements;
DROP POLICY IF EXISTS "delete own otc" ON public.otc_supplements;
CREATE POLICY "select own otc" ON public.otc_supplements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own otc" ON public.otc_supplements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own otc" ON public.otc_supplements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own otc" ON public.otc_supplements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- pairing_codes
DROP POLICY IF EXISTS "Users can view own pairing codes" ON public.pairing_codes;
DROP POLICY IF EXISTS "Users can insert own pairing codes" ON public.pairing_codes;
DROP POLICY IF EXISTS "Users can update own pairing codes" ON public.pairing_codes;
DROP POLICY IF EXISTS "Users can delete own pairing codes" ON public.pairing_codes;
CREATE POLICY "Users can view own pairing codes" ON public.pairing_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pairing codes" ON public.pairing_codes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pairing codes" ON public.pairing_codes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pairing codes" ON public.pairing_codes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- prescription_medications
DROP POLICY IF EXISTS "select own pm" ON public.prescription_medications;
DROP POLICY IF EXISTS "insert own pm" ON public.prescription_medications;
DROP POLICY IF EXISTS "update own pm" ON public.prescription_medications;
DROP POLICY IF EXISTS "delete own pm" ON public.prescription_medications;
CREATE POLICY "select own pm" ON public.prescription_medications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own pm" ON public.prescription_medications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own pm" ON public.prescription_medications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own pm" ON public.prescription_medications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- stopped_medications
DROP POLICY IF EXISTS "select own sm" ON public.stopped_medications;
DROP POLICY IF EXISTS "insert own sm" ON public.stopped_medications;
DROP POLICY IF EXISTS "update own sm" ON public.stopped_medications;
DROP POLICY IF EXISTS "delete own sm" ON public.stopped_medications;
CREATE POLICY "select own sm" ON public.stopped_medications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own sm" ON public.stopped_medications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own sm" ON public.stopped_medications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own sm" ON public.stopped_medications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- storage.objects avatar policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
