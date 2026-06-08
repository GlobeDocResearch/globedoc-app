import { LANGUAGES, type LanguageOption } from "@/lib/languages";

/**
 * Returns the curated static language list. No network calls.
 */
export function useLanguages(): LanguageOption[] {
  return LANGUAGES;
}
