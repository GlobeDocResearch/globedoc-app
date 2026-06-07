import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { randomBytes } from "crypto";

export const Route = createFileRoute("/api/public/connect/pair")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const code = String(body.code || "").trim().toUpperCase();
          const proName = String(body.pro_name || "").trim();
          const proTitle = String(body.pro_title || "").trim() || null;
          const institution = String(body.institution || "").trim() || null;
          const accessLevel = String(body.access_level || "passport_records");
          const gdpr = !!body.gdpr_consent;
          const proUserId = typeof body.pro_user_id === "string" && body.pro_user_id.length > 0 ? body.pro_user_id : null;

          if (code.length !== 6) return json({ error: "Invalid code" }, 400);
          if (!proName) return json({ error: "Name required" }, 400);
          if (!gdpr) return json({ error: "Consent required" }, 400);
          if (!["passport_records", "records_only", "records_add", "passport_suggest"].includes(accessLevel)) {
            return json({ error: "Invalid access level" }, 400);
          }

          // Look up the pairing code
          const { data: pc, error: pcErr } = await supabaseAdmin
            .from("pairing_codes")
            .select("id, user_id, expires_at, used, validity_minutes, reason_chips, reason_text")
            .eq("code", code)
            .maybeSingle();
          if (pcErr) throw pcErr;
          if (!pc) return json({ error: "Code not found" }, 404);
          if (pc.used) return json({ error: "Code already used" }, 410);
          if (new Date(pc.expires_at).getTime() < Date.now()) return json({ error: "Code expired" }, 410);

          // Duplicate prevention: check for an existing active session with same pro identity
          const nowIso = new Date().toISOString();
          const { data: existing } = await supabaseAdmin
            .from("pro_sessions")
            .select("id, pro_name, pro_title, institution, expires_at")
            .eq("user_id", pc.user_id)
            .eq("pro_name", proName)
            .is("revoked_at", null)
            .gt("expires_at", nowIso)
            .order("expires_at", { ascending: false })
            .limit(1);
          const match = (existing || []).find(
            (r: any) => (r.institution || null) === institution,
          );
          if (match) {
            // Fetch patient name for the dialog message
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("first_name, last_name")
              .eq("user_id", pc.user_id)
              .maybeSingle();
            const patientName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Patient";
            return json({
              duplicate: true,
              existing_session_id: match.id,
              pro_name: match.pro_name,
              current_expires_at: match.expires_at,
              patient_name: patientName,
              code,
            }, 200);
          }

          // Session expires after the same validity window the patient chose for the code
          const validityMin = (pc as any).validity_minutes || 60;
          const sessionExpires = new Date(Date.now() + validityMin * 60 * 1000).toISOString();
          const sessionToken = randomBytes(32).toString("hex");

          const { data: session, error: sErr } = await supabaseAdmin
            .from("pro_sessions")
            .insert({
              user_id: pc.user_id,
              pro_user_id: proUserId,
              pairing_code_id: pc.id,
              pro_name: proName,
              pro_title: proTitle,
              institution,
              access_level: accessLevel,
              session_token: sessionToken,
              expires_at: sessionExpires,
              last_accessed_at: new Date().toISOString(),
            })
            .select("id, expires_at")
            .single();
          if (sErr) throw sErr;

          await supabaseAdmin.from("pairing_codes").update({ used: true }).eq("id", pc.id);

          // Fetch patient name
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("first_name, last_name")
            .eq("user_id", pc.user_id)
            .maybeSingle();
          const patientName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Patient";

          return json({
            session_token: sessionToken,
            expires_at: session.expires_at,
            patient_name: patientName,
            access_level: accessLevel,
          });
        } catch (e: any) {
          return json({ error: e.message || "Internal error" }, 500);
        }
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
