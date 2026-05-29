ALTER TABLE public.childhood_vaccines REPLICA IDENTITY FULL;
ALTER TABLE public.travel_vaccines REPLICA IDENTITY FULL;
ALTER TABLE public.other_vaccines REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.childhood_vaccines; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.travel_vaccines; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.other_vaccines; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;