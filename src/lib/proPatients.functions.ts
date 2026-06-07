import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPatientDisplayInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userIds: string[] }) => input)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const ids = Array.from(
      new Set((data.userIds || []).filter((s) => typeof s === "string"))
    ).slice(0, 200);
    if (ids.length === 0) return { patients: {} as Record<string, { name: string | null; email: string | null }> };

    // Verify pro has (or had) sessions for these patients
    const { data: sessions } = await supabaseAdmin
      .from("pro_sessions")
      .select("user_id")
      .eq("pro_user_id", userId)
      .in("user_id", ids);
    const allowed = new Set((sessions || []).map((s: any) => s.user_id));
    const allowedIds = ids.filter((id) => allowed.has(id));
    if (allowedIds.length === 0) return { patients: {} };

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", allowedIds);
    const profileMap = new Map<string, { first_name: string | null; last_name: string | null }>();
    for (const p of profiles || []) {
      profileMap.set(p.user_id, { first_name: p.first_name, last_name: p.last_name });
    }

    const result: Record<string, { name: string | null; email: string | null }> = {};
    for (const id of allowedIds) {
      const prof = profileMap.get(id);
      const name = prof ? [prof.first_name, prof.last_name].filter(Boolean).join(" ") : "";
      let email: string | null = null;
      if (!name) {
        const { data: userRes } = await (supabaseAdmin as any).auth.admin.getUserById(id);
        email = userRes?.user?.email || null;
      }
      result[id] = { name: name || null, email };
    }
    return { patients: result };
  });
