import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  target: z.string().min(2).max(10),
  texts: z.array(z.string().max(5000)).min(1).max(128),
});

/**
 * Manual overrides for terms that Google Translate gets wrong in a UI
 * context. e.g. "Save" → "Ahorrar" (save money) instead of "Guardar"
 * (save data).
 */
const OVERRIDES: Record<string, Record<string, string>> = {
  es: {
    "save": "Guardar",
    "save changes": "Guardar cambios",
    "save and continue": "Guardar y continuar",
    "save and close": "Guardar y cerrar",
    "saving...": "Guardando...",
    "saving": "Guardando",
    "saved ✓": "Guardado ✓",
    "saved": "Guardado",
    "leave and save": "Salir y guardar",
    "you have unsaved changes — save or discard?": "Tienes cambios sin guardar, ¿guardar o descartar?",
  },
};

function applyOverride(target: string, source: string, translated: string): string {
  const map = OVERRIDES[target.toLowerCase()];
  if (!map) return translated;
  const key = source.trim().toLowerCase();
  return map[key] ?? translated;
}

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
