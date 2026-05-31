ALTER TABLE public.record_entries
  ADD COLUMN IF NOT EXISTS source_kind TEXT,
  ADD COLUMN IF NOT EXISTS source_id UUID,
  ADD COLUMN IF NOT EXISTS event_year TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS record_entries_source_unique
  ON public.record_entries (user_id, source_kind, source_id)
  WHERE source_kind IS NOT NULL AND source_id IS NOT NULL;