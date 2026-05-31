// Server-side proxy for WHO ICD-11 / ICHI searches.
// Holds the OAuth client_credentials token server-side so the browser never
// sees the WHO secret and CORS is bypassed.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type WhoToken = { token: string; expiresAt: number };
let cachedToken: WhoToken | null = null;

async function getWhoToken(): Promise<string | null> {
  const id = process.env.WHO_ICD_CLIENT_ID;
  const secret = process.env.WHO_ICD_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  try {
    const body = new URLSearchParams({
      client_id: id,
      client_secret: secret,
      scope: "icdapi_access",
      grant_type: "client_credentials",
    });
    const res = await fetch("https://icdaccessmanagement.who.int/connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!j.access_token) return null;
    cachedToken = {
      token: j.access_token,
      expiresAt: Date.now() + (j.expires_in ?? 3600) * 1000,
    };
    return cachedToken.token;
  } catch {
    return null;
  }
}

function stripHighlight(s: string): string {
  return s.replace(/<[^>]+>/g, "").trim();
}

const InputSchema = z.object({
  q: z.string().min(1).max(200),
  lang: z.string().min(2).max(10).default("en"),
  kind: z.enum(["icd11", "ichi"]),
});

export const whoSearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const qs = new URLSearchParams({
      q: data.q,
      useFlexisearch: "true",
      flatResults: "true",
      highlightingEnabled: "false",
    }).toString();

    // Try the dated release first, then fall back to the un-dated linearization
    // URL — WHO occasionally rotates release identifiers and the dated path
    // returns 404 in that case.
    const urls =
      data.kind === "icd11"
        ? [
            `https://id.who.int/icd/release/11/2024-01/mms/search?${qs}`,
            `https://id.who.int/icd/release/11/mms/search?${qs}`,
          ]
        : [
            `https://id.who.int/icd/release/11/2024-01/ichi/search?${qs}`,
            `https://id.who.int/icd/release/11/ichi/search?${qs}`,
          ];

    async function attempt(url: string, token: string) {
      return fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "API-Version": "v2",
          "Accept-Language": data.lang || "en",
        },
      });
    }

    try {
      let token = await getWhoToken();
      if (!token) return { results: [] as Array<{ code: string; title: string; description?: string }> };

      let res: Response | null = null;
      for (const url of urls) {
        res = await attempt(url, token);
        // Token expired/rejected — clear cache, re-mint once, retry same URL.
        if (res.status === 401) {
          cachedToken = null;
          const fresh = await getWhoToken();
          if (!fresh) return { results: [] };
          token = fresh;
          res = await attempt(url, token);
        }
        if (res.ok) break;
        // 404 → try next URL variant; any other non-ok → also try fallback.
      }
      if (!res || !res.ok) return { results: [] };

      const json = (await res.json()) as {
        destinationEntities?: Array<{
          theCode?: string;
          title?: string;
          chapterTitle?: string;
        }>;
      };
      const results = (json.destinationEntities ?? [])
        .map((e) => {
          const description = stripHighlight(e.chapterTitle ?? "");
          return {
            code: (e.theCode ?? "").trim(),
            title: stripHighlight(e.title ?? ""),
            ...(description ? { description } : {}),
          };
        })
        .filter((m) => m.code && m.title)
        .slice(0, 20);
      return { results };
    } catch (err) {
      console.error("[whoSearch] failed", err);
      return { results: [] };
    }
  });
