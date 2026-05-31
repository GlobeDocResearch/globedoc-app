REVOKE ALL ON FUNCTION public.sync_health_passport_to_record_entries() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_health_passport_to_record_entries() FROM anon;
REVOKE ALL ON FUNCTION public.sync_health_passport_to_record_entries() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_health_passport_to_record_entries() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_health_passport_to_record_entries() TO postgres;