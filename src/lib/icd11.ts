// Client wrappers for WHO ICD-11 / ICHI search. Calls the server function
// `whoSearch` which holds the OAuth token. On any failure we return [] and
// the UI falls back to local matches + free text.

import { whoSearch } from "./icd.functions";

export type Icd11Match = {
  code: string;
  title: string;
  description?: string;
};

export type IchiMatch = {
  code: string;
  title: string;
};

type CacheEntry<T> = { at: number; data: T[] };
const ICD_CACHE = new Map<string, CacheEntry<Icd11Match>>();
const ICHI_CACHE = new Map<string, CacheEntry<IchiMatch>>();
const TTL_MS = 5 * 60 * 1000;

async function runSearch<T extends { code: string; title: string }>(
  cache: Map<string, CacheEntry<T>>,
  kind: "icd11" | "ichi",
  query: string,
  lang: string,
): Promise<T[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const key = `${lang}::${q.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  try {
    const res = await whoSearch({ data: { q, lang: lang || "en", kind } });
    const data = (res?.results ?? []) as T[];
    cache.set(key, { at: Date.now(), data });
    return data;
  } catch {
    return [];
  }
}

export async function searchIcd11(
  query: string,
  lang: string,
  _signal?: AbortSignal,
): Promise<Icd11Match[]> {
  return runSearch<Icd11Match>(ICD_CACHE, "icd11", query, lang);
}

export async function searchIchi(
  query: string,
  lang: string,
  _signal?: AbortSignal,
): Promise<IchiMatch[]> {
  return runSearch<IchiMatch>(ICHI_CACHE, "ichi", query, lang);
}
