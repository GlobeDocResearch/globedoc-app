
-- Add DNA test fields to heredity_genetic_testing
ALTER TABLE public.heredity_genetic_testing
  ADD COLUMN IF NOT EXISTS dna_tests text[],
  ADD COLUMN IF NOT EXISTS dna_other text,
  ADD COLUMN IF NOT EXISTS dna_file_path text,
  ADD COLUMN IF NOT EXISTS dna_file_name text;

-- Create private storage bucket for raw DNA files
INSERT INTO storage.buckets (id, name, public)
VALUES ('dna-files', 'dna-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies: users access only their own folder
CREATE POLICY "Users can read own DNA files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'dna-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own DNA files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dna-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own DNA files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'dna-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own DNA files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'dna-files' AND auth.uid()::text = (storage.foldername(name))[1]);
