import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/connect/extend")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const code = String(body.code || "").trim().toUpperCase();
          const proName = String(body.pro_name || "").trim();
          const institution = String(body.institution || "").trim() || null;
          const minutes = Number(body.minutes);

          if (code.length !== 6) return json({ error: "Invalid code" }, 400);
          if (!proName) return json({ error: "Name required" }, 400);
          if (![10, 60, 60 * 24, 60 * 24 * 7].includes(minutes)) {
            return json({ error: "Invalid duration" }, 400);
          }

          // Validate the pairing code
          const { data: pc, error: pcErr } = await supabaseAdmin
            .from("pairing_codes")
            .select("id, user_id, expires_at, used")
            .eq("code", code)
            .maybeSingle();
          if (pcErr) throw pcErr;
          if (!pc) return json({ error: "Code not found" }, 404);
          if (pc.used) return json({ error: "Code already used" }, 410);
          if (new Date(pc.expires_at).getTime() < Date.now()) return json({ error: "Code expired" }, 410);

          // Find matching active session for this patient + pro
          const nowIso = new Date().toISOString();
          const { data: rows, error: sErr } = await supabaseAdmin
            .from("pro_sessions")
            .select("id, pro_name, institution, session_token, expires_at, access_level")
            .eq("user_id", pc.user_id)
            .eq("pro_name", proName)
            .is("revoked_at", null)
            .gt("expires_at", nowIso)
            .order("expires_at", { ascending: false });
          if (sErr) throw sErr;
          const match = (rows || []).find((r: any) => (r.institution || null) === institution);
          if (!match) return json({ error: "No active session to extend" }, 404);

          const newExpires = new Date(Date.now() + minutes * 60 * 1000).toISOString();
          const { error: upErr } = await supabaseAdmin
            .from("pro_sessions")
            .update({ expires_at: newExpires, last_accessed_at: new Date().toISOString() })
            .eq("id", match.id);
          if (upErr) throw upErr;

          await supabaseAdmin.from("pairing_codes").update({ used: true }).eq("id", pc.id);

          // Fetch patient name
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("first_name, last_name")
            .eq("user_id", pc.user_id)
            .maybeSingle();
          const patientName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Patient";

          return json({
            session_token: match.session_token,
            expires_at: newExpires,
            patient_name: patientName,
            access_level: match.access_level,
            extended: true,
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
