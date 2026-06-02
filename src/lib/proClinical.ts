// Local persistence for a Pro's clinical workspace items.
// Mirrors the lightweight pattern used by proPairings — keyed by Pro auth user id.

export type RxItem = {
  id: string;
  created_at: string; // ISO
  patient_name: string;
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
  notes: string;
  status: "Active" | "Completed" | "Cancelled";
};

export type ReferralItem = {
  id: string;
  created_at: string;
  patient_name: string;
  referred_to: string;
  reason: string;
  urgency: "routine" | "urgent" | "emergency";
  notes: string;
};

export type LetterType =
  | "Discharge summary"
  | "Sick note"
  | "Medical certificate"
  | "Other";

export type LetterItem = {
  id: string;
  created_at: string;
  patient_name: string;
  type: LetterType;
  content: string;
  date: string; // YYYY-MM-DD
};

type Kind = "rx" | "referrals" | "letters";
const keyFor = (userId: string, kind: Kind) =>
  `globedoc_pro_${kind}_${userId}`;

function load<T>(userId: string, kind: Kind): T[] {
  try {
    const raw = localStorage.getItem(keyFor(userId, kind));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(userId: string, kind: Kind, items: T[]) {
  localStorage.setItem(keyFor(userId, kind), JSON.stringify(items));
}

export const loadRx = (uid: string) => load<RxItem>(uid, "rx");
export const saveRx = (uid: string, items: RxItem[]) => save(uid, "rx", items);

export const loadReferrals = (uid: string) =>
  load<ReferralItem>(uid, "referrals");
export const saveReferrals = (uid: string, items: ReferralItem[]) =>
  save(uid, "referrals", items);

export const loadLetters = (uid: string) => load<LetterItem>(uid, "letters");
export const saveLetters = (uid: string, items: LetterItem[]) =>
  save(uid, "letters", items);
