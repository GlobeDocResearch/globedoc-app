import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  target: z.string().min(2).max(10),
  texts: z.array(z.string().max(5000)).min(1).max(128),
});

/**
 * Translate a batch of strings to a target language via Google Cloud
 * Translation API v2. Returns translated strings in the same order.
 * Source is assumed to be English.
 */
export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      return { translations: data.texts, error: "missing_api_key" as const };
    }

    try {
      const res = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: data.texts,
            source: "en",
            target: data.target,
            format: "text",
          }),
        },
      );
      if (!res.ok) {
        return { translations: data.texts, error: `http_${res.status}` };
      }
      const json = (await res.json()) as {
        data?: { translations?: Array<{ translatedText: string }> };
      };
      const out =
        json.data?.translations?.map((t) => t.translatedText) ?? data.texts;
      return { translations: out, error: null };
    } catch (e) {
      return { translations: data.texts, error: "request_failed" as const };
    }
  });
