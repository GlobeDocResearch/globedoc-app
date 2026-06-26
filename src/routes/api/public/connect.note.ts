import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/connect/note")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-session-token");
        if (!token) return json({ error: "Missing token" }, 401);
        const body = await request.json().catch(() => ({}));
        const text = String(body.body || "").trim();
        const title = String(body.title || "Clinical note").trim().slice(0, 200);
        if (!text) return json({ error: "Note body required" }, 400);
        if (text.length > 10000) return json({ error: "Note too long" }, 400);

        const { data: session } = await supabaseAdmin
          .from("pro_sessions")
          .select("id, user_id, pro_name, pro_title, access_level, expires_at, revoked_at")
          .eq("session_token", token)
          .maybeSingle();
        if (!session) return json({ error: "Invalid session" }, 401);
        if (session.revoked_at) return json({ error: "Access revoked" }, 403);
        if (new Date(session.expires_at).getTime() < Date.now()) return json({ error: "Session expired" }, 403);
        // Write access required: only records_add and passport_suggest may add notes.
        const level = String(session.access_level || "");
        if (level !== "records_add" && level !== "passport_suggest") {
          return json({ error: "Insufficient access level to add notes" }, 403);
        }


        const { data: entry, error } = await supabaseAdmin
          .from("record_entries")
          .insert({
            user_id: session.user_id,
            entry_type: "clinical_note",
            title,
            body: text,
            author_name: session.pro_name,
            author_role: session.pro_title || "Clinician",
            pro_session_id: session.id,
          } as any)
          .select("id")
          .single();
        if (error) return json({ error: error.message }, 500);

        await supabaseAdmin
          .from("pro_sessions")
          .update({ last_accessed_at: new Date().toISOString() })
          .eq("id", session.id);

        return json({ id: entry.id });
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
