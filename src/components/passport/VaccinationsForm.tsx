import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X, Pencil, Trash2, Plus, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLeaveGuard, LeaveDialog } from "./unsaved";
import { COUNTRIES } from "@/lib/countries";
import {
  isSupportedCountry,
  eligibleProgrammeFor,
} from "@/lib/childhoodVaccines";

const ACCENT = "#9B7FD4";
const ACCENT_2 = "#7B5FB4";

function yearOf(s?: string | null): string {
  if (!s) return "";
  const m = String(s).match(/\d{4}/);
  return m ? m[0] : String(s);
}

function formatVaxSummary(name: string, date?: string | null, boosters?: string[]): string {
  let out = name;
  const y = yearOf(date);
  if (y) out += ` · ${y}`;
  const bYears = (boosters ?? []).map(yearOf).filter(Boolean);
  if (bYears.length > 0) out += ` · Booster: ${bYears.join(", ")}`;
  return out;
}

type Status = "likely_received" | "not_received" | "unsure";

type ChildhoodVax = {
  name: string;
  descEn: string;
  descSv: string;
  status: Status;
  year_received: string;
};

type Programme = {
  name: string;
  descEn: string;
  descSv: string;
  start: number;
  end?: number;
};



// Country → suggested travel vaccines
const TRAVEL_SUGGESTIONS: Record<string, string[]> = {
  Thailand: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Vietnam: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Cambodia: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Laos: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Myanmar: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Indonesia: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Philippines: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Singapore: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis"],
  Malaysia: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis"],
  Kenya: ["Hepatitis A", "Hepatitis B", "Typhoid", "Yellow fever", "Rabies", "Cholera"],
  Tanzania: ["Hepatitis A", "Hepatitis B", "Typhoid", "Yellow fever", "Rabies", "Cholera"],
  Uganda: ["Hepatitis A", "Hepatitis B", "Typhoid", "Yellow fever", "Rabies", "Cholera"],
  Ethiopia: ["Hepatitis A", "Hepatitis B", "Typhoid", "Yellow fever", "Rabies", "Cholera"],
  Brazil: ["Yellow fever", "Hepatitis A", "Typhoid", "Rabies"],
  Peru: ["Yellow fever", "Hepatitis A", "Typhoid", "Rabies"],
  Colombia: ["Yellow fever", "Hepatitis A", "Typhoid", "Rabies"],
  Ecuador: ["Yellow fever", "Hepatitis A", "Typhoid", "Rabies"],
  India: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Nepal: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Bangladesh: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Pakistan: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
};
const GENERIC_TRAVEL = ["Hepatitis A", "Hepatitis B", "Typhoid"];

function suggestionsFor(country: string): string[] {
  return TRAVEL_SUGGESTIONS[country] ?? GENERIC_TRAVEL;
}

const OTHER_VAX_SUGGESTIONS = [
  "TBE (Tick-borne encephalitis)",
  "Influenza",
  "Varicella (Chickenpox)",
  "HPV",
  "Pneumococcal",
  "Meningococcal ACWY/B",
  "Hepatitis A",
  "Hepatitis B",
  "Rotavirus",
  "BCG",
  "Covid-19 primary series",
  "Covid-19 booster",
  "Rabies",
  "Yellow fever",
  "Typhoid",
  "Japanese encephalitis",
  "Cholera (Dukoral)",
  "Other",
];

type TravelEntry = {
  uid: string;
  destination: string;
  countryQuery: string;
  vaccines: { name: string; checked: boolean; date: string; boosters: string[] }[];
  customDraft: string;
  collapsed: boolean;
};

