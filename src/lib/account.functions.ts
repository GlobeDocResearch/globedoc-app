import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TABLES = [
  "profiles",
  "consents",
  "medical_conditions",
  "medical_conditions_summary",
  "hospital_stays",
  "obstetric_history",
  "prescription_medications",
  "otc_supplements",
  "stopped_medications",
  "drug_intolerances",
  "vaccination_records",
  "standard_vaccines",
  "travel_vaccines",
  "vaccination_certificates",
  "additional_vaccines",
  "pairing_codes",
  "audit_log",
] as const;

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    for (const tbl of TABLES) {
      await supabaseAdmin.from(tbl).delete().eq("user_id", userId);
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
