import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "sv";

type Dict = Record<string, string>;

const en = {
  "brand.tagline": "Your Deep Health",

  "login.welcome": "Welcome back",
  "login.email": "Email address",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.new": "New to GlobeDoc?",
  "login.create": "Create an account",
  "login.legal": "Privacy Policy & Terms of Service",

  "home.welcome": "Welcome back, {name}!",
  "home.passportTitle": "Health Passport",
  "home.passportSubtitle": "Create your global health passport",
  "home.passportCta": "Create Your Health Passport",
  "nav.home": "Home",
  "nav.passport": "Passport",
  "nav.travel": "Travel",
  "nav.records": "Records",
  "nav.pairing": "Pairing",
  "nav.profile": "Profile",

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
  "consent.health5": "Contact: hello@globedoc.com",
  "consent.create": "Create account",
  "consent.footer":
    "By creating an account you confirm the consents above. Your consent record is saved with a timestamp. You may withdraw consent at any time in Settings → Privacy & Data.",

  "common.passwordsMismatch": "Passwords do not match",

  // Legal page
  "legal.back": "Back to login",
  "legal.title": "Legal & Privacy",
  "legal.subtitle": "GlobeDoc · Version 1.0 Beta",
  "legal.langEn": "English",
  "legal.langSv": "Svenska",
  "legal.s1": "Terms of Service",
  "legal.s2": "Privacy Policy (GDPR)",
  "legal.s3": "Data Security",
  "legal.s4": "Medical Disclaimer",
  "legal.s5": "Consent & Data Rights",
  "legal.s6": "Subprocessors & Data Processing Agreements",
  "legal.contactTitle": "Contact us",
  "legal.contactCompany": "GlobeDoc Health AB",
  "legal.contactEmailLabel": "Email:",
  "legal.footer1": "GlobeDoc Health Passport · Version 1.0 Beta",
  "legal.footer2": "All data is self-reported and encrypted · Share only via authenticated pairing code",

  "legal.tos.updated": "Last updated: May 2026",
  "legal.tos.intro":
    "By using GlobeDoc Health Passport (\"the Service\"), you agree to these Terms of Service. Please read them carefully.",
  "legal.tos.h1": "1. Description of Service",
  "legal.tos.p1":
    "GlobeDoc is a personal health data management platform that allows patients to store and share their medical information. The Service is not a medical device and does not provide medical advice, diagnosis or treatment.",
  "legal.tos.h2": "2. User responsibilities",
  "legal.tos.p2":
    "You are responsible for the accuracy of the health information you enter. GlobeDoc is not liable for decisions made based on self-reported data. Always consult a qualified healthcare professional for medical advice.",
  "legal.tos.h3": "3. Account security",
  "legal.tos.p3":
    "You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately at hello@globedoc.com if you suspect unauthorised access.",
  "legal.tos.h4": "4. Intellectual property",
  "legal.tos.p4":
    "The GlobeDoc platform and its content are owned by GlobeDoc Health AB. Your health data remains your property at all times.",
  "legal.tos.h5": "5. Termination",
  "legal.tos.p5": "We reserve the right to suspend or terminate accounts that violate these terms.",
  "legal.tos.h6": "6. Limitation of liability",
  "legal.tos.p6":
    "To the maximum extent permitted by law, GlobeDoc shall not be liable for indirect, incidental or consequential damages arising from use of the Service.",
  "legal.tos.h7": "7. Governing law",
  "legal.tos.p7":
    "These terms are governed by Swedish law. Disputes shall be resolved in Swedish courts.",

  "legal.pp.intro":
    "GlobeDoc Health AB (\"we\", \"us\") processes your personal data in accordance with the EU General Data Protection Regulation (GDPR) and Swedish data protection law.",
  "legal.pp.controller": "Data controller: GlobeDoc Health AB, Sweden. Contact: hello@globedoc.com",
  "legal.pp.collectTitle": "What data we collect:",
  "legal.pp.collect1": "Account information (email address, password hash)",
  "legal.pp.collect2": "Profile data (name, date of birth, contact information)",
  "legal.pp.collect3": "Health data you enter in your Health Passport",
  "legal.pp.collect4": "Usage data (log-in times, feature usage — anonymised)",
  "legal.pp.basis":
    "Legal basis for processing: We process your health data on the basis of your explicit consent (Art. 9(2)(a) GDPR) and for the performance of our contract with you (Art. 6(1)(b) GDPR).",
  "legal.pp.use":
    "How we use your data: Your health data is used solely to provide the GlobeDoc service to you. We never sell your data. We do not share your data with third parties without your explicit consent, except as required by law.",
  "legal.pp.storage":
    "Data storage: All data is stored on servers within the EU (Sweden/Germany). Health data is encrypted at rest and in transit.",
  "legal.pp.retention":
    "Retention: We retain your data for as long as your account is active. You may request deletion at any time.",
  "legal.pp.rights":
    "Your rights: Under GDPR you have the right to access, correct, delete, restrict processing of, and port your personal data. Contact hello@globedoc.com to exercise these rights.",
  "legal.pp.cookies":
    "Cookies: We use only essential session cookies. We do not use advertising or tracking cookies.",

  "legal.ds.intro": "We take the security of your health data very seriously.",
  "legal.ds.l1": "Encryption in transit: All data is transmitted over HTTPS/TLS 1.3.",
  "legal.ds.l2": "Encryption at rest: Databases are encrypted using AES-256.",
  "legal.ds.l3": "Authentication: Passwords are hashed using bcrypt. We support two-factor authentication (2FA).",
  "legal.ds.l4": "Access controls: Row-level security ensures you can only access your own data.",
  "legal.ds.l5": "Pairing codes: Clinician access via pairing codes is time-limited (10 minutes) and read-only.",
  "legal.ds.l6": "Audit logging: All access to your health data is logged for your security.",
  "legal.ds.report": "To report a security vulnerability, contact hello@globedoc.com.",

  "legal.md.h": "GlobeDoc is not a medical device.",
  "legal.md.p1":
    "The Health Passport is a personal health record tool. All health data in GlobeDoc is self-reported by the user. GlobeDoc does not verify medical records, provide diagnoses, or give medical advice.",
  "legal.md.p2":
    "Always consult a qualified healthcare professional before making decisions about your health. In an emergency, call 112 (EU) or your local emergency number.",
  "legal.md.p3":
    "Sharing your Health Passport with a clinician via pairing code does not replace a formal medical consultation.",

  "legal.cd.p1":
    "You may withdraw your consent to process health data at any time by deleting your account. To delete your account and all associated data, contact hello@globedoc.com or use the account deletion option in Settings.",
  "legal.cd.p2":
    "You have the right to export a copy of all your data in machine-readable format (JSON or PDF). Request an export at hello@globedoc.com or use the export function in Settings.",
  "legal.cd.p3":
    "For complaints about our data processing, you may contact the Swedish Authority for Privacy Protection (IMY) at imy.se.",

  "legal.sp.intro":
    "We use the following subprocessors who may process your personal data on our behalf. A Data Processing Agreement (DPA) is in place with each subprocessor.",
  "legal.sp.l1":
    "Hetzner Online GmbH (Germany) — Server hosting and storage. DPA: Hetzner standard DPA (GDPR Art. 28).",
  "legal.sp.l2":
    "Stripe, Inc. (USA/EU) — Payment processing. DPA: Stripe standard DPA with EU Standard Contractual Clauses (SCCs).",
  "legal.sp.l3":
    "Anthropic / Mistral AI — AI-assisted features (GlobeDoc AID). No personal health data is sent to AI providers without explicit opt-in.",
  "legal.sp.outro":
    "All subprocessors are contractually bound to process data only as instructed by GlobeDoc Health AB and in compliance with GDPR.",
} satisfies Dict;

