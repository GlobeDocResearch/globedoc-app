// Local persistence for a Pro's paired patients.
// We don't have a DB link from the pro user id to pro_sessions, so we keep
// a lightweight cache keyed by the Pro's auth user id.

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
export async function refreshActivePairings(userId: string): Promise<ProPairing[]> {
  const local = loadPairings(userId).filter((p) => new Date(p.expires_at).getTime() > Date.now());
  if (local.length === 0) {
    savePairings(userId, []);
    return [];
  }
  try {
    const res = await fetch("/api/public/connect/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens: local.map((p) => p.id) }),
    });
    const json = await res.json();
    if (!res.ok) return local;
    const activeSet = new Set<string>(json.active || []);
    const next = local.filter((p) => activeSet.has(p.id));
    savePairings(userId, next);
    return next;
  } catch {
    return local;
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
