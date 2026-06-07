// Source of truth for a Pro's paired patients is Supabase (pro_sessions table,
// scoped by pro_user_id via RLS). LocalStorage is kept only as an optional
// cache for offline hints — never as the primary render source.

import { supabase } from "@/integrations/supabase/client";

export type ProPairing = {
  id: string; // pairing/session id (we use session_token as a stable key)
  patient_name: string;
  patient_dob: string | null;
  paired_at: string; // ISO
  last_activity_at: string; // ISO
  expires_at: string; // ISO
};

const keyFor = (userId: string) => `globedoc_pro_pairings_${userId}`;

export function loadPairings(userId: string): ProPairing[] {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProPairing[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePairings(userId: string, items: ProPairing[]) {
  localStorage.setItem(keyFor(userId), JSON.stringify(items));
}

export function addPairing(userId: string, p: ProPairing) {
  const all = loadPairings(userId);
  const next = [p, ...all.filter((x) => x.id !== p.id)];
  savePairings(userId, next);
}

export function removePairing(userId: string, id: string) {
  savePairings(userId, loadPairings(userId).filter((p) => p.id !== id));
}

// Sync local pairings with backend: only keep sessions still active
// (revoked_at IS NULL AND expires_at > now()) in pro_sessions.
// Preserves inactive/past entries (within 30 days) in localStorage so the
// Past connections list can render them.
export async function refreshActivePairings(userId: string): Promise<ProPairing[]> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
  const retained = loadPairings(userId).filter(
    (p) => new Date(p.paired_at).getTime() > thirtyDaysAgo,
  );
  savePairings(userId, retained);
  const stillValid = retained.filter((p) => new Date(p.expires_at).getTime() > Date.now());
  if (stillValid.length === 0) return [];
  try {
    const res = await fetch("/api/public/connect/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens: stillValid.map((p) => p.id) }),
    });
    const json = await res.json();
    if (!res.ok) return stillValid;
    const activeSet = new Set<string>(json.active || []);
    return stillValid.filter((p) => activeSet.has(p.id));
  } catch {
    return stillValid;
  }
}

export type PastPairing = {
  id: string;
  patient_name: string;
  paired_at: string;
  expires_at: string;
  revoked_at: string | null;
};

// Fetch authoritative status for all locally-known tokens (within 30 days),
// and split into active vs past (revoked or expired).
export async function refreshPairingsWithPast(
  userId: string,
): Promise<{ active: ProPairing[]; past: PastPairing[] }> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
  const retained = loadPairings(userId).filter(
    (p) => new Date(p.paired_at).getTime() > thirtyDaysAgo,
  );
  savePairings(userId, retained);
  if (retained.length === 0) return { active: [], past: [] };
  try {
    const res = await fetch("/api/public/connect/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens: retained.map((p) => p.id) }),
    });
    const json = await res.json();
    if (!res.ok) {
      const active = retained.filter((p) => new Date(p.expires_at).getTime() > Date.now());
      return { active, past: [] };
    }
    const now = Date.now();
    const active: ProPairing[] = [];
    const past: PastPairing[] = [];
    const localById = new Map(retained.map((p) => [p.id, p]));
    for (const s of (json.sessions || []) as PastPairing[] & any[]) {
      const local = localById.get(s.session_token);
      const isActive = !s.revoked_at && new Date(s.expires_at).getTime() > now;
      if (isActive) {
        active.push({
          id: s.session_token,
          patient_name: s.patient_name,
          patient_dob: local?.patient_dob ?? null,
          paired_at: s.paired_at,
          last_activity_at: local?.last_activity_at ?? s.paired_at,
          expires_at: s.expires_at,
        });
      } else if (new Date(s.paired_at).getTime() > thirtyDaysAgo) {
        past.push({
          id: s.session_token,
          patient_name: s.patient_name,
          paired_at: s.paired_at,
          expires_at: s.expires_at,
          revoked_at: s.revoked_at,
        });
      }
    }
    active.sort((a, b) => new Date(b.paired_at).getTime() - new Date(a.paired_at).getTime());
    past.sort((a, b) => new Date(b.paired_at).getTime() - new Date(a.paired_at).getTime());
    return { active, past };
  } catch {
    const active = retained.filter((p) => new Date(p.expires_at).getTime() > Date.now());
    return { active, past: [] };
  }
}