const sv: Record<keyof typeof en, string> = {
  "brand.tagline": "Din djupa hälsa",

  "login.welcome": "Välkommen tillbaka",
  "login.email": "E-postadress",
  "login.password": "Lösenord",
  "login.submit": "Logga in",
  "login.new": "Ny på GlobeDoc?",
  "login.create": "Skapa ett konto",
  "login.legal": "Integritetspolicy & Användarvillkor",

  "home.welcome": "Välkommen tillbaka, {name}!",
  "home.passportTitle": "Health Passport",
  "home.passportSubtitle": "Skapa ditt globala hälsopass",
  "home.passportCta": "Skapa ditt Health Passport",
  "nav.home": "Hem",
  "nav.passport": "Pass",
  "nav.travel": "Resa",
  "nav.records": "Journal",
  "nav.pairing": "Parkoppling",
  "nav.profile": "Profil",

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
  "consent.health3":
    "Jag kan när som helst återkalla detta samtycke och permanent radera alla mina data via Inställningar",
  "consent.health4": "Jag kan när som helst begära en fullständig dataexport",
  "consent.health5": "Kontakt: hello@globedoc.com",
  "consent.create": "Skapa konto",
  "consent.footer":
    "Genom att skapa ett konto bekräftar du samtyckena ovan. Ditt samtycke sparas med en tidsstämpel. Du kan när som helst återkalla samtycket under Inställningar → Integritet & Data.",

  "common.passwordsMismatch": "Lösenorden matchar inte",

  "legal.back": "Tillbaka till inloggning",
  "legal.title": "Juridik & Integritet",
  "legal.subtitle": "GlobeDoc · Version 1.0 Beta",
  "legal.langEn": "English",
  "legal.langSv": "Svenska",
  "legal.s1": "Användarvillkor",
  "legal.s2": "Integritetspolicy (GDPR)",
  "legal.s3": "Datasäkerhet",
  "legal.s4": "Medicinsk friskrivning",
  "legal.s5": "Samtycke & datarättigheter",
  "legal.s6": "Underbiträden & databehandlaravtal",
  "legal.contactTitle": "Kontakta oss",
  "legal.contactCompany": "GlobeDoc Health AB",
  "legal.contactEmailLabel": "E-post:",
  "legal.footer1": "GlobeDoc Health Passport · Version 1.0 Beta",
  "legal.footer2":
    "All data är självrapporterad och krypterad · Dela endast via autentiserad parkopplingskod",

  "legal.tos.updated": "Senast uppdaterad: maj 2026",
  "legal.tos.intro":
    "Genom att använda GlobeDoc Health Passport (\"Tjänsten\") godkänner du dessa användarvillkor. Läs dem noga.",
  "legal.tos.h1": "1. Beskrivning av tjänsten",
  "legal.tos.p1":
    "GlobeDoc är en plattform för hantering av personliga hälsodata som låter patienter lagra och dela sin medicinska information. Tjänsten är inte en medicinteknisk produkt och ger inte medicinska råd, diagnoser eller behandling.",
  "legal.tos.h2": "2. Användarens ansvar",
  "legal.tos.p2":
    "Du ansvarar för att den hälsoinformation du anger är korrekt. GlobeDoc ansvarar inte för beslut som fattas baserat på självrapporterade data. Rådfråga alltid en kvalificerad vårdpersonal för medicinska råd.",
  "legal.tos.h3": "3. Kontosäkerhet",
  "legal.tos.p3":
    "Du ansvarar för att hålla dina kontouppgifter konfidentiella. Meddela oss omedelbart på hello@globedoc.com om du misstänker obehörig åtkomst.",
  "legal.tos.h4": "4. Immateriella rättigheter",
  "legal.tos.p4":
    "GlobeDoc-plattformen och dess innehåll ägs av GlobeDoc Health AB. Dina hälsodata förblir alltid din egendom.",
  "legal.tos.h5": "5. Uppsägning",
  "legal.tos.p5":
    "Vi förbehåller oss rätten att stänga av eller avsluta konton som bryter mot dessa villkor.",
  "legal.tos.h6": "6. Ansvarsbegränsning",
  "legal.tos.p6":
    "I den utsträckning som lagen tillåter ansvarar GlobeDoc inte för indirekta skador, följdskador eller särskilda skador som uppstår vid användning av Tjänsten.",
  "legal.tos.h7": "7. Tillämplig lag",
  "legal.tos.p7":
    "Dessa villkor regleras av svensk lag. Tvister ska avgöras av svensk domstol.",

  "legal.pp.intro":
    "GlobeDoc Health AB (\"vi\", \"oss\") behandlar dina personuppgifter i enlighet med EU:s allmänna dataskyddsförordning (GDPR) och svensk dataskyddslagstiftning.",
  "legal.pp.controller":
    "Personuppgiftsansvarig: GlobeDoc Health AB, Sverige. Kontakt: hello@globedoc.com",
  "legal.pp.collectTitle": "Vilka uppgifter vi samlar in:",
  "legal.pp.collect1": "Kontoinformation (e-postadress, lösenords-hash)",
  "legal.pp.collect2": "Profildata (namn, födelsedatum, kontaktuppgifter)",
  "legal.pp.collect3": "Hälsodata som du anger i din Health Passport",
  "legal.pp.collect4": "Användningsdata (inloggningstider, funktionsanvändning — anonymiserad)",
  "legal.pp.basis":
    "Laglig grund för behandling: Vi behandlar dina hälsodata på grundval av ditt uttryckliga samtycke (art. 9.2 a GDPR) och för att fullgöra vårt avtal med dig (art. 6.1 b GDPR).",
  "legal.pp.use":
    "Hur vi använder dina uppgifter: Dina hälsodata används enbart för att tillhandahålla GlobeDoc-tjänsten till dig. Vi säljer aldrig dina data. Vi delar inte dina data med tredje part utan ditt uttryckliga samtycke, förutom när det krävs enligt lag.",
  "legal.pp.storage":
    "Datalagring: Alla data lagras på servrar inom EU (Sverige/Tyskland). Hälsodata är krypterade i vila och under överföring.",
  "legal.pp.retention":
    "Lagringstid: Vi sparar dina data så länge ditt konto är aktivt. Du kan när som helst begära radering.",
  "legal.pp.rights":
    "Dina rättigheter: Enligt GDPR har du rätt att få tillgång till, rätta, radera, begränsa behandling av och flytta dina personuppgifter. Kontakta hello@globedoc.com för att utöva dessa rättigheter.",
  "legal.pp.cookies":
    "Cookies: Vi använder endast nödvändiga sessionscookies. Vi använder inga annons- eller spårningscookies.",

  "legal.ds.intro": "Vi tar säkerheten för dina hälsodata på största allvar.",
  "legal.ds.l1": "Kryptering vid överföring: All data överförs via HTTPS/TLS 1.3.",
  "legal.ds.l2": "Kryptering i vila: Databaser krypteras med AES-256.",
  "legal.ds.l3":
    "Autentisering: Lösenord hashas med bcrypt. Vi stödjer tvåfaktorsautentisering (2FA).",
  "legal.ds.l4":
    "Åtkomstkontroller: Row-level security säkerställer att du endast kan komma åt dina egna data.",
  "legal.ds.l5":
    "Parkopplingskoder: Klinikers åtkomst via parkopplingskoder är tidsbegränsad (10 minuter) och endast läsbar.",
  "legal.ds.l6": "Granskningsloggning: All åtkomst till dina hälsodata loggas för din säkerhet.",
  "legal.ds.report":
    "För att rapportera en säkerhetsbrist, kontakta hello@globedoc.com.",

  "legal.md.h": "GlobeDoc är inte en medicinteknisk produkt.",
  "legal.md.p1":
    "Health Passport är ett verktyg för personliga hälsojournaler. Alla hälsodata i GlobeDoc är självrapporterade av användaren. GlobeDoc verifierar inte journaler, ställer inte diagnoser och ger inga medicinska råd.",
  "legal.md.p2":
    "Rådfråga alltid en kvalificerad vårdpersonal innan du fattar beslut om din hälsa. Vid nödsituation, ring 112 (EU) eller ditt lokala nödnummer.",
  "legal.md.p3":
    "Att dela din Health Passport med en kliniker via parkopplingskod ersätter inte en formell medicinsk konsultation.",

  "legal.cd.p1":
    "Du kan när som helst återkalla ditt samtycke till behandling av hälsodata genom att radera ditt konto. För att radera ditt konto och all tillhörande data, kontakta hello@globedoc.com eller använd alternativet för kontoradering i Inställningar.",
  "legal.cd.p2":
    "Du har rätt att exportera en kopia av alla dina data i maskinläsbart format (JSON eller PDF). Begär en export på hello@globedoc.com eller använd exportfunktionen i Inställningar.",
  "legal.cd.p3":
    "För klagomål om vår databehandling kan du kontakta Integritetsskyddsmyndigheten (IMY) på imy.se.",

  "legal.sp.intro":
    "Vi använder följande underbiträden som kan behandla dina personuppgifter för vår räkning. Ett databehandlaravtal (DPA) finns med varje underbiträde.",
  "legal.sp.l1":
    "Hetzner Online GmbH (Tyskland) — Serverhosting och lagring. DPA: Hetzners standard-DPA (GDPR art. 28).",
  "legal.sp.l2":
    "Stripe, Inc. (USA/EU) — Betalningshantering. DPA: Stripes standard-DPA med EU Standard Contractual Clauses (SCC).",
  "legal.sp.l3":
    "Anthropic / Mistral AI — AI-assisterade funktioner (GlobeDoc AID). Inga personliga hälsodata skickas till AI-leverantörer utan uttryckligt godkännande.",
  "legal.sp.outro":
    "Alla underbiträden är avtalsenligt bundna att behandla data endast enligt instruktioner från GlobeDoc Health AB och i enlighet med GDPR.",
};

