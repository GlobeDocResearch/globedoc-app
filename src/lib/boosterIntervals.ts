// Booster interval recommendations.
// Sources: WHO, CDC, UK Health Security Agency.
// `years === null` means lifelong protection after the full primary series.

export type BoosterInterval = { years: number | null; note: string };

export const boosterIntervals: Record<string, BoosterInterval> = {
  "DTP/DTaP": { years: 10, note: "Tetanus/diphtheria booster every 10 years" },
  "Polio (IPV)": { years: 10, note: "Booster recommended every 10 years for travellers" },
  "Typhoid": { years: 3, note: "Injectable typhoid booster every 3 years" },
  "Hepatitis A": { years: null, note: "Lifelong after 2-dose series. If only 1 dose: booster needed within 6–12 months" },
  "Hepatitis B": { years: null, note: "Lifelong after full 3-dose series" },
  "TBE (Tick-borne encephalitis)": { years: 5, note: "Booster every 3–5 years" },
  "Japanese encephalitis": { years: 2, note: "Booster after 1–2 years for repeat travel" },
  "Rabies": { years: 3, note: "Booster after 1 year, then every 3–5 years if at risk" },
  "Meningococcal": { years: 5, note: "Every 5 years if still at risk" },
  "Cholera": { years: 2, note: "Booster every 2 years" },
  "MMR": { years: null, note: "Lifelong after 2-dose series" },
  "BCG": { years: null, note: "Single dose — lifelong protection" },
  "Varicella": { years: null, note: "Lifelong after 2-dose series" },
  "HPV": { years: null, note: "Lifelong after full series" },
  "Hib": { years: null, note: "Childhood vaccine — no adult booster needed" },
  "Pneumococcal (PCV)": { years: null, note: "Single childhood series — consult doctor for adult risk groups" },
  "Yellow Fever": { years: null, note: "Single dose — lifelong protection (WHO 2016)" },
};

// Loose match on vaccine name (case-insensitive, key substring or vice-versa).
export function lookupInterval(name: string): BoosterInterval | undefined {
  if (!name) return undefined;
  const n = name.toLowerCase().trim();
  if (boosterIntervals[name]) return boosterIntervals[name];
  for (const key of Object.keys(boosterIntervals)) {
    const k = key.toLowerCase();
    if (n === k || n.includes(k) || k.includes(n)) return boosterIntervals[key];
  }
  return undefined;
}

export type BoosterStatus =
  | { kind: "lifelong"; note: string }
  | { kind: "unknown_year"; note: string }
  | { kind: "ok"; nextYear: number; note: string }
  | { kind: "due_soon"; nextYear: number; note: string }
  | { kind: "overdue"; nextYear: number; note: string }
  | { kind: "no_data" };

/** Compute booster status. lastYear should be the most recent dose year (primary or booster). */
export function computeBoosterStatus(
  vaccineName: string,
  lastYear: number | null,
  now: Date = new Date(),
): BoosterStatus {
  const info = lookupInterval(vaccineName);
  if (!info) return { kind: "no_data" };
  if (info.years === null) return { kind: "lifelong", note: info.note };
  if (!lastYear || Number.isNaN(lastYear)) return { kind: "unknown_year", note: info.note };

  const nextYear = lastYear + info.years;
  const nextDue = new Date(nextYear, 0, 1);
  const sixMonthsBefore = new Date(nextDue);
  sixMonthsBefore.setMonth(sixMonthsBefore.getMonth() - 6);

  if (now >= nextDue) return { kind: "overdue", nextYear, note: info.note };
  if (now >= sixMonthsBefore) return { kind: "due_soon", nextYear, note: info.note };
  return { kind: "ok", nextYear, note: info.note };
}
