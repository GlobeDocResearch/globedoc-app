// Curated static list of clinically relevant languages for GlobeDoc.
export type LanguageOption = { code: string; name: string; nativeName: string };

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "ar", name: "Arabic", nativeName: "Arabic (العربية)" },
  { code: "he", name: "Hebrew", nativeName: "Hebrew (עברית)" },
  { code: "fa", name: "Persian", nativeName: "Persian (فارسی)" },
  { code: "hi", name: "Hindi", nativeName: "Hindi (हिन्दी)" },
  { code: "bn", name: "Bengali", nativeName: "Bengali (বাংলা)" },
  { code: "id", name: "Indonesian", nativeName: "Indonesian" },
  { code: "ms", name: "Malay", nativeName: "Malay" },
  { code: "th", name: "Thai", nativeName: "Thai (ภาษาไทย)" },
  { code: "vi", name: "Vietnamese", nativeName: "Vietnamese (Tiếng Việt)" },
  { code: "zh", name: "Chinese", nativeName: "Chinese Simplified (中文)" },
  { code: "ja", name: "Japanese", nativeName: "Japanese (日本語)" },
  { code: "ko", name: "Korean", nativeName: "Korean (한국어)" },
  { code: "tr", name: "Turkish", nativeName: "Turkish (Türkçe)" },
  { code: "uk", name: "Ukrainian", nativeName: "Ukrainian (Українська)" },
  { code: "ru", name: "Russian", nativeName: "Russian (Русский)" },
];

export function getLanguage(code: string): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
