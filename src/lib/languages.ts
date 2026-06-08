// Curated static list of clinically relevant languages for GlobeDoc.
// No dynamic fetching — this list is the single source of truth.
export type LanguageOption = { code: string; name: string; nativeName: string };

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "sv", name: "Svenska", nativeName: "Svenska" },
  { code: "fr", name: "Français", nativeName: "Français" },
  { code: "de", name: "Deutsch", nativeName: "Deutsch" },
  { code: "es", name: "Español", nativeName: "Español" },
  { code: "it", name: "Italiano", nativeName: "Italiano" },
  { code: "pt", name: "Português", nativeName: "Português" },
  { code: "nl", name: "Nederlands", nativeName: "Nederlands" },
  { code: "pl", name: "Polski", nativeName: "Polski" },
  { code: "ro", name: "Română", nativeName: "Română" },
  { code: "cs", name: "Čeština", nativeName: "Čeština" },
  { code: "da", name: "Dansk", nativeName: "Dansk" },
  { code: "no", name: "Norsk", nativeName: "Norsk" },
  { code: "fi", name: "Suomi", nativeName: "Suomi" },
  { code: "el", name: "Ελληνικά", nativeName: "Ελληνικά" },
  { code: "ar", name: "العربية", nativeName: "العربية" },
  { code: "hi", name: "हिन्दी", nativeName: "हिन्दी" },
  { code: "id", name: "Indonesia", nativeName: "Indonesia" },
  { code: "th", name: "ภาษาไทย", nativeName: "ภาษาไทย" },
  { code: "vi", name: "Tiếng Việt", nativeName: "Tiếng Việt" },
  { code: "zh", name: "中文", nativeName: "中文" },
  { code: "ja", name: "日本語", nativeName: "日本語" },
  { code: "ko", name: "한국어", nativeName: "한국어" },
  { code: "tr", name: "Türkçe", nativeName: "Türkçe" },
  { code: "ru", name: "Русский", nativeName: "Русский" },
  { code: "uk", name: "Українська", nativeName: "Українська" },
];

export function getLanguage(code: string): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
