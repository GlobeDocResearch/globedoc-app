import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/connect/revoke")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const token = typeof body.session_token === "string" ? body.session_token : "";
          if (!token) return json({ error: "Missing session_token" }, 400);
          const { data, error } = await supabaseAdmin
            .from("pro_sessions")
            .update({ revoked_at: new Date().toISOString() })
            .eq("session_token", token)
            .select("id, revoked_at");
          if (error) throw error;
          if (!data || data.length === 0) return json({ error: "Session not found" }, 404);
          return json({ ok: true, revoked_at: data[0].revoked_at });
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
