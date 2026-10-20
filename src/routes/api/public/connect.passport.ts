import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/connect/passport")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = request.headers.get("x-session-token");
        if (!token) return json({ error: "Missing token" }, 401);

        const { data: session } = await supabaseAdmin
          .from("pro_sessions")
          .select("id, user_id, pro_name, pro_title, institution, access_level, expires_at, revoked_at")
          .eq("session_token", token)
          .maybeSingle();
        if (!session) return json({ error: "Invalid session" }, 401);
        if (session.revoked_at) return json({ error: "Access revoked" }, 403);
        if (new Date(session.expires_at).getTime() < Date.now()) return json({ error: "Session expired" }, 403);
        // Access level enforcement: passport tab requires passport-level access.
        const level = String(session.access_level || "");
        if (level === "records_only" || level === "records_add") {
          return json({ error: "Insufficient access level for passport" }, 403);
        }


        await supabaseAdmin
          .from("pro_sessions")
          .update({ last_accessed_at: new Date().toISOString() })
          .eq("id", session.id);

        const uid = session.user_id;
        const sb = supabaseAdmin as any;
        const [
          profile, mc, mcs, hs, pm, ot, sm, di,
          cv, tv, ov, vco,
          lr,
          hsum, hp, hc, hsib, hgt,
          asum, da, fa, ea, ca, adi,
          records,
        ] = await Promise.all([
          supabaseAdmin.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
          supabaseAdmin.from("medical_conditions").select("*").eq("user_id", uid),
          supabaseAdmin.from("medical_conditions_summary").select("*").eq("user_id", uid).maybeSingle(),
          supabaseAdmin.from("hospital_stays").select("*").eq("user_id", uid),
          supabaseAdmin.from("prescription_medications").select("*").eq("user_id", uid),
          supabaseAdmin.from("otc_supplements").select("*").eq("user_id", uid),
          supabaseAdmin.from("stopped_medications").select("*").eq("user_id", uid),
          supabaseAdmin.from("drug_intolerances").select("*").eq("user_id", uid).maybeSingle(),
          sb.from("childhood_vaccines").select("*").eq("user_id", uid),
          sb.from("travel_vaccines").select("*").eq("user_id", uid),
          sb.from("other_vaccines").select("*").eq("user_id", uid),
          sb.from("vaccination_contraindications").select("*").eq("user_id", uid).maybeSingle(),
          sb.from("lifestyle_risk").select("*").eq("user_id", uid).maybeSingle(),
          sb.from("heredity_summary").select("*").eq("user_id", uid).maybeSingle(),
          sb.from("heredity_parents").select("*").eq("user_id", uid),
          sb.from("heredity_conditions").select("*").eq("user_id", uid),
          sb.from("heredity_siblings").select("*").eq("user_id", uid).maybeSingle(),
          sb.from("heredity_genetic_testing").select("*").eq("user_id", uid).maybeSingle(),
          sb.from("allergies_summary").select("*").eq("user_id", uid).maybeSingle(),
          sb.from("drug_allergies").select("*").eq("user_id", uid),
          sb.from("food_allergies").select("*").eq("user_id", uid),
          sb.from("environmental_allergies").select("*").eq("user_id", uid),
          sb.from("contrast_allergies").select("*").eq("user_id", uid),
          sb.from("allergy_drug_intolerances").select("*").eq("user_id", uid),
          supabaseAdmin.from("record_entries").select("id, entry_type, title, body, file_path, file_name, file_mime, author_name, author_role, created_at").eq("user_id", uid).order("created_at", { ascending: false }),
        ]);

        const patientName = [profile.data?.first_name, profile.data?.last_name].filter(Boolean).join(" ") || "Patient";

        return json({
          session: {
            pro_name: session.pro_name,
            pro_title: session.pro_title,
            institution: session.institution,
            access_level: session.access_level,
            expires_at: session.expires_at,
          },
          patient: {
            name: patientName,
            date_of_birth: profile.data?.date_of_birth,
            biological_sex: profile.data?.biological_sex,
            nationality: profile.data?.nationality,
            blood_group: profile.data?.blood_group,
            gender_identity: profile.data?.gender_identity,
            gender_identity_description: profile.data?.gender_identity_description,
            pronouns: profile.data?.pronouns,
          },
          medical_history: {
            summary: mcs.data,
            conditions: mc.data || [],
            hospital_stays: hs.data || [],
          },
          medications: {
            prescription: pm.data || [],
            otc: ot.data || [],
            stopped: sm.data || [],
            intolerances: di.data,
          },
          vaccinations: {
            childhood: cv.data || [],
            travel: tv.data || [],
            other: ov.data || [],
            contraindications: vco.data,
          },
          lifestyle: lr.data,
          heredity: {
            summary: hsum.data,
            parents: hp.data || [],
            conditions: hc.data || [],
            siblings: hsib.data,
            genetic_testing: hgt.data,
          },
          allergies: {
            summary: asum.data,
            drug: da.data || [],
            food: fa.data || [],
            environmental: ea.data || [],
            contrast: ca.data || [],
            drug_intolerances: adi.data || [],
          },
          records: records.data || [],
        });
      },
    },
  },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
