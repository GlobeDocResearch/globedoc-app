ALTER TABLE public.record_entries
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS year text,
  ADD COLUMN IF NOT EXISTS icon text;

UPDATE public.record_entries
SET source = 'health_passport'
WHERE source IS NULL
  AND source_kind IN ('condition_current', 'condition_past', 'hospital_stay', 'record_location');

UPDATE public.record_entries
SET year = event_year
WHERE year IS NULL
  AND event_year IS NOT NULL;

UPDATE public.record_entries
SET icon = '🏥'
WHERE icon IS NULL
  AND COALESCE(source, '') = 'health_passport';

CREATE UNIQUE INDEX IF NOT EXISTS record_entries_health_passport_source_unique
ON public.record_entries (user_id, source, source_kind, source_id)
WHERE source = 'health_passport'
  AND source_kind IS NOT NULL
  AND source_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.health_passport_record_title(
  _source_kind text,
  _name text,
  _year text,
  _event text,
  _institution text,
  _city text,
  _country text,
  _diagnosis text,
  _record_type text
)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  cleaned_name text := nullif(btrim(coalesce(_name, '')), '');
  cleaned_year text := nullif(btrim(coalesce(_year, '')), '');
  cleaned_event text := nullif(btrim(coalesce(_event, '')), '');
  cleaned_institution text := nullif(btrim(coalesce(_institution, '')), '');
  cleaned_city text := nullif(btrim(coalesce(_city, '')), '');
  cleaned_country text := nullif(btrim(coalesce(_country, '')), '');
  cleaned_diagnosis text := nullif(btrim(coalesce(_diagnosis, '')), '');
  cleaned_record_type text := nullif(btrim(coalesce(_record_type, '')), '');
  procedure_name text;
  place_name text;
  title_head text;
BEGIN
  IF _source_kind = 'condition_current' THEN
    RETURN 'Diagnosis noted: ' || coalesce(cleaned_name, 'Condition');
  END IF;

  IF _source_kind = 'condition_past' THEN
    RETURN 'Past condition: ' || coalesce(cleaned_name, 'Condition') ||
      CASE WHEN cleaned_year IS NOT NULL THEN ' · Resolved ' || cleaned_year ELSE '' END;
  END IF;

  procedure_name := coalesce(cleaned_event, cleaned_diagnosis, cleaned_record_type, 'Hospital stay');
  place_name := coalesce(
    cleaned_institution,
    nullif(concat_ws(', ', cleaned_city, cleaned_country), ''),
    cleaned_country,
    cleaned_city
  );
  title_head := procedure_name || CASE WHEN place_name IS NOT NULL THEN ' at ' || place_name ELSE '' END;

  RETURN title_head || CASE WHEN cleaned_year IS NOT NULL THEN ' · ' || cleaned_year ELSE '' END;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_health_passport_to_record_entries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  computed_source_kind text;
  computed_title text;
  computed_year text;
  computed_icd11 text;
  computed_ichi text;
BEGIN
  IF TG_TABLE_NAME = 'medical_conditions' THEN
    computed_source_kind := CASE WHEN NEW.is_resolved THEN 'condition_past' ELSE 'condition_current' END;
    computed_year := nullif(btrim(coalesce(NEW.year, '')), '');
    computed_icd11 := nullif(btrim(coalesce(NEW.icd11_code, '')), '');
    computed_ichi := NULL;
    computed_title := public.health_passport_record_title(
      computed_source_kind,
      NEW.condition_name,
      computed_year,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL
    );
  ELSIF TG_TABLE_NAME = 'hospital_stays' THEN
    computed_source_kind := 'hospital_stay';
    computed_year := nullif(btrim(coalesce(NEW.year, '')), '');
    computed_icd11 := nullif(btrim(coalesce(NEW.diagnosis_code, '')), '');
    computed_ichi := nullif(btrim(coalesce(NEW.ichi_code, '')), '');
    computed_title := public.health_passport_record_title(
      computed_source_kind,
      NULL,
      computed_year,
      NEW.event,
      NEW.institution,
      NEW.city,
      NEW.country,
      NEW.diagnosis,
      NEW.record_type
    );
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.record_entries (
    user_id,
    entry_type,
    title,
    body,
    source,
    source_kind,
    source_id,
    event_year,
    year,
    icon,
    code_icd11,
    code_ichi,
    created_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    'clinical_note',
    computed_title,
    NULL,
    'health_passport',
    computed_source_kind,
    NEW.id,
    computed_year,
    computed_year,
    '🏥',
    computed_icd11,
    computed_ichi,
    now(),
    now()
  )
  ON CONFLICT (user_id, source, source_kind, source_id)
  WHERE source = 'health_passport'
    AND source_kind IS NOT NULL
    AND source_id IS NOT NULL
  DO UPDATE SET
    title = EXCLUDED.title,
    source = EXCLUDED.source,
    source_kind = EXCLUDED.source_kind,
    source_id = EXCLUDED.source_id,
    event_year = EXCLUDED.event_year,
    year = EXCLUDED.year,
    icon = EXCLUDED.icon,
    code_icd11 = EXCLUDED.code_icd11,
    code_ichi = EXCLUDED.code_ichi,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_medical_conditions_to_record_entries ON public.medical_conditions;
CREATE TRIGGER sync_medical_conditions_to_record_entries
AFTER INSERT OR UPDATE ON public.medical_conditions
FOR EACH ROW
EXECUTE FUNCTION public.sync_health_passport_to_record_entries();

DROP TRIGGER IF EXISTS sync_hospital_stays_to_record_entries ON public.hospital_stays;
CREATE TRIGGER sync_hospital_stays_to_record_entries
AFTER INSERT OR UPDATE ON public.hospital_stays
FOR EACH ROW
EXECUTE FUNCTION public.sync_health_passport_to_record_entries();