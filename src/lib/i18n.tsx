import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "sv";

type Dict = Record<string, string>;

const en: Dict = {
  "brand.tagline": "Your Deep Health",

  "login.welcome": "Welcome back",
  "login.email": "Email address",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.new": "New to GlobeDoc?",
  "login.create": "Create an account",
  "login.legal": "Privacy Policy & Terms of Service",

  "signup.title": "Create your account",
  "signup.step1": "Your details",
  "signup.firstName": "First name",
  "signup.lastName": "Last name",
  "signup.passwordHint": "Min 8 chars, e.g. Abc1234!",
  "signup.confirmPassword": "Confirm password",
  "signup.continue": "Continue to privacy consent",
  "signup.have": "Already have an account?",
  "signup.signIn": "Sign in",

  "consent.title": "Your privacy matters",
  "consent.subtitle": "Please read and confirm each item below",
  "consent.info":
    "Your medical information is classified as sensitive personal data under EU law. GlobeDoc can only process this data with your explicit, separate consent.",
  "consent.required": "Required",
  "consent.tosTitle": "Terms of Service & Privacy Policy",
  "consent.tosBody1": "I have read and agree to GlobeDoc's ",
  "consent.tosLink": "Terms of Service and Privacy Policy",
  "consent.tosBody2": ". I understand how GlobeDoc stores and protects my personal data.",
  "consent.healthTitle": "Processing of health data",
  "consent.healthIntro":
    "I explicitly consent to GlobeDoc processing my sensitive health data — including medical history, medications, allergies, vaccinations, hereditary information, and lifestyle data — solely to provide the Health Passport service.",
  "consent.healthUnderstand": "I understand that:",
  "consent.health1": "This data is stored encrypted on EU servers (Sweden/Germany)",
  "consent.health2": "GlobeDoc will never sell or share my health data without my consent",
  "consent.health3": "I can withdraw this consent and permanently delete all my data at any time via Settings",
  "consent.health4": "I can request a full data export at any time",
  "consent.health5": "Contact: privacy@globedoc.com",
  "consent.create": "Create account",
  "consent.footer":
    "By creating an account you confirm the consents above. Your consent record is saved with a timestamp. You may withdraw consent at any time in Settings → Privacy & Data.",

  "common.passwordsMismatch": "Passwords do not match",
};

const sv: Dict = {
  "brand.tagline": "Din djupa hälsa",

  "login.welcome": "Välkommen tillbaka",
  "login.email": "E-postadress",
  "login.password": "Lösenord",
  "login.submit": "Logga in",
  "login.new": "Ny på GlobeDoc?",
  "login.create": "Skapa ett konto",
  "login.legal": "Integritetspolicy & Användarvillkor",

  "signup.title": "Skapa ditt konto",
  "signup.step1": "Dina uppgifter",
  "signup.firstName": "Förnamn",
  "signup.lastName": "Efternamn",
  "signup.passwordHint": "Minst 8 tecken, t.ex. Abc1234!",
  "signup.confirmPassword": "Bekräfta lösenord",
  "signup.continue": "Fortsätt till samtycke",
  "signup.have": "Har du redan ett konto?",
  "signup.signIn": "Logga in",

  "consent.title": "Din integritet är viktig",
  "consent.subtitle": "Läs och bekräfta varje punkt nedan",
  "consent.info":
    "Din medicinska information klassas som känsliga personuppgifter enligt EU-rätten. GlobeDoc får endast behandla dessa uppgifter med ditt uttryckliga, separata samtycke.",
  "consent.required": "Obligatoriskt",
  "consent.tosTitle": "Användarvillkor & Integritetspolicy",
  "consent.tosBody1": "Jag har läst och godkänner GlobeDocs ",
  "consent.tosLink": "Användarvillkor och Integritetspolicy",
  "consent.tosBody2": ". Jag förstår hur GlobeDoc lagrar och skyddar mina personuppgifter.",
  "consent.healthTitle": "Behandling av hälsodata",
  "consent.healthIntro":
    "Jag samtycker uttryckligen till att GlobeDoc behandlar mina känsliga hälsodata — inklusive sjukdomshistorik, mediciner, allergier, vaccinationer, ärftlig information och livsstilsdata — enbart för att tillhandahålla tjänsten Health Passport.",
  "consent.healthUnderstand": "Jag förstår att:",
  "consent.health1": "Dessa data lagras krypterade på EU-servrar (Sverige/Tyskland)",
  "consent.health2": "GlobeDoc kommer aldrig att sälja eller dela mina hälsodata utan mitt samtycke",
  "consent.health3": "Jag kan när som helst återkalla detta samtycke och permanent radera alla mina data via Inställningar",
  "consent.health4": "Jag kan när som helst begära en fullständig dataexport",
  "consent.health5": "Kontakt: privacy@globedoc.com",
  "consent.create": "Skapa konto",
  "consent.footer":
    "Genom att skapa ett konto bekräftar du samtyckena ovan. Ditt samtycke sparas med en tidsstämpel. Du kan när som helst återkalla samtycket under Inställningar → Integritet & Data.",

  "common.passwordsMismatch": "Lösenorden matchar inte",
};

const dicts: Record<Lang, Dict> = { en, sv };

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof en) => string };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang | null) : null;
    if (stored === "en" || stored === "sv") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (k: keyof typeof en) => dicts[lang][k] ?? en[k];

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