type OtherEntry = {
  uid: string;
  vaccine_name: string;
  date: string;
  boosters: string[];
  collapsed: boolean;
};

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: "Vaccinations",
    subtitle: "Complete immunisation record",
    nothing: "Nothing to report",
    s1: "Childhood & school vaccines",
    s2: "Travel vaccines",
    s3: "Other vaccines",
    s4: "Contraindications",
    caveat_supported: "Filled suggestions are vaccines you most likely received based on the {country} national programme and your birth year. Unfilled vaccines were not part of the programme at that time but may have been received later — tap to confirm. Add any missing vaccines manually. This is not medical advice.",
    caveat_generic: "Filled suggestions are vaccines you most likely received based on WHO guidelines{forYear}. Unfilled vaccines may have been received later — tap to confirm. Add any missing vaccines manually. This is not medical advice.",
    caveat_no_year: "We don't know your year of birth yet, so suggestions cannot be tailored. All vaccines default to \"Unsure\" — please confirm.",
    likely: "Likely received",
    not_received: "Not received",
    unsure: "Unsure",
    year_ph: "Year received, e.g. 1995",
    add_destination: "Add destination",
    add_vaccine: "Add vaccine",
    add_booster: "Add booster",
    booster_ph: "Booster date, e.g. 2024-05-10",
    date_ph: "Date received, e.g. 2019-03-15",
    country_ph: "Search country…",
    suggested: "Suggested vaccines for this destination — tick those received",
    custom_vax_ph: "Add a vaccine not in the list",
    vaccine_name: "Vaccine name",
    vaccine_name_ph: "Start typing…",
    save: "Save",
    saved: "Saved",
    saveError: "Could not save",
    cert_upcoming: "Vaccination certificate upload — coming soon",
    contra_label: "Vaccination contraindication?",
    contra_ph: "E.g. immunocompromised, allergy to excipient…",
    no_destinations: "No destinations added yet.",
    no_other: "No other vaccines added yet.",
    no_country_selected: "Search and select a country first.",
  },
  sv: {
    title: "Vaccinationer",
    subtitle: "Komplett vaccinationsregister",
    nothing: "Inget att rapportera",
    s1: "Barn- & skolvaccin",
    s2: "Resevaccin",
    s3: "Övriga vaccin",
    s4: "Kontraindikationer",
    caveat_supported: "Ifyllda förslag är vaccin du troligen fått enligt {country}s nationella program och ditt födelseår. Otydligt markerade vaccin ingick inte i programmet då, men kan ha tagits senare — tryck för att bekräfta. Lägg till saknade vaccin manuellt. Detta är inte medicinsk rådgivning.",
    caveat_generic: "Ifyllda förslag är vaccin du troligen fått enligt WHO:s riktlinjer{forYear}. Otydligt markerade vaccin kan ha tagits senare — tryck för att bekräfta. Lägg till saknade vaccin manuellt. Detta är inte medicinsk rådgivning.",
    caveat_no_year: "Vi känner inte till ditt födelseår än, så förslagen kan inte anpassas. Alla vaccin är \"Osäker\" som standard — vänligen bekräfta.",
    likely: "Troligen fått",
    not_received: "Inte fått",
    unsure: "Osäker",
    year_ph: "År, t.ex. 1995",
    add_destination: "Lägg till destination",
    add_vaccine: "Lägg till vaccin",
    add_booster: "Lägg till påfyllnadsdos",
    booster_ph: "Datum för påfyllnad, t.ex. 2024-05-10",
    date_ph: "Datum, t.ex. 2019-03-15",
    country_ph: "Sök land…",
    suggested: "Rekommenderade vaccin — bocka i de du fått",
    custom_vax_ph: "Lägg till ett vaccin som inte finns i listan",
    vaccine_name: "Vaccinets namn",
    vaccine_name_ph: "Börja skriva…",
    save: "Spara",
    saved: "Sparat",
    saveError: "Kunde inte spara",
    cert_upcoming: "Uppladdning av vaccinationsintyg — kommer snart",
    contra_label: "Kontraindikation mot vaccin?",
    contra_ph: "T.ex. immunsuppression, allergi mot hjälpämne…",
    no_destinations: "Inga destinationer tillagda än.",
    no_other: "Inga övriga vaccin tillagda än.",
    no_country_selected: "Sök och välj ett land först.",
  },
};

