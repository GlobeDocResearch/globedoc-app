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
          // Access level is fixed server-side; callers cannot choose or escalate it.
          const accessLevel = "passport_records";
          const gdpr = !!body.gdpr_consent;
          const proUserId = typeof body.pro_user_id === "string" && body.pro_user_id.length > 0 ? body.pro_user_id : null;

          const ipHash = await hashIp(request);
          // Per-IP limit: max 5 failed attempts per 10 minutes.
          const since = new Date(Date.now() - IP_WINDOW_MS).toISOString();
          const { count: ipFails } = await supabaseAdmin
            .from("pairing_failed_attempts")
            .select("id", { count: "exact", head: true })
            .eq("ip_hash", ipHash)
            .gte("created_at", since);
          if ((ipFails ?? 0) >= MAX_IP_FAILS) {
            return json({ error: "Too many attempts. Please wait 10 minutes and try again." }, 429);
          }
          const fail = async (reason: string, body: unknown, status: number) => {
            await supabaseAdmin.from("pairing_failed_attempts").insert({ ip_hash: ipHash, reason });
            console.warn(`[pairing] failed redemption: ${reason}`);
            return json(body, status);
          };

          if (code.length !== CODE_LENGTH) return fail("invalid_format", { error: "Invalid code" }, 400);
          if (!proName) return json({ error: "Name required" }, 400);
          if (!gdpr) return json({ error: "Consent required" }, 400);

          // Look up the pairing code
          const { data: pc, error: pcErr } = await supabaseAdmin
            .from("pairing_codes")
            .select("id, user_id, expires_at, used, validity_minutes, reason_chips, reason_text, failed_attempts")
            .eq("code", code)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (pcErr) throw pcErr;
          if (!pc) return fail("not_found", { error: "Code not found" }, 404);
          const failForCode = async (reason: string, body: unknown, status: number) => {
            const next = (pc.failed_attempts ?? 0) + 1;
            const patch: { failed_attempts: number; expires_at?: string } = { failed_attempts: next };
            if (next >= MAX_CODE_FAILS) patch.expires_at = new Date().toISOString();
            await supabaseAdmin.from("pairing_codes").update(patch).eq("id", pc.id);
            return fail(reason, body, status);
          };
          if (pc.used) return failForCode("used", { error: "Code already used" }, 410);
          if (new Date(pc.expires_at).getTime() < Date.now()) return failForCode("expired", { error: "Code expired" }, 410);
          if ((pc.failed_attempts ?? 0) >= MAX_CODE_FAILS) {
            return fail("code_locked", { error: "This code has been locked after too many attempts." }, 429);
          }

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
              reason_chips: (pc as any).reason_chips ?? null,
              reason_text: (pc as any).reason_text ?? null,
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

const CODE_LENGTH = 8;
const MAX_IP_FAILS = 5;
const IP_WINDOW_MS = 10 * 60 * 1000;
const MAX_CODE_FAILS = 10;

// Store only a salted hash of the IP, never the address itself.
async function hashIp(request: Request): Promise<string> {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";
  const data = new TextEncoder().encode(`globedoc-pairing:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
