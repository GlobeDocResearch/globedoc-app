import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/connect/entry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = request.headers.get("x-session-token");
          if (!token) return json({ error: "Missing token" }, 401);
          const body = await request.json();
          const type = String(body.type || "clinical_note");
          const title = String(body.title || "").trim().slice(0, 200);
          const text = String(body.body || "").trim();
          const fileBase64 = body.file_base64 as string | undefined;
          const fileName = body.file_name as string | undefined;
          const fileMime = body.file_mime as string | undefined;

          if (!["clinical_note", "document", "suggestion"].includes(type)) {
            return json({ error: "Invalid type" }, 400);
          }
          if (!title) return json({ error: "Title required" }, 400);
          if (type === "clinical_note" && !text) return json({ error: "Body required" }, 400);
          if (type === "suggestion" && !text) return json({ error: "Suggestion text required" }, 400);

          const { data: session } = await supabaseAdmin
            .from("pro_sessions")
            .select("id, user_id, pro_name, pro_title, expires_at, revoked_at")
            .eq("session_token", token)
            .maybeSingle();
          if (!session) return json({ error: "Invalid session" }, 401);
          if (session.revoked_at) return json({ error: "Access revoked" }, 403);
          if (new Date(session.expires_at).getTime() < Date.now()) return json({ error: "Session expired" }, 403);

          let file_path: string | null = null;
          let file_size: number | null = null;
          if (type === "document") {
            if (!fileBase64 || !fileName) return json({ error: "File required" }, 400);
            const buf = Buffer.from(fileBase64, "base64");
            if (buf.byteLength > 25 * 1024 * 1024) return json({ error: "File too large" }, 400);
            const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
            const path = `${session.user_id}/pro-${crypto.randomUUID()}${ext ? "." + ext : ""}`;
            const { error: upErr } = await supabaseAdmin.storage.from("records").upload(path, buf, {
              contentType: fileMime || "application/octet-stream",
              upsert: false,
            });
            if (upErr) return json({ error: upErr.message }, 500);
            file_path = path;
            file_size = buf.byteLength;
          }

          const labelMap: Record<string, string> = {
            clinical_note: "clinical_note",
            document: "document",
            suggestion: "note",
          };
          const finalTitle = type === "suggestion" ? `Passport suggestion: ${title}` : title;

          const { data: entry, error } = await supabaseAdmin
            .from("record_entries")
            .insert({
              user_id: session.user_id,
              entry_type: labelMap[type],
              title: finalTitle,
              body: text || null,
              file_path,
              file_name: fileName || null,
              file_mime: fileMime || null,
              file_size,
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