export function ageFromDob(dob: string | null): string {
  if (!dob) return "—";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return `${years} yrs`;
}

// --- Supabase-backed source of truth ---------------------------------------

async function patientNamesByUserId(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) return map;
  // Try direct profiles read first (RLS may restrict this for pros; that's OK — we'll fall back to the server fn).
  const { data } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name")
    .in("user_id", userIds);
  for (const p of data || []) {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
    if (name) map.set(p.user_id, name);
  }
  const missing = userIds.filter((id) => !map.has(id));
  if (missing.length > 0) {
    try {
      const { getPatientDisplayInfo } = await import("./proPatients.functions");
      const res: any = await getPatientDisplayInfo({ data: { userIds: missing } });
      const patients = res?.patients || {};
      for (const id of missing) {
        const info = patients[id];
        if (info?.name) map.set(id, info.name);
        else if (info?.email) map.set(id, info.email);
      }
    } catch {
      // ignore — fall back to "Patient" below
    }
  }
  for (const id of userIds) {
    if (!map.has(id)) map.set(id, "Patient");
  }
  return map;
}

export type ActiveSession = {
  id: string; // session_token (kept as key for existing UI/handlers)
  session_id: string; // pro_sessions.id
  session_token: string;
  patient_name: string;
  patient_user_id: string;
  patient_dob: string | null;
  paired_at: string;
  last_activity_at: string;
  expires_at: string;
  revoked_at: string | null;
  access_level: string;
};

export type PastSession = {
  id: string; // session_token
  session_id: string;
  patient_name: string;
  patient_user_id: string;
  paired_at: string;
  expires_at: string;
  revoked_at: string | null;
  access_level: string;
};

export async function getActiveSessionsFromSupabase(userId: string): Promise<ActiveSession[]> {
  if (!userId) return [];
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("pro_sessions")
    .select("id, session_token, user_id, paired_at, expires_at, revoked_at, access_level, last_accessed_at")
    .eq("pro_user_id", userId)
    .is("revoked_at", null)
    .gt("expires_at", nowIso)
    .order("paired_at", { ascending: false });
  if (error || !data) return [];
  const names = await patientNamesByUserId(Array.from(new Set(data.map((r: any) => r.user_id))));
  return data.map((r: any) => ({
    id: r.session_token,
    session_id: r.id,
    session_token: r.session_token,
    patient_name: names.get(r.user_id) || "Patient",
    patient_user_id: r.user_id,
    patient_dob: null,
    paired_at: r.paired_at,
    last_activity_at: r.last_accessed_at || r.paired_at,
    expires_at: r.expires_at,
    revoked_at: r.revoked_at,
    access_level: r.access_level,
  }));
}

export async function getPastSessionsFromSupabase(userId: string): Promise<PastSession[]> {
  if (!userId) return [];
  const nowIso = new Date().toISOString();
  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("pro_sessions")
    .select("id, session_token, user_id, paired_at, expires_at, revoked_at, access_level")
    .eq("pro_user_id", userId)
    .or(`revoked_at.not.is.null,expires_at.lt.${nowIso}`)
    .gte("paired_at", thirtyDaysAgoIso)
    .order("paired_at", { ascending: false });
  if (error || !data) return [];
  const names = await patientNamesByUserId(Array.from(new Set(data.map((r: any) => r.user_id))));
  return data.map((r: any) => ({
    id: r.session_token,
    session_id: r.id,
    patient_name: names.get(r.user_id) || "Patient",
    patient_user_id: r.user_id,
    paired_at: r.paired_at,
    expires_at: r.expires_at,
    revoked_at: r.revoked_at,
    access_level: r.access_level,
  }));
}
