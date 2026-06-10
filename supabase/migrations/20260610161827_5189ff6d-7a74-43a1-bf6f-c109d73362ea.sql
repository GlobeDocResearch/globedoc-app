ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pg_temp;

ALTER TABLE public.audit_log
  ADD CONSTRAINT audit_log_action_check
  CHECK (action IN (
    'setup','update','insert','delete','upsert',
    'toggle_nothing','save_all','export_json','export_pdf'
  ));

ALTER TABLE public.audit_log
  ADD CONSTRAINT audit_log_table_name_check
  CHECK (char_length(table_name) BETWEEN 1 AND 64
         AND table_name ~ '^[a-z_][a-z0-9_]*$');