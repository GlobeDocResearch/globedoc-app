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
