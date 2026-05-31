// Minimal WHO ICD-11 search helper.
// Uses the public WHO API at id.who.int/icd. The Accept-Language header lets
// the API return localised titles where available (43 languages).
//
// Note: WHO's API technically expects an OAuth token; the call below is a
// best-effort fetch. If the network/CORS/auth blocks the response we return
// an empty list and the UI falls back to local matches + free text.

export type Icd11Match = {
  code: string;
  title: string;
};

type CacheEntry = { at: number; data: Icd11Match[] };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

export async function searchIcd11(
  query: string,
  lang: string,
  signal?: AbortSignal,
): Promise<Icd11Match[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const key = `${lang}::${q.toLowerCase()}`;
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  const url =
    "https://id.who.int/icd/release/11/2024-01/mms/search?" +
    new URLSearchParams({
      q,
      flatResults: "true",
      useFlexisearch: "true",
    }).toString();

  try {
    const res = await fetch(url, {
      signal,
      headers: {
        Accept: "application/json",
        "API-Version": "v2",
        "Accept-Language": lang || "en",
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      destinationEntities?: Array<{ theCode?: string; title?: string }>;
    };
    const matches: Icd11Match[] = (json.destinationEntities ?? [])
      .map((e) => ({
        code: (e.theCode ?? "").trim(),
        title: stripHighlight(e.title ?? ""),
      }))
      .filter((m) => m.code && m.title)
      .slice(0, 10);
    CACHE.set(key, { at: Date.now(), data: matches });
    return matches;
  } catch {
    return [];
  }
}

function stripHighlight(s: string): string {
  // WHO returns titles with <em class='found'>…</em> highlight markup.
  return s.replace(/<[^>]+>/g, "").trim();
}

// ---- ICHI (WHO International Classification of Health Interventions) -------

export type IchiMatch = {
  code: string;
  title: string;
};

const ICHI_CACHE = new Map<string, { at: number; data: IchiMatch[] }>();

export async function searchIchi(
  query: string,
  lang: string,
  signal?: AbortSignal,
): Promise<IchiMatch[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const key = `${lang}::${q.toLowerCase()}`;
  const cached = ICHI_CACHE.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  const url =
    "https://id.who.int/icd/entity/search?" +
    new URLSearchParams({
      q,
      useFlexisearch: "true",
      flatResults: "true",
      releaseId: "2024-01/ichi",
    }).toString();

  try {
    const res = await fetch(url, {
      signal,
      headers: {
        Accept: "application/json",
        "API-Version": "v2",
        "Accept-Language": lang || "en",
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      destinationEntities?: Array<{ theCode?: string; title?: string }>;
    };
    const matches: IchiMatch[] = (json.destinationEntities ?? [])
      .map((e) => ({
        code: (e.theCode ?? "").trim(),
        title: stripHighlight(e.title ?? ""),
      }))
      .filter((m) => m.code && m.title)
      .slice(0, 10);
    ICHI_CACHE.set(key, { at: Date.now(), data: matches });
    return matches;
  } catch {
    return [];
  }
}
