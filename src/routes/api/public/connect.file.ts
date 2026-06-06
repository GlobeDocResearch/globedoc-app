import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/connect/file")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = request.headers.get("x-session-token");
        if (!token) return json({ error: "Missing token" }, 401);
        const url = new URL(request.url);
        const entryId = url.searchParams.get("entry_id");
        if (!entryId) return json({ error: "Missing entry_id" }, 400);

        const { data: session } = await supabaseAdmin
          .from("pro_sessions")
          .select("id, user_id, expires_at, revoked_at")
          .eq("session_token", token)
          .maybeSingle();
        if (!session) return json({ error: "Invalid session" }, 401);
        if (session.revoked_at) return json({ error: "Access revoked" }, 403);
        if (new Date(session.expires_at).getTime() < Date.now()) return json({ error: "Session expired" }, 403);

        const { data: entry } = await supabaseAdmin
          .from("record_entries")
          .select("file_path, file_mime, file_name, user_id")
          .eq("id", entryId)
          .maybeSingle();
        if (!entry || entry.user_id !== session.user_id) return json({ error: "Not found" }, 404);
        if (!entry.file_path) return json({ error: "No file" }, 404);

        const { data: signed, error } = await supabaseAdmin.storage
          .from("records")
          .createSignedUrl(entry.file_path, 60 * 10);
        if (error || !signed) return json({ error: error?.message || "Could not sign" }, 500);

        return json({ url: signed.signedUrl, mime: entry.file_mime, name: entry.file_name });
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
