// RxNorm + WHO ATC integration (NIH RxNav, free, no API key).
// CORS-enabled, called directly from the browser. All helpers fail soft
// (return [] / null) so callers can fall back to the local list.

export type RxMatch = {
  rxcui: string;
  generic: string;
  brand?: string;
  /** Display label, e.g. "Metformin (Glucophage)" */
  label: string;
};

type CacheEntry<T> = { at: number; data: T };
const TTL_MS = 5 * 60 * 1000;
const searchCache = new Map<string, CacheEntry<RxMatch[]>>();
const atcCache = new Map<string, CacheEntry<string | null>>();
const brandCache = new Map<string, CacheEntry<string | null>>();

type DrugGroup = {
  drugGroup?: {
    conceptGroup?: Array<{
      tty?: string;
      conceptProperties?: Array<{
        rxcui?: string;
        name?: string;
        tty?: string;
        synonym?: string;
      }>;
    }>;
  };
};

/** Search RxNorm by drug name. Returns top matches with brand info merged. */
export async function searchRxNorm(
  query: string,
  signal?: AbortSignal,
): Promise<RxMatch[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const key = q.toLowerCase();
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  try {
    const res = await fetch(
      `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(q)}`,
      { signal },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as DrugGroup;
    const groups = json.drugGroup?.conceptGroup ?? [];

    // Ingredients (IN) and Precise Ingredients (PIN) are our "generic" entries.
    const generics: RxMatch[] = [];
    const seen = new Set<string>();
    for (const g of groups) {
      if (g.tty !== "IN" && g.tty !== "PIN" && g.tty !== "MIN") continue;
      for (const p of g.conceptProperties ?? []) {
        const name = (p.name ?? "").trim();
        if (!name || !p.rxcui) continue;
        const k = name.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        generics.push({
          rxcui: p.rxcui,
          generic: title(name),
          label: title(name),
        });
      }
    }

    // Brand names (BN) — surfaced as their own entries AND attached to a
    // matching generic where possible.
    const brands: RxMatch[] = [];
    for (const g of groups) {
      if (g.tty !== "BN") continue;
      for (const p of g.conceptProperties ?? []) {
        const name = (p.name ?? "").trim();
        if (!name || !p.rxcui) continue;
        brands.push({
          rxcui: p.rxcui,
          generic: title(name),
          label: title(name),
        });
      }
    }

    // If no IN/PIN/MIN at all but we have SBD/SCD synonyms, fall back to the
    // first few branded/clinical drugs so the user still sees something.
    const fallback: RxMatch[] = [];
    if (generics.length === 0 && brands.length === 0) {
      for (const g of groups) {
        if (g.tty !== "SBD" && g.tty !== "SCD") continue;
        for (const p of g.conceptProperties ?? []) {
          const name = (p.name ?? "").trim();
          if (!name || !p.rxcui) continue;
          fallback.push({
            rxcui: p.rxcui,
            generic: title(name),
            label: title(name),
          });
          if (fallback.length >= 8) break;
        }
      }
    }

    const combined = [...generics, ...brands, ...fallback].slice(0, 12);
    searchCache.set(key, { at: Date.now(), data: combined });
    return combined;
  } catch {
    return [];
  }
}

/** Look up the first brand name for a generic rxcui. */
export async function getBrandName(rxcui: string): Promise<string | null> {
  if (!rxcui) return null;
  const cached = brandCache.get(rxcui);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
  try {
    const res = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(rxcui)}/related.json?tty=BN`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      relatedGroup?: {
        conceptGroup?: Array<{
          conceptProperties?: Array<{ name?: string }>;
        }>;
      };
    };
    const first =
      json.relatedGroup?.conceptGroup?.[0]?.conceptProperties?.[0]?.name?.trim() ?? null;
    const value = first ? title(first) : null;
    brandCache.set(rxcui, { at: Date.now(), data: value });
    return value;
  } catch {
    return null;
  }
}

/** Look up the WHO ATC classification code (e.g. "A10BA") for an rxcui. */
export async function getAtcCode(rxcui: string): Promise<string | null> {
  if (!rxcui) return null;
  const cached = atcCache.get(rxcui);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
  try {
    const res = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=${encodeURIComponent(rxcui)}&relaSource=ATC`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      rxclassDrugInfoList?: {
        rxclassDrugInfo?: Array<{
          rxclassMinConceptItem?: { classId?: string; classType?: string };
        }>;
      };
    };
    const items = json.rxclassDrugInfoList?.rxclassDrugInfo ?? [];
    // Prefer the most-specific class (longest classId).
    let best: string | null = null;
    for (const it of items) {
      const id = it.rxclassMinConceptItem?.classId?.trim();
      if (!id) continue;
      if (!best || id.length > best.length) best = id;
    }
    atcCache.set(rxcui, { at: Date.now(), data: best });
    return best;
  } catch {
    return null;
  }
}

function title(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
