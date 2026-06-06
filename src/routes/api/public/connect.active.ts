import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/connect/active")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const tokens = Array.isArray(body.tokens) ? body.tokens.filter((t: any) => typeof t === "string").slice(0, 200) : [];
          if (tokens.length === 0) return json({ active: [] });
          const nowIso = new Date().toISOString();
          const { data, error } = await supabaseAdmin
            .from("pro_sessions")
            .select("session_token")
            .in("session_token", tokens)
            .is("revoked_at", null)
            .gt("expires_at", nowIso);
          if (error) throw error;
          return json({ active: (data || []).map((r: any) => r.session_token) });
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
