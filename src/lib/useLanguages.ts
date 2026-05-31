import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSupportedLanguages } from "@/lib/translate.functions";
import { LANGUAGES as STATIC_LANGUAGES, type LanguageOption } from "@/lib/languages";

const PRIMARY_CODES = ["en", "sv"];

function nativeNameFor(code: string, englishName: string): string {
  try {
    // @ts-expect-error - DisplayNames is widely supported in modern browsers
    const dn = new Intl.DisplayNames([code], { type: "language" });
    const native = dn.of(code);
    if (native && typeof native === "string") {
      // Capitalize first char for languages that lowercase by default
      return native.charAt(0).toLocaleUpperCase(code) + native.slice(1);
    }
  } catch {
    // ignore
  }
  return englishName;
}

function englishNameFor(code: string, fallback: string): string {
  try {
    // @ts-expect-error - DisplayNames is widely supported in modern browsers
    const dn = new Intl.DisplayNames(["en"], { type: "language" });
    return dn.of(code) || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Returns the complete language list. Fetches from Google Translate once and
 * caches; falls back to the static curated list on any failure.
 */
export function useLanguages(): LanguageOption[] {
  const fetchList = useServerFn(listSupportedLanguages);
  const { data } = useQuery({
    queryKey: ["supported-languages"],
    queryFn: () => fetchList(),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  if (!data || !data.languages || data.languages.length === 0) {
    return STATIC_LANGUAGES;
  }

  const options: LanguageOption[] = data.languages.map((l) => ({
    code: l.code,
    name: englishNameFor(l.code, l.name),
    nativeName: nativeNameFor(l.code, l.name),
  }));

  const primary = PRIMARY_CODES
    .map((code) => options.find((o) => o.code === code))
    .filter((o): o is LanguageOption => Boolean(o));
  const others = options
    .filter((o) => !PRIMARY_CODES.includes(o.code))
    .sort((a, b) => a.nativeName.localeCompare(b.nativeName));

  return [...primary, ...others];
}