export default function VaccinationsForm() {
  const { lang } = useI18n();
  const t = (k: string): string => T[lang][k] ?? T.en[k];
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nationality, setNationality] = useState<string | null>(null);
  const [birthYear, setBirthYear] = useState<string | null>(null);
  const [sex, setSex] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const bypassGuardRef = useRef(false);


  const [nothing, setNothing] = useState(false);
  const [childhood, setChildhood] = useState<ChildhoodVax[]>([]);
  const [travel, setTravel] = useState<TravelEntry[]>([]);
  const [others, setOthers] = useState<OtherEntry[]>([]);
  const [contra, setContra] = useState("");
  const [contraOpen, setContraOpen] = useState(false);

  const markDirty = () => setDirty(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(user.id);
      const sb = supabase as any;
      const [cv, tv, ov, vco, prof] = await Promise.all([
        sb.from("childhood_vaccines").select("*").eq("user_id", user.id),
        sb.from("travel_vaccines").select("*").eq("user_id", user.id).order("created_at"),
        sb.from("other_vaccines").select("*").eq("user_id", user.id).order("created_at"),
        sb.from("vaccination_contraindications").select("*").eq("user_id", user.id).maybeSingle(),
        sb.from("profiles").select("nationality,date_of_birth,biological_sex").eq("user_id", user.id).maybeSingle(),
      ]);

      const country = prof.data?.nationality ?? null;
      const year = prof.data?.date_of_birth ? String(prof.data.date_of_birth).slice(0, 4) : null;
      const bioSex = prof.data?.biological_sex ?? null;
      setNationality(country);
      setBirthYear(year);
      setSex(bioSex);

      // Build childhood list — ALL programme vaccines for the country;
      // `likely` flag (from age-at-vaccination logic) determines initial state.
      const savedMap: Record<string, any> = {};
      (cv.data ?? []).forEach((r: any) => { savedMap[r.vaccine_name] = r; });
      const yearNum = year ? parseInt(year, 10) : null;
      const eligible = eligibleProgrammeFor(country, yearNum, bioSex);
      const defs: { name: string; descEn: string; descSv: string; likely: boolean }[] =
        eligible.map((v) => ({ name: v.name, descEn: v.descEn, descSv: v.descSv, likely: v.likely }));
      // Include any previously-saved vaccine not in the new list so user edits aren't lost
      Object.keys(savedMap).forEach((name) => {
        if (!defs.find((d) => d.name === name)) {
          defs.push({ name, descEn: "", descSv: "", likely: false });
        }
      });
      const list: ChildhoodVax[] = defs.map((d) => {
        if (savedMap[d.name]) {
          return {
            name: d.name,
            descEn: d.descEn,
            descSv: d.descSv,
            status: (savedMap[d.name].status as Status) ?? "unsure",
            year_received: savedMap[d.name].year_received ?? "",
          };
        }
        const defaultStatus: Status = d.likely ? "likely_received" : "unsure";
        return { name: d.name, descEn: d.descEn, descSv: d.descSv, status: defaultStatus, year_received: "" };
      });

      setChildhood(list);

      // Travel — group rows by destination
      const groups = new Map<string, TravelEntry>();
      (tv.data ?? []).forEach((r: any) => {
        const dest = r.destination ?? "";
        const key = dest.toLowerCase();
        if (!groups.has(key)) {
          groups.set(key, {
            uid: key,
            destination: dest,
            countryQuery: dest,
            vaccines: [],
            customDraft: "",
            collapsed: true,
          });
        }
        groups.get(key)!.vaccines.push({
          name: r.vaccine_name ?? "",
          checked: true,
          date: r.date_received ?? "",
          boosters: Array.isArray(r.booster_dates) ? r.booster_dates : [],
        });
      });
      // Fill in unchecked suggested vaccines so the user can see them on edit
      const groupArr = Array.from(groups.values()).map((g) => {
        const sugg = suggestionsFor(g.destination);
        const have = new Set(g.vaccines.map((v) => v.name));
        const merged = [
          ...g.vaccines,
          ...sugg.filter((s) => !have.has(s)).map((s) => ({ name: s, checked: false, date: "", boosters: [] as string[] })),
        ];
        return { ...g, vaccines: merged };
      });
      setTravel(groupArr);

      const ot: OtherEntry[] = (ov.data ?? []).map((r: any) => ({
        uid: r.id,
        vaccine_name: r.vaccine_name ?? "",
        date: r.date_received ?? "",
        boosters: Array.isArray(r.booster_dates) ? r.booster_dates : [],
        collapsed: true,
      }));
      setOthers(ot);

      if (vco.data) {
        setContra(vco.data.contraindication_notes ?? "");
        setNothing(!!vco.data.nothing_to_report);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const audit = (table: string, action: string) => {
    if (!userId) return;
    (supabase as any).from("audit_log").insert({ user_id: userId, table_name: table, action });
  };

  const saveAll = async (): Promise<boolean> => {
    if (!userId) return false;
    try {
      const sb = supabase as any;
      // Contraindications + nothing toggle
      await sb.from("vaccination_contraindications").upsert(
        {
          user_id: userId,
          contraindication_notes: contra || null,
          nothing_to_report: nothing,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      audit("vaccination_contraindications", "upsert");

      // Childhood: upsert all rows (one per vaccine)
      await sb.from("childhood_vaccines").delete().eq("user_id", userId);
      if (!nothing) {
        const cvRows = childhood.map((c) => ({
          user_id: userId,
          vaccine_name: c.name,
          status: c.status,
          year_received: c.year_received.trim() || null,
        }));
        if (cvRows.length > 0) await sb.from("childhood_vaccines").insert(cvRows);
        audit("childhood_vaccines", "upsert");
      }

      // Travel: wipe + insert one row per checked vaccine per destination
      await sb.from("travel_vaccines").delete().eq("user_id", userId);
      if (!nothing) {
        const tvRows: any[] = [];
        travel.forEach((g) => {
          const dest = g.destination.trim();
          if (!dest) return;
          g.vaccines.forEach((v) => {
            if (!v.checked || !v.name.trim()) return;
            tvRows.push({
              user_id: userId,
              destination: dest,
              vaccine_name: v.name.trim(),
              date_received: v.date.trim() || null,
              booster_dates: v.boosters.filter((b) => b.trim().length > 0),
            });
          });
        });
        if (tvRows.length > 0) await sb.from("travel_vaccines").insert(tvRows);
        audit("travel_vaccines", "insert");
      }

      // Other: wipe + insert
      await sb.from("other_vaccines").delete().eq("user_id", userId);
      if (!nothing) {
        const ovRows = others
          .filter((o) => o.vaccine_name.trim().length > 0)
          .map((o) => ({
            user_id: userId,
            vaccine_name: o.vaccine_name.trim(),
            date_received: o.date.trim() || null,
            booster_dates: o.boosters.filter((b) => b.trim().length > 0),
          }));
        if (ovRows.length > 0) await sb.from("other_vaccines").insert(ovRows);
        audit("other_vaccines", "insert");
      }

      setTravel((arr) => arr.map((g) => ({ ...g, collapsed: !!g.destination })));
      setOthers((arr) => arr.map((o) => ({ ...o, collapsed: true })));
      setDirty(false);
      toast.success(t("saved"));
      return true;
    } catch {
      toast.error(t("saveError"));
      return false;
    }
  };

  const resolver = useLeaveGuard(() => dirty && !bypassGuardRef.current);

  const infoText = useMemo(() => {
    if (!birthYear) return t("caveat_no_year");
    if (nationality && isSupportedCountry(nationality)) {
      return t("caveat_supported").replace("{country}", nationality).replace("{year}", birthYear);
    }
    const forYear = birthYear ? (lang === "sv" ? ` för någon född ${birthYear}` : ` for someone born in ${birthYear}`) : "";
    return t("caveat_generic").replace("{forYear}", forYear);
  }, [birthYear, nationality, lang]);

  if (loading) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white pb-28 text-[#0D1B2A]">
      <header className="px-5 pt-6 pb-7" style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_2} 100%)` }}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">💉</span>
            <div>
              <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
              <p className="mt-1 text-sm text-white/85">{t("subtitle")}</p>
            </div>
          </div>
          <Link
            to="/passport"
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="space-y-6 px-5 pt-5">
        <div className="flex items-center justify-between rounded-2xl bg-[#F8F9FA] p-4">
          <span className="text-sm font-medium text-[#0D1B2A]">{t("nothing")}</span>
          <Switch
            checked={nothing}
            onCheckedChange={(v) => { setNothing(v); markDirty(); }}
          />
        </div>

        {!nothing && (
          <>
            {/* SECTION 1 — chip pill design, only show likely-received vaccines */}
            <section className="rounded-2xl border border-gray-200 p-4">
              <h2 className="text-base font-bold text-[#0D1B2A]">{t("s1")}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {childhood
                  .filter((c) => c.status === "likely_received")
                  .map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setChildhood((arr) => arr.map((x) => x.name === c.name ? { ...x, status: "unsure" } : x));
                        markDirty();
                      }}
                      className="rounded-full border border-[#9B7FD4] bg-[#9B7FD4] px-3 py-1.5 text-xs font-medium text-white"
                    >
                      {c.name}
                    </button>
                  ))}
                {childhood
                  .filter((c) => c.status !== "likely_received")
                  .map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setChildhood((arr) => arr.map((x) => x.name === c.name ? { ...x, status: "likely_received" } : x));
                        markDirty();
                      }}
                      className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#0D1B2A] hover:bg-gray-50"
                    >
                      {c.name}
                    </button>
                  ))}
              </div>
              <div className="mt-3 rounded-xl bg-[#E8F0FE] p-3 text-xs text-[#1B3A6B]">{infoText}</div>
              <p className="mt-2 px-1 text-[10px] leading-relaxed text-gray-500">
                {(() => {
                  const SOURCES: Record<string, { name: string; url: string }> = {
                    Sweden: { name: "Folkhälsomyndigheten", url: "folkhalsomyndigheten.se" },
                    "United Kingdom": { name: "NHS Green Book", url: "gov.uk/greenbook" },
                    "United States": { name: "CDC Immunization Schedule", url: "cdc.gov" },
                    Germany: { name: "STIKO", url: "rki.de" },
                    France: { name: "Ministère de la Santé", url: "sante.gouv.fr" },
                    Australia: { name: "Australian Immunisation Handbook", url: "health.gov.au" },
                    Canada: { name: "Canadian Immunization Guide", url: "canada.ca" },
                    Norway: { name: "Folkehelseinstituttet", url: "fhi.no" },
                    Denmark: { name: "Sundhedsstyrelsen", url: "sst.dk" },
                    Finland: { name: "THL", url: "thl.fi" },
                  };
                  const src = nationality && SOURCES[nationality];
                  const label = lang === "sv" ? "Källa" : "Source";
                  if (src) return `${label}: ${src.name} · ${src.url}`;
                  return `${label}: WHO Immunization · who.int/immunization`;
                })()}
              </p>
            </section>





            {/* SECTION 2 */}
            <section className="rounded-2xl border border-gray-200 p-4">
              <h2 className="text-base font-bold text-[#0D1B2A]">{t("s2")}</h2>
              <div className="mt-3 space-y-2">
                {travel.length === 0 && (
                  <p className="text-xs text-gray-500">{t("no_destinations")}</p>
                )}
                {travel.map((g, gIdx) => (
                  <TravelCard
                    key={g.uid}
                    entry={g}
                    t={t}
                    onChange={(patch) => {
                      setTravel((arr) => arr.map((x, i) => (i === gIdx ? { ...x, ...patch } : x)));
                      markDirty();
                    }}
                    onDelete={() => {
                      setTravel((arr) => arr.filter((_, i) => i !== gIdx));
                      markDirty();
                    }}
                    onSave={saveAll}
                  />
                ))}

              </div>
              <button
                type="button"
                onClick={() => {
                  setTravel((arr) => [
                    ...arr,
                    {
                      uid: crypto.randomUUID(),
                      destination: "",
                      countryQuery: "",
                      vaccines: [],
                      customDraft: "",
                      collapsed: false,
                    },
                  ]);
                  markDirty();
                }}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: ACCENT_2 }}
              >
                <Plus className="h-4 w-4" />
                {t("add_destination")}
              </button>
            </section>

            {/* SECTION 3 */}
            <section className="rounded-2xl border border-gray-200 p-4">
              <h2 className="text-base font-bold text-[#0D1B2A]">{t("s3")}</h2>
              <div className="mt-3 space-y-2">
                {others.length === 0 && (
                  <p className="text-xs text-gray-500">{t("no_other")}</p>
                )}
                {others.map((o, idx) => (
                  <OtherCard
                    key={o.uid}
                    entry={o}
                    t={t}
                    onChange={(patch) => {
                      setOthers((arr) => arr.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
                      markDirty();
                    }}
                    onDelete={() => {
                      setOthers((arr) => arr.filter((_, i) => i !== idx));
                      markDirty();
                    }}
                    onSave={saveAll}
                  />
                ))}

              </div>
              <button
                type="button"
                onClick={() => {
                  setOthers((arr) => [
                    ...arr,
                    { uid: crypto.randomUUID(), vaccine_name: "", date: "", boosters: [], collapsed: false },
                  ]);
                  markDirty();
                }}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: ACCENT_2 }}
              >
                <Plus className="h-4 w-4" />
                {t("add_vaccine")}
              </button>
            </section>

            {/* SECTION 4 */}
            <section className="rounded-2xl border border-gray-200">
              <button
                type="button"
                onClick={() => setContraOpen((v) => !v)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="text-base font-bold text-[#0D1B2A]">{t("s4")}</span>
                <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${contraOpen ? "rotate-180" : ""}`} />
              </button>
              {contraOpen && (
                <div className="space-y-3 px-4 pb-4">
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-400">
                    {t("cert_upcoming")}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("contra_label")}</label>
                    <Textarea
                      value={contra}
                      onChange={(e) => { setContra(e.target.value); markDirty(); }}
                      placeholder={t("contra_ph")}
                      className="mt-1 min-h-[90px]"
                    />
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-100 bg-white p-4">
        <button
          type="button"
          onClick={async () => {
            bypassGuardRef.current = true;
            const ok = await saveAll();
            if (ok) {
              navigate({ to: "/passport" });
            } else {
              bypassGuardRef.current = false;
            }
          }}

          className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow hover:opacity-95"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_2} 100%)` }}
        >
          {t("save")}
        </button>
      </div>

      <LeaveDialog resolver={resolver} onSaveAndLeave={saveAll} />
    </div>
  );
}

function ChildhoodCard({
  vax, lang, t, onStatus, onYear,
}: {
  vax: ChildhoodVax;
  lang: Lang;
  t: (k: string) => string;
  onStatus: (s: Status) => void;
  onYear: (y: string) => void;
}) {
  const desc = lang === "sv" ? vax.descSv : vax.descEn;
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="text-sm font-semibold text-[#0D1B2A]">{vax.name}</div>
      <div className="text-xs text-gray-500">{desc}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <StatusPill active={vax.status === "likely_received"} tone="green" onClick={() => onStatus("likely_received")}>
          {t("likely")}
        </StatusPill>
        <StatusPill active={vax.status === "not_received"} tone="red" onClick={() => onStatus("not_received")}>
          {t("not_received")}
        </StatusPill>
        <StatusPill active={vax.status === "unsure"} tone="gray" onClick={() => onStatus("unsure")}>
          {t("unsure")}
        </StatusPill>
      </div>
      {vax.status === "likely_received" && (
        <Input
          type="text"
          value={vax.year_received}
          onChange={(e) => onYear(e.target.value)}
          placeholder={t("year_ph")}
          className="mt-2 h-8 text-xs"
        />
      )}
    </div>
  );
}

