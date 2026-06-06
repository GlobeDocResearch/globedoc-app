import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/connect/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const tokens = Array.isArray(body.tokens)
            ? body.tokens.filter((t: any) => typeof t === "string").slice(0, 200)
            : [];
          if (tokens.length === 0) return json({ sessions: [] });

          const { data: rows, error } = await supabaseAdmin
            .from("pro_sessions")
            .select("session_token, user_id, paired_at, expires_at, revoked_at")
            .in("session_token", tokens);
          if (error) throw error;

          const userIds = Array.from(new Set((rows || []).map((r: any) => r.user_id)));
          let nameByUser = new Map<string, string>();
          if (userIds.length > 0) {
            const { data: profiles } = await supabaseAdmin
              .from("profiles")
              .select("user_id, first_name, last_name")
              .in("user_id", userIds);
            for (const p of profiles || []) {
              const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Patient";
              nameByUser.set(p.user_id, name);
            }
          }

          const sessions = (rows || []).map((r: any) => ({
            session_token: r.session_token,
            patient_name: nameByUser.get(r.user_id) || "Patient",
            paired_at: r.paired_at,
            expires_at: r.expires_at,
            revoked_at: r.revoked_at,
          }));
          return json({ sessions });
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
