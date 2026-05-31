// Sync helpers: mirror Medical History items into the Records feed as
// auto-generated entries. Each entry is keyed by (user_id, source_kind, source_id)
// so we can upsert/delete idempotently when the source row changes.

import { supabase } from "@/integrations/supabase/client";

export type SourceKind =
  | "condition_current"
  | "condition_past"
  | "hospital_stay"
  | "record_location";

type UpsertArgs = {
  userId: string;
  sourceKind: SourceKind;
  sourceId: string;
  title: string;
  body?: string | null;
  eventYear?: string | null;
};

export async function upsertPassportEntry(args: UpsertArgs) {
  const { userId, sourceKind, sourceId, title, body, eventYear } = args;
  await (supabase as any)
    .from("record_entries")
    .upsert(
      {
        user_id: userId,
        entry_type: "clinical_note",
        title,
        body: body ?? null,
        event_year: eventYear ?? null,
        source_kind: sourceKind,
        source_id: sourceId,
      },
      { onConflict: "user_id,source_kind,source_id" },
    );
}

export async function deletePassportEntry(
  userId: string,
  sourceKind: SourceKind,
  sourceId: string,
) {
  await (supabase as any)
    .from("record_entries")
    .delete()
    .eq("user_id", userId)
    .eq("source_kind", sourceKind)
    .eq("source_id", sourceId);
}

// ---- Title builders ---------------------------------------------------------

export function titleForCondition(
  list: "current" | "past",
  name: string,
  icd11_code: string | null,
  year: string | null,
): string {
  if (list === "current") {
    return `Diagnosis noted: ${name}${icd11_code ? ` · ${icd11_code}` : ""}`;
  }
  return `Past condition: ${name}${year ? ` · Resolved ${year}` : ""}`;
}

export function titleForStay(stay: {
  event?: string | null;
  institution?: string | null;
  city?: string | null;
  country?: string | null;
  year?: string | null;
}): string {
  const place = [stay.city, stay.country].filter(Boolean).join(", ");
  return [stay.event, stay.institution, place, stay.year]
    .filter(Boolean)
    .join(" · ");
}

export function titleForLocation(loc: {
  institution?: string | null;
  city?: string | null;
  country?: string | null;
  years?: string | null;
}): string {
  const place = [loc.city, loc.country].filter(Boolean).join(", ");
  return [loc.institution, place, loc.years].filter(Boolean).join(" · ");
}

// ---- Year extraction (best-effort first 4-digit year) -----------------------

export function firstYear(s: string | null | undefined): string | null {
  if (!s) return null;
  const m = String(s).match(/\b(1\d{3}|2\d{3})\b/);
  return m ? m[1] : null;
}