function StatusPill({
  active, tone, onClick, children,
}: {
  active: boolean;
  tone: "green" | "red" | "gray";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    green: active ? "bg-green-100 text-green-800 border-green-400" : "bg-white text-gray-600 border-gray-300",
    red: active ? "bg-red-100 text-red-800 border-red-400" : "bg-white text-gray-600 border-gray-300",
    gray: active ? "bg-gray-200 text-gray-800 border-gray-400" : "bg-white text-gray-600 border-gray-300",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function TravelCard({
  entry, t, onChange, onDelete, onSave,
}: {
  entry: TravelEntry;
  t: (k: string) => string;
  onChange: (patch: Partial<TravelEntry>) => void;
  onDelete: () => void;
  onSave: () => Promise<boolean> | void;
}) {

  const [showSuggest, setShowSuggest] = useState(false);

  if (entry.collapsed && entry.destination) {
    const checkedVax = entry.vaccines.filter((v) => v.checked);
    return (
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[#0D1B2A]">{entry.destination}</div>
          {checkedVax.length === 0 ? (
            <div className="truncate text-xs text-gray-600">—</div>
          ) : (
            <ul className="mt-0.5 space-y-0.5">
              {checkedVax.map((v, i) => (
                <li key={`${v.name}-${i}`} className="truncate text-xs text-gray-600">
                  {formatVaxSummary(v.name, v.date, v.boosters)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => onChange({ collapsed: false })} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDelete} className="rounded-md p-1.5 text-red-500 hover:bg-red-50" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const filtered = entry.countryQuery && entry.countryQuery !== entry.destination
    ? COUNTRIES.filter((c) => c.toLowerCase().includes(entry.countryQuery.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div
      className="rounded-xl border border-gray-200 p-3"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.defaultPrevented) {
          e.preventDefault();
          if (entry.destination) onSave();
        }
      }}
    >

      <div className="relative">
        <Input
          value={entry.countryQuery}
          onChange={(e) => {
            onChange({ countryQuery: e.target.value });
            setShowSuggest(true);
          }}
          onFocus={() => setShowSuggest(true)}
          onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
          placeholder={t("country_ph")}
          className="h-9 text-sm"
        />
        {showSuggest && filtered.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-md">
            {filtered.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const sugg = suggestionsFor(c);
                    const existingByName: Record<string, TravelEntry["vaccines"][number]> = {};
                    entry.vaccines.forEach((v) => { existingByName[v.name] = v; });
                    const newVax = sugg.map((s) => existingByName[s] ?? { name: s, checked: false, date: "", boosters: [] });
                    // keep any custom vaccines the user already added
                    entry.vaccines.forEach((v) => {
                      if (!sugg.includes(v.name)) newVax.push(v);
                    });
                    onChange({ destination: c, countryQuery: c, vaccines: newVax });
                    setShowSuggest(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!entry.destination && (
        <p className="mt-2 text-xs text-gray-500">{t("no_country_selected")}</p>
      )}

      {entry.destination && (
        <>
          <p className="mt-3 text-xs font-semibold text-gray-700">{t("suggested")}</p>
          <div className="mt-2 space-y-2">
            {entry.vaccines.map((v, idx) => (
              <div key={`${v.name}-${idx}`} className="rounded-lg border border-gray-200 p-2">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={v.checked}
                    onCheckedChange={(c) => {
                      const next = [...entry.vaccines];
                      next[idx] = { ...v, checked: !!c };
                      onChange({ vaccines: next });
                    }}
                  />
                  <span className="text-sm">{v.name}</span>
                </label>
                {v.checked && (
                  <div className="mt-2 space-y-1.5">
                    <Input
                      value={v.date}
                      onChange={(e) => {
                        const next = [...entry.vaccines];
                        next[idx] = { ...v, date: e.target.value };
                        onChange({ vaccines: next });
                      }}
                      placeholder={t("date_ph")}
                      className="h-8 text-xs"
                    />
                    {v.boosters.map((b, bi) => (
                      <div key={bi} className="flex gap-1">
                        <Input
                          value={b}
                          onChange={(e) => {
                            const nb = [...v.boosters];
                            nb[bi] = e.target.value;
                            const next = [...entry.vaccines];
                            next[idx] = { ...v, boosters: nb };
                            onChange({ vaccines: next });
                          }}
                          placeholder={t("booster_ph")}
                          className="h-8 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nb = v.boosters.filter((_, i) => i !== bi);
                            const next = [...entry.vaccines];
                            next[idx] = { ...v, boosters: nb };
                            onChange({ vaccines: next });
                          }}
                          className="rounded-md p-1 text-red-500 hover:bg-red-50"
                          aria-label="Remove booster"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...entry.vaccines];
                        next[idx] = { ...v, boosters: [...v.boosters, ""] };
                        onChange({ vaccines: next });
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                      style={{ color: ACCENT_2 }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("add_booster")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-1">
            <Input
              value={entry.customDraft}
              onChange={(e) => onChange({ customDraft: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = entry.customDraft.trim();
                  if (!v) return;
                  onChange({
                    vaccines: [...entry.vaccines, { name: v, checked: true, date: "", boosters: [] }],
                    customDraft: "",
                  });
                }
              }}
              placeholder={t("custom_vax_ph")}
              className="h-8 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                const v = entry.customDraft.trim();
                if (!v) return;
                onChange({
                  vaccines: [...entry.vaccines, { name: v, checked: true, date: "", boosters: [] }],
                  customDraft: "",
                });
              }}
              className="rounded-md px-2 text-xs font-semibold text-white"
              style={{ background: ACCENT_2 }}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function OtherCard({
  entry, t, onChange, onDelete, onSave,
}: {
  entry: OtherEntry;
  t: (k: string) => string;
  onChange: (patch: Partial<OtherEntry>) => void;
  onDelete: () => void;
  onSave: () => Promise<boolean> | void;
}) {

  const [showSuggest, setShowSuggest] = useState(false);
  const filtered = entry.vaccine_name
    ? OTHER_VAX_SUGGESTIONS.filter((s) => s.toLowerCase().includes(entry.vaccine_name.toLowerCase())).slice(0, 8)
    : OTHER_VAX_SUGGESTIONS.slice(0, 8);

  if (entry.collapsed && entry.vaccine_name) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[#0D1B2A]">
            {formatVaxSummary(entry.vaccine_name, entry.date, entry.boosters)}
          </div>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => onChange({ collapsed: false })} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDelete} className="rounded-md p-1.5 text-red-500 hover:bg-red-50" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-gray-200 p-3"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.defaultPrevented) {
          e.preventDefault();
          if (entry.vaccine_name.trim()) onSave();
        }
      }}
    >

      <label className="text-xs font-semibold text-gray-700">{t("vaccine_name")}</label>
      <div className="relative">
        <Input
          value={entry.vaccine_name}
          onChange={(e) => { onChange({ vaccine_name: e.target.value }); setShowSuggest(true); }}
          onFocus={() => setShowSuggest(true)}
          onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
          placeholder={t("vaccine_name_ph")}
          className="mt-1 h-9 text-sm"
        />
        {showSuggest && filtered.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-md">
            {filtered.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange({ vaccine_name: s });
                    setShowSuggest(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Input
        value={entry.date}
        onChange={(e) => onChange({ date: e.target.value })}
        placeholder={t("date_ph")}
        className="mt-2 h-9 text-sm"
      />

      {entry.boosters.map((b, bi) => (
        <div key={bi} className="mt-2 flex gap-1">
          <Input
            value={b}
            onChange={(e) => {
              const nb = [...entry.boosters];
              nb[bi] = e.target.value;
              onChange({ boosters: nb });
            }}
            placeholder={t("booster_ph")}
            className="h-8 text-xs"
          />
          <button
            type="button"
            onClick={() => onChange({ boosters: entry.boosters.filter((_, i) => i !== bi) })}
            className="rounded-md p-1 text-red-500 hover:bg-red-50"
            aria-label="Remove booster"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange({ boosters: [...entry.boosters, ""] })}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
        style={{ color: ACCENT_2 }}
      >
        <Plus className="h-3.5 w-3.5" />
        {t("add_booster")}
      </button>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
