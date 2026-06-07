import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  target: z.string().min(2).max(10),
  text: z.string().min(1).max(5000),
});

/**
 * Translate a single string via the DeepL Free API.
 */
export const translateDeepl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      return { translation: data.text, error: "missing_api_key" as const };
    }
    // DeepL uses uppercase 2-letter codes for most targets (e.g. EN-US, PT-BR, FR)
    const target = data.target.toUpperCase();
    try {
      const params = new URLSearchParams();
      params.append("text", data.text);
      params.append("target_lang", target.split("-")[0] === "EN" || target.split("-")[0] === "PT" ? target : target.split("-")[0]);
      const res = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      if (!res.ok) {
        return { translation: data.text, error: `http_${res.status}` };
      }
      const json = (await res.json()) as { translations?: Array<{ text: string }> };
      const out = json.translations?.[0]?.text ?? data.text;
      return { translation: out, error: null };
    } catch {
      return { translation: data.text, error: "request_failed" as const };
    }
  });