const dicts: Record<Lang, Record<string, string>> = { en, sv };

export type TKey = keyof typeof en;

type Ctx = {
  /** Base dictionary lang. Only "en" or "sv". Other selected languages fall back to "en" and are translated at the DOM level. */
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Currently selected display language code (any of LANGUAGES). */
  langCode: string;
  setLangCode: (code: string) => void;
  t: (k: TKey) => string;
};
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [langCode, setLangCodeState] = useState<string>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCode = localStorage.getItem("langCode");
    if (storedCode) {
      setLangCodeState(storedCode);
      setLangState(storedCode === "sv" ? "sv" : "en");
    } else {
      const stored = localStorage.getItem("lang") as Lang | null;
      if (stored === "en" || stored === "sv") {
        setLangState(stored);
        setLangCodeState(stored);
      }
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    setLangCodeState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", l);
      localStorage.setItem("langCode", l);
    }
  };

  const setLangCode = (code: string) => {
    setLangCodeState(code);
    const base: Lang = code === "sv" ? "sv" : "en";
    setLangState(base);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", base);
      localStorage.setItem("langCode", code);
    }
  };

  const t = (k: TKey) => dicts[lang][k] ?? en[k];

  return (
    <I18nCtx.Provider value={{ lang, setLang, langCode, setLangCode, t }}>{children}</I18nCtx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
