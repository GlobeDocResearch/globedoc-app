import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X, Pencil, Trash2, Plus, Check, ChevronDown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLeaveGuard, LeaveDialog, CardUnsavedBanner } from "@/components/passport/unsaved";

const ACCENT = "#9B7FD4";
const ACCENT_2 = "#7B5FB4";

type VaxDef = { name: string; descEn: string; descSv: string };
// Standard checklist excludes Covid (now its own primary+booster block),
// Influenza (annual handling), and Other (own sub-section).
const STANDARD_VACCINES: VaxDef[] = [
  { name: "DTP / DTaP", descEn: "Diphtheria, tetanus & whooping cough", descSv: "Difteri, stelkramp & kikhosta" },
  { name: "Polio (IPV)", descEn: "Inactivated polio vaccine", descSv: "Inaktiverat poliovaccin" },
  { name: "MMR", descEn: "Measles, mumps & rubella", descSv: "Mässling, påssjuka & röda hund" },
  { name: "Hib", descEn: "Haemophilus influenzae type b", descSv: "Haemophilus influenzae typ b" },
  { name: "Pneumococcal (PCV/PPV)", descEn: "Pneumonia & invasive pneumococcal disease", descSv: "Lunginflammation & invasiv pneumokocksjukdom" },
  { name: "Rotavirus", descEn: "Protects against severe diarrhoea in infants", descSv: "Skyddar mot svår diarré hos spädbarn" },
  { name: "Hepatitis B", descEn: "Liver infection caused by hepatitis B virus", descSv: "Leverinfektion orsakad av hepatit B-virus" },
  { name: "Hepatitis A", descEn: "Liver infection, often travel-related", descSv: "Leverinfektion, ofta reseberoende" },
  { name: "Meningococcal ACWY / B", descEn: "Bacterial meningitis", descSv: "Bakteriell hjärnhinneinflammation" },
  { name: "Varicella", descEn: "Chickenpox", descSv: "Vattkoppor" },
  { name: "HPV", descEn: "Human papillomavirus — protects against cervical & other cancers", descSv: "Humant papillomvirus — skyddar mot livmoderhals- och andra cancerformer" },
  { name: "Yellow fever", descEn: "Required for entry to some countries", descSv: "Krävs för inresa till vissa länder" },
  { name: "Typhoid", descEn: "Common in parts of Asia, Africa & Latin America", descSv: "Vanlig i delar av Asien, Afrika & Latinamerika" },
  { name: "Japanese encephalitis", descEn: "Mosquito-borne, risk in rural Asia", descSv: "Myggburen, risk på landsbygden i Asien" },
  { name: "Rabies (pre-exposure)", descEn: "For travellers to high-risk areas", descSv: "För resenärer till högriskområden" },
  { name: "Cholera (Dukoral)", descEn: "Also protects against turistdiarré", descSv: "Skyddar även mot turistdiarré" },
  { name: "TBE", descEn: "Tick-borne encephalitis", descSv: "Fästingburen hjärninflammation" },
  { name: "BCG", descEn: "Tuberculosis", descSv: "Tuberkulos" },
];

// Country → suggested travel vaccines
const TRAVEL_SUGGESTIONS: Record<string, string[]> = {
  Thailand: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Vietnam: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Cambodia: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Laos: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
  Myanmar: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis", "Rabies", "Cholera"],
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
  Singapore: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis"],
  Malaysia: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis"],
  Indonesia: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis"],
  Philippines: ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese encephalitis"],
};
const NO_SUGGESTION_COUNTRIES = new Set([
  "USA", "United States", "Canada", "Australia",
  "United Kingdom", "Ireland", "France", "Germany", "Netherlands", "Belgium",
  "Spain", "Portugal", "Italy", "Switzerland", "Austria", "Denmark", "Norway",
  "Sweden", "Finland", "Iceland", "Luxembourg",
]);
const GENERIC_SUGGESTIONS = ["Hepatitis A", "Hepatitis B", "Typhoid"];

function suggestionsFor(country: string): string[] | null {
  const c = country.trim();
  if (!c) return null;
  if (TRAVEL_SUGGESTIONS[c]) return TRAVEL_SUGGESTIONS[c];
  if (NO_SUGGESTION_COUNTRIES.has(c)) return [];
  return GENERIC_SUGGESTIONS;
}

type Record_ = { id: string; vaccine: string; date: string; batch_number: string; provider: string; collapsed: boolean; persisted: boolean };
// Travel group is by destination country; each tick = one row in travel_vaccines.
type TravelRow = { id: string; vaccine: string; date: string; persisted: boolean };
type TravelGroup = { key: string; destination: string; rows: TravelRow[]; customDraft: string; collapsed: boolean };

type Booster = { id: string; date: string; persisted: boolean };
type InfluenzaYear = { id: string; year: string; persisted: boolean };
type OtherVax = { id: string; vaccine_name: string; date: string; notes: string; collapsed: boolean; persisted: boolean };

const T: Record<Lang, Record<string, any>> = {
  en: {
    title: "Vaccinations",
    subtitle: "Complete immunisation record",
    nothing: "Nothing to report",
    info: "Gather all vaccines in one place — childhood records, travel vaccines, employer requirements and boosters. Check your vaccination book, 1177 or your GP record.",
    s1: "Vaccination record",
    s2: "Standard vaccines — tick those received",
    s3: "Travel vaccines",
    s4: "Certificates & contraindications",
    add_vax: "Add vaccination",
    add_travel: "Add travel vaccine",
    f_vaccine: "Vaccine",
    f_vaccine_ph: "E.g. MMR",
    f_date: "Date",
    f_date_ph: "E.g. 2019-03-15",
    f_batch: "Batch number",
    f_batch_ph: "E.g. AB1234",
    f_provider: "Provider / clinic",
    f_provider_ph: "E.g. Vårdcentralen Liljeholmen",
    f_destination: "Destination country",
    f_destination_ph: "E.g. Brazil",
    f_ihr: "International yellow vaccination card (IHR)?",
    ihr_yes: "Yes",
    ihr_no: "No",
    ihr_lost: "Lost",
    f_contra: "Vaccination contraindication?",
    f_contra_ph: "Reason — e.g. immunocompromised, allergy to excipient…",
    save: "Save",
    save_item: "Save",
    saved: "Saved",
    saveError: "Could not save",
    autofilled: "Auto-filled from your profile",
    help_sweden: (y: string) => `Based on the Swedish vaccination programme for someone born in ${y}. Pre-checked vaccines reflect what was standard when you were born — adjust if needed.`,
    help_other: "Tick the vaccines you have received. We don't have pre-selections for your country of origin — please check your vaccination records.",
    help_none: "Complete your profile to get personalised vaccine suggestions.",
    covid_primary: "Covid-19 primary series",
    covid_primary_desc: "Initial COVID-19 vaccination",
    covid_primary_date: "Primary series date",
    covid_booster_date_ph: "E.g. 2022-09-15",
    add_booster: "Add booster dose",
    booster_label: "Booster",
    influenza: "Influenza",
    influenza_desc: "Seasonal flu",
    influenza_note: "Annual vaccine — tick if you received it this season",
    year_ph: "E.g. 2025",
    add_year: "Add another year",
    other_section: "Other vaccines",
    add_other: "Add other vaccine",
    other_name: "Vaccine name",
    other_name_ph: "E.g. Smallpox",
    notes: "Notes",
    notes_ph: "Optional",
    travel_pick: "Suggested vaccines for this country — tick those received",
    travel_none: "No specific recommendations for this country.",
    travel_unknown: "Common travel vaccines — tick those received:",
    add_custom_vax: "Add custom vaccine",
    custom_vax_ph: "E.g. Tick-borne encephalitis",
  },
  sv: {
    title: "Vaccinationer",
    subtitle: "Komplett vaccinationsregister",
    nothing: "Inget att rapportera",
    info: "Samla alla vaccin på ett ställe — barnvaccin, resevaccin, arbetsgivarkrav och boosters. Kolla din vaccinationsbok, 1177 eller din vårdcentral.",
    s1: "Vaccinationsregister",
    s2: "Standardvaccin — bocka i de du fått",
    s3: "Resevaccin",
    s4: "Intyg & kontraindikationer",
    add_vax: "Lägg till vaccination",
    add_travel: "Lägg till resevaccin",
    f_vaccine: "Vaccin",
    f_vaccine_ph: "T.ex. MPR",
    f_date: "Datum",
    f_date_ph: "T.ex. 2019-03-15",
    f_batch: "Batchnummer",
    f_batch_ph: "T.ex. AB1234",
    f_provider: "Vårdgivare / klinik",
    f_provider_ph: "T.ex. Vårdcentralen Liljeholmen",
    f_destination: "Destinationsland",
    f_destination_ph: "T.ex. Brasilien",
    f_ihr: "Internationellt gult vaccinationskort (IHR)?",
    ihr_yes: "Ja",
    ihr_no: "Nej",
    ihr_lost: "Förlorat",
    f_contra: "Kontraindikation mot vaccin?",
    f_contra_ph: "Skäl — t.ex. immunsuppression, allergi mot hjälpämne…",
    save: "Spara",
    save_item: "Spara",
    saved: "Sparat",
    saveError: "Kunde inte spara",
    autofilled: "Automatiskt ifyllt från din profil",
    help_sweden: (y: string) => `Baserat på svenska vaccinationsprogrammet för någon född ${y}. Förkryssade vaccin speglar det som var standard när du föddes — justera vid behov.`,
    help_other: "Bocka i de vaccin du fått. Vi har inga förval för ditt ursprungsland — kontrollera dina vaccinationsuppgifter.",
    help_none: "Komplettera din profil för att få personliga vaccinförslag.",
    covid_primary: "Covid-19 grundvaccination",
    covid_primary_desc: "Inledande covid-19-vaccination",
    covid_primary_date: "Datum för grundvaccination",
    covid_booster_date_ph: "T.ex. 2022-09-15",
    add_booster: "Lägg till påfyllnadsdos",
    booster_label: "Påfyllnadsdos",
    influenza: "Influensa",
    influenza_desc: "Säsongsinfluensa",
    influenza_note: "Årligt vaccin — bocka i om du fått det denna säsong",
    year_ph: "T.ex. 2025",
    add_year: "Lägg till ytterligare år",
    other_section: "Övriga vaccin",
    add_other: "Lägg till övrigt vaccin",
    other_name: "Vaccinets namn",
    other_name_ph: "T.ex. Smittkoppor",
    notes: "Anteckningar",
    notes_ph: "Valfritt",
    travel_pick: "Rekommenderade vaccin för detta land — bocka i de du fått",
    travel_none: "Inga specifika rekommendationer för detta land.",
    travel_unknown: "Vanliga resevaccin — bocka i de du fått:",
    add_custom_vax: "Lägg till eget vaccin",
    custom_vax_ph: "T.ex. Fästingburen hjärninflammation",
  },
};

export default function VaccinationsForm() {
  const { lang } = useI18n();
  const t = (k: string): string => (T[lang][k] ?? T.en[k]) as string;
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [nothing, setNothing] = useState(false);
  const [records, setRecords] = useState<Record_[]>([]);
  const [standard, setStandard] = useState<Record<string, boolean>>({});
  const [travelGroups, setTravelGroups] = useState<TravelGroup[]>([]);
  const [ihr, setIhr] = useState<string>("");
  const [contra, setContra] = useState("");

  // Covid
  const [covidPrimary, setCovidPrimary] = useState(false);
  const [covidPrimaryDate, setCovidPrimaryDate] = useState("");
  const [boosters, setBoosters] = useState<Booster[]>([]);

  // Influenza
  const [influenza, setInfluenza] = useState(false);
  const [influenzaYears, setInfluenzaYears] = useState<InfluenzaYear[]>([]);

  // Other vaccines
  const [others, setOthers] = useState<OtherVax[]>([]);

  const [travelOpen, setTravelOpen] = useState(false);
  const [certsOpen, setCertsOpen] = useState(false);

  const [nationality, setNationality] = useState<string | null>(null);
  const [birthYear, setBirthYear] = useState<string | null>(null);

  // Dirty tracking — keys: `rec:<id>`, `oth:<id>`, `trv:<key>`
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const markDirty = (k: string) => setDirtyIds((s) => { const n = new Set(s); n.add(k); return n; });
  const clearDirty = (k: string) => setDirtyIds((s) => { const n = new Set(s); n.delete(k); return n; });
  const resolver = useLeaveGuard(dirtyIds.size > 0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(user.id);
      const sb = supabase as any;
      const [vr, sv, tv, vc, av, prof] = await Promise.all([
        sb.from("vaccination_records").select("*").eq("user_id", user.id).order("created_at"),
        sb.from("standard_vaccines").select("*").eq("user_id", user.id),
        sb.from("travel_vaccines").select("*").eq("user_id", user.id).order("created_at"),
        sb.from("vaccination_certificates").select("*").eq("user_id", user.id).maybeSingle(),
        sb.from("additional_vaccines").select("*").eq("user_id", user.id).order("created_at"),
        sb.from("profiles").select("nationality,date_of_birth").eq("user_id", user.id).maybeSingle(),
      ]);
      if (vr.data) setRecords(vr.data.map((r: any) => ({
        id: r.id, vaccine: r.vaccine ?? "", date: r.date ?? "", batch_number: r.batch_number ?? "",
        provider: r.provider ?? "", collapsed: true, persisted: true,
      })));
      if (sv.data) {
        const map: Record<string, boolean> = {};
        sv.data.forEach((r: any) => { map[r.vaccine_name] = !!r.received; });
        setStandard(map);
      }
      if (tv.data) {
        // group by destination
        const groups = new Map<string, TravelGroup>();
        tv.data.forEach((r: any) => {
          const dest = r.destination ?? "";
          const key = dest.toLowerCase();
          if (!groups.has(key)) {
            groups.set(key, { key, destination: dest, rows: [], customDraft: "", collapsed: true });
          }
          groups.get(key)!.rows.push({ id: r.id, vaccine: r.vaccine ?? "", date: r.date ?? "", persisted: true });
        });
        setTravelGroups(Array.from(groups.values()));
      }
      if (vc.data) {
        setIhr(vc.data.ihr_card ?? "");
        setContra(vc.data.contraindication_notes ?? "");
        setNothing(!!vc.data.nothing_to_report);
      }
      if (av.data) {
        const bs: Booster[] = [];
        const ys: InfluenzaYear[] = [];
        const os: OtherVax[] = [];
        av.data.forEach((r: any) => {
          if (r.category === "covid_booster") bs.push({ id: r.id, date: r.date ?? "", persisted: true });
          else if (r.category === "influenza_year") ys.push({ id: r.id, year: r.year ?? "", persisted: true });
          else if (r.category === "other") os.push({ id: r.id, vaccine_name: r.vaccine_name ?? "", date: r.date ?? "", notes: r.notes ?? "", collapsed: true, persisted: true });
        });
        setBoosters(bs);
        setInfluenzaYears(ys);
        setOthers(os);
      }
      // Load covid primary from standard_vaccines (uses date column)
      if (sv.data) {
        const cp = sv.data.find((r: any) => r.vaccine_name === "Covid-19 primary");
        if (cp) {
          setCovidPrimary(!!cp.received);
          setCovidPrimaryDate(cp.date ?? "");
        }
        const inf = sv.data.find((r: any) => r.vaccine_name === "Influenza");
        if (inf) setInfluenza(!!inf.received);
      }
      if (prof.data) {
        setNationality(prof.data.nationality ?? null);
        if (prof.data.date_of_birth) {
          setBirthYear(String(prof.data.date_of_birth).slice(0, 4));
        }
      }
      setLoading(false);
    })();
  }, [navigate]);

  const sb = supabase as any;
  const audit = (table: string, action: string) => {
    if (!userId) return;
    sb.from("audit_log").insert({ user_id: userId, table_name: table, action });
  };

  const upsertCert = async (patch: Partial<{ ihr_card: string; contraindication_notes: string; nothing_to_report: boolean }>) => {
    if (!userId) return;
    await sb.from("vaccination_certificates").upsert(
      { user_id: userId, ihr_card: ihr, contraindication_notes: contra, nothing_to_report: nothing, ...patch },
      { onConflict: "user_id" },
    );
    audit("vaccination_certificates", "upsert");
  };

  const toggleStandard = async (name: string, checked: boolean, extra?: { date?: string }) => {
    setStandard((s) => ({ ...s, [name]: checked }));
    if (!userId) return;
    await sb.from("standard_vaccines").upsert(
      { user_id: userId, vaccine_name: name, received: checked, ...(extra ?? {}) },
      { onConflict: "user_id,vaccine_name" },
    );
    audit("standard_vaccines", "upsert");
  };

  // Vaccination records
  const addRecord = () => {
    const id = crypto.randomUUID();
    setRecords((s) => [...s, { id, vaccine: "", date: "", batch_number: "", provider: "", collapsed: false, persisted: false }]);
    markDirty(`rec:${id}`);
  };
  const updateRecord = (id: string, p: Partial<Record_>) => setRecords((s) => s.map((x) => x.id === id ? { ...x, ...p } : x));
  const editRecord = (id: string, p: Partial<Record_>) => { updateRecord(id, p); markDirty(`rec:${id}`); };
  const saveRecord = async (item: Record_) => {
    if (!userId) return;
    const payload = { vaccine: item.vaccine, date: item.date, batch_number: item.batch_number, provider: item.provider };
    if (item.persisted) {
      await sb.from("vaccination_records").update(payload).eq("id", item.id);
      audit("vaccination_records", "update");
      updateRecord(item.id, { collapsed: true });
    } else {
      const { data } = await sb.from("vaccination_records").insert({ user_id: userId, ...payload }).select().single();
      audit("vaccination_records", "insert");
      if (data) updateRecord(item.id, { id: data.id, persisted: true, collapsed: true });
    }
    clearDirty(`rec:${item.id}`);
  };
  const discardRecord = async (item: Record_) => {
    if (!item.persisted) {
      setRecords((s) => s.filter((x) => x.id !== item.id));
    } else {
      const { data } = await sb.from("vaccination_records").select("*").eq("id", item.id).maybeSingle();
      if (data) updateRecord(item.id, { vaccine: data.vaccine ?? "", date: data.date ?? "", batch_number: data.batch_number ?? "", provider: data.provider ?? "", collapsed: true });
    }
    clearDirty(`rec:${item.id}`);
  };
  const deleteRecord = async (item: Record_) => {
    if (item.persisted) { await sb.from("vaccination_records").delete().eq("id", item.id); audit("vaccination_records", "delete"); }
    setRecords((s) => s.filter((x) => x.id !== item.id));
    clearDirty(`rec:${item.id}`);
  };

  // Travel groups
  const addTravelGroup = () => setTravelGroups((s) => [...s, { key: crypto.randomUUID(), destination: "", rows: [], customDraft: "", collapsed: false }]);
  const updateGroup = (key: string, p: Partial<TravelGroup>) => setTravelGroups((s) => s.map((g) => g.key === key ? { ...g, ...p } : g));
  const deleteGroup = async (group: TravelGroup) => {
    for (const r of group.rows) {
      if (r.persisted) { await sb.from("travel_vaccines").delete().eq("id", r.id); audit("travel_vaccines", "delete"); }
    }
    setTravelGroups((s) => s.filter((g) => g.key !== group.key));
  };
  const setGroupVaccine = async (group: TravelGroup, vaccine: string, checked: boolean) => {
    if (!userId || !group.destination.trim()) return;
    if (checked) {
      const { data } = await sb.from("travel_vaccines").insert({
        user_id: userId, destination: group.destination, vaccine, date: "",
      }).select().single();
      audit("travel_vaccines", "insert");
      if (data) {
        updateGroup(group.key, { rows: [...group.rows, { id: data.id, vaccine, date: "", persisted: true }] });
      }
    } else {
      const row = group.rows.find((r) => r.vaccine === vaccine);
      if (row?.persisted) {
        await sb.from("travel_vaccines").delete().eq("id", row.id);
        audit("travel_vaccines", "delete");
      }
      updateGroup(group.key, { rows: group.rows.filter((r) => r.vaccine !== vaccine) });
    }
  };
  const setRowDate = async (group: TravelGroup, rowId: string, date: string) => {
    const nextRows = group.rows.map((r) => r.id === rowId ? { ...r, date } : r);
    updateGroup(group.key, { rows: nextRows });
    await sb.from("travel_vaccines").update({ date }).eq("id", rowId);
    audit("travel_vaccines", "update");
  };
  const addCustomToGroup = async (group: TravelGroup) => {
    const v = group.customDraft.trim();
    if (!v || !userId || !group.destination.trim()) return;
    const { data } = await sb.from("travel_vaccines").insert({
      user_id: userId, destination: group.destination, vaccine: v, date: "",
    }).select().single();
    audit("travel_vaccines", "insert");
    if (data) updateGroup(group.key, { rows: [...group.rows, { id: data.id, vaccine: v, date: "", persisted: true }], customDraft: "" });
  };

  // Covid primary & boosters
  const toggleCovidPrimary = async (checked: boolean) => {
    setCovidPrimary(checked);
    await toggleStandard("Covid-19 primary", checked, { date: covidPrimaryDate });
    if (!checked) {
      // remove all boosters
      for (const b of boosters) {
        if (b.persisted) await sb.from("additional_vaccines").delete().eq("id", b.id);
      }
      audit("additional_vaccines", "delete");
      setBoosters([]);
    }
  };
  const updateCovidDate = async (date: string) => {
    setCovidPrimaryDate(date);
    if (!userId || !covidPrimary) return;
    await sb.from("standard_vaccines").upsert(
      { user_id: userId, vaccine_name: "Covid-19 primary", received: true, date },
      { onConflict: "user_id,vaccine_name" },
    );
    audit("standard_vaccines", "upsert");
  };
  const addBooster = async () => {
    if (!userId) return;
    const { data } = await sb.from("additional_vaccines").insert({
      user_id: userId, category: "covid_booster", vaccine_name: "Covid-19 booster", date: "",
    }).select().single();
    audit("additional_vaccines", "insert");
    if (data) setBoosters((s) => [...s, { id: data.id, date: "", persisted: true }]);
  };
  const updateBoosterDate = async (id: string, date: string) => {
    setBoosters((s) => s.map((b) => b.id === id ? { ...b, date } : b));
    await sb.from("additional_vaccines").update({ date }).eq("id", id);
    audit("additional_vaccines", "update");
  };
  const deleteBooster = async (id: string) => {
    await sb.from("additional_vaccines").delete().eq("id", id);
    audit("additional_vaccines", "delete");
    setBoosters((s) => s.filter((b) => b.id !== id));
  };

  // Influenza
  const toggleInfluenza = async (checked: boolean) => {
    setInfluenza(checked);
    await toggleStandard("Influenza", checked);
    if (!checked) {
      for (const y of influenzaYears) {
        if (y.persisted) await sb.from("additional_vaccines").delete().eq("id", y.id);
      }
      audit("additional_vaccines", "delete");
      setInfluenzaYears([]);
    } else if (influenzaYears.length === 0) {
      // seed one empty year row
      await addInfluenzaYear();
    }
  };
  const addInfluenzaYear = async () => {
    if (!userId) return;
    const { data } = await sb.from("additional_vaccines").insert({
      user_id: userId, category: "influenza_year", vaccine_name: "Influenza", year: "",
    }).select().single();
    audit("additional_vaccines", "insert");
    if (data) setInfluenzaYears((s) => [...s, { id: data.id, year: "", persisted: true }]);
  };
  const updateInfluenzaYear = async (id: string, year: string) => {
    setInfluenzaYears((s) => s.map((y) => y.id === id ? { ...y, year } : y));
    await sb.from("additional_vaccines").update({ year }).eq("id", id);
    audit("additional_vaccines", "update");
  };
  const deleteInfluenzaYear = async (id: string) => {
    await sb.from("additional_vaccines").delete().eq("id", id);
    audit("additional_vaccines", "delete");
    setInfluenzaYears((s) => s.filter((y) => y.id !== id));
  };

  // Other vaccines
  const addOther = () => {
    const id = crypto.randomUUID();
    setOthers((s) => [...s, { id, vaccine_name: "", date: "", notes: "", collapsed: false, persisted: false }]);
    markDirty(`oth:${id}`);
  };
  const updateOther = (id: string, p: Partial<OtherVax>) => setOthers((s) => s.map((x) => x.id === id ? { ...x, ...p } : x));
  const editOther = (id: string, p: Partial<OtherVax>) => { updateOther(id, p); markDirty(`oth:${id}`); };
  const saveOther = async (item: OtherVax) => {
    if (!userId) return;
    const payload = { vaccine_name: item.vaccine_name, date: item.date, notes: item.notes };
    if (item.persisted) {
      await sb.from("additional_vaccines").update(payload).eq("id", item.id);
      audit("additional_vaccines", "update");
      updateOther(item.id, { collapsed: true });
    } else {
      const { data } = await sb.from("additional_vaccines").insert({ user_id: userId, category: "other", ...payload }).select().single();
      audit("additional_vaccines", "insert");
      if (data) updateOther(item.id, { id: data.id, persisted: true, collapsed: true });
    }
    clearDirty(`oth:${item.id}`);
  };
  const discardOther = async (item: OtherVax) => {
    if (!item.persisted) {
      setOthers((s) => s.filter((x) => x.id !== item.id));
    } else {
      const { data } = await sb.from("additional_vaccines").select("*").eq("id", item.id).maybeSingle();
      if (data) updateOther(item.id, { vaccine_name: data.vaccine_name ?? "", date: data.date ?? "", notes: data.notes ?? "", collapsed: true });
    }
    clearDirty(`oth:${item.id}`);
  };
  const deleteOther = async (item: OtherVax) => {
    if (item.persisted) { await sb.from("additional_vaccines").delete().eq("id", item.id); audit("additional_vaccines", "delete"); }
    setOthers((s) => s.filter((x) => x.id !== item.id));
    clearDirty(`oth:${item.id}`);
  };

  // Save all dirty open cards (used by LeaveDialog)
  const saveAllDirty = async () => {
    for (const item of records) if (dirtyIds.has(`rec:${item.id}`)) await saveRecord(item);
    for (const item of others) if (dirtyIds.has(`oth:${item.id}`)) await saveOther(item);
    for (const g of travelGroups) if (dirtyIds.has(`trv:${g.key}`)) clearDirty(`trv:${g.key}`);
  };

  const saveAll = async () => {
    try {
      await saveAllDirty();
      await upsertCert({});
      audit("vaccinations", "save_all");
      toast.success(t("saved"));
      navigate({ to: "/passport" });
    } catch { toast.error(t("saveError")); }
  };


  const isSweden = (nationality ?? "").trim().toLowerCase() === "sweden" || (nationality ?? "").trim().toLowerCase() === "sverige";
  const helpText = useMemo(() => {
    if (isSweden && birthYear) return (T[lang].help_sweden as (y: string) => string)(birthYear);
    return T[lang].help_other as string;
  }, [lang, birthYear, isSweden]);

  const anyPrechecked = Object.values(standard).some(Boolean);

  if (loading) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white pb-28 text-[#0D1B2A]">
      <header className="px-5 pt-6 pb-7" style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_2} 100%)` }}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">💉</span>
            <div>
              <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
              <p className="mt-1 text-sm text-white/90">{t("subtitle")}</p>
            </div>
          </div>
          <Link to="/passport" aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
            <X className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="space-y-5 px-5 pt-5">
        <div className="flex items-center justify-between rounded-2xl bg-[#F8F9FA] p-4">
          <span className="text-sm font-medium text-[#0D1B2A]">{t("nothing")}</span>
          <Switch
            checked={nothing}
            onCheckedChange={(v) => {
              setNothing(v);
              upsertCert({ nothing_to_report: v });
            }}
          />
        </div>

        {!nothing && (
          <>
            <div className="rounded-xl border border-[#D6CFEC] bg-[#F1ECFA] p-4 text-sm text-[#3E2F66]">
              {t("info")}
            </div>

            {/* Section 1 — Vaccination record */}
            <section>
              <h2 className="mb-2 text-sm font-bold text-[#0D1B2A]">{t("s1")}</h2>
              <div className="space-y-3">
                {records.map((item) => item.collapsed ? (
                  <SummaryRow key={item.id} text={[item.vaccine, item.date, item.provider].filter(Boolean).join(" · ")} onEdit={() => updateRecord(item.id, { collapsed: false })} onDelete={() => deleteRecord(item)} />
                ) : (
                  <div key={item.id} className="space-y-2 rounded-xl bg-[#F8F9FA] p-4">
                    <Field label={t("f_vaccine")} value={item.vaccine} ph={t("f_vaccine_ph")} onChange={(v) => editRecord(item.id, { vaccine: v })} />
                    <Field label={t("f_date")} value={item.date} ph={t("f_date_ph")} onChange={(v) => editRecord(item.id, { date: v })} />
                    <Field label={t("f_batch")} value={item.batch_number} ph={t("f_batch_ph")} onChange={(v) => editRecord(item.id, { batch_number: v })} />
                    <Field label={t("f_provider")} value={item.provider} ph={t("f_provider_ph")} onChange={(v) => editRecord(item.id, { provider: v })} />
                    {dirtyIds.has(`rec:${item.id}`) && (
                      <CardUnsavedBanner onSave={() => saveRecord(item)} onDiscard={() => discardRecord(item)} />
                    )}
                    <CardActions onSave={() => saveRecord(item)} onDelete={() => deleteRecord(item)} saveLabel={t("save_item")} />
                  </div>

                ))}
              </div>
              <AddBtn label={t("add_vax")} onClick={addRecord} />
            </section>

            {/* Section 2 — Standard vaccines */}
            <section>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-[#0D1B2A]">{t("s2")}</h2>
                {anyPrechecked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E0EBFB] px-2 py-0.5 text-[11px] font-medium text-[#1D4ED8]">
                    <Sparkles className="h-3 w-3" />
                    {t("autofilled")}
                  </span>
                )}
              </div>
              <p className="mb-3 text-xs text-gray-600">{helpText}</p>
              <div className="space-y-1 rounded-xl bg-[#F8F9FA] p-3">
                {STANDARD_VACCINES.map(({ name, descEn, descSv }) => {
                  const checked = !!standard[name];
                  return (
                    <div key={name} className="rounded-lg px-2 py-2 hover:bg-white">
                      <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                          className="mt-0.5"
                          checked={checked}
                          onCheckedChange={(v) => toggleStandard(name, !!v)}
                        />
                        <span className="flex-1">
                          <span className="block text-sm text-[#0D1B2A]">{name}</span>
                          <span className="block text-xs text-gray-500">{lang === "sv" ? descSv : descEn}</span>
                        </span>
                      </label>
                    </div>
                  );
                })}

                {/* Influenza — annual */}
                <div className="rounded-lg px-2 py-2 hover:bg-white">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox className="mt-0.5" checked={influenza} onCheckedChange={(v) => toggleInfluenza(!!v)} />
                    <span className="flex-1">
                      <span className="block text-sm text-[#0D1B2A]">{t("influenza")}</span>
                      <span className="block text-xs text-gray-500">{t("influenza_desc")}</span>
                      <span className="mt-1 block text-xs italic text-gray-500">{t("influenza_note")}</span>
                    </span>
                  </label>
                  {influenza && (
                    <div className="mt-2 ml-7 space-y-2">
                      {influenzaYears.map((y) => (
                        <div key={y.id} className="flex items-center gap-2">
                          <input
                            value={y.year}
                            onChange={(e) => setInfluenzaYears((s) => s.map((x) => x.id === y.id ? { ...x, year: e.target.value } : x))}
                            onBlur={(e) => updateInfluenzaYear(y.id, e.target.value)}
                            placeholder={t("year_ph")}
                            className="w-32 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#9B7FD4] focus:outline-none"
                          />
                          <button type="button" onClick={() => deleteInfluenzaYear(y.id)} className="rounded-md p-1.5 text-red-500 hover:bg-gray-200" aria-label="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addInfluenzaYear} className="text-xs font-medium text-[#7B5FB4] hover:underline">
                        + {t("add_year")}
                      </button>
                    </div>
                  )}
                </div>

                {/* Covid-19 primary + boosters */}
                <div className="rounded-lg px-2 py-2 hover:bg-white">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox className="mt-0.5" checked={covidPrimary} onCheckedChange={(v) => toggleCovidPrimary(!!v)} />
                    <span className="flex-1">
                      <span className="block text-sm text-[#0D1B2A]">{t("covid_primary")}</span>
                      <span className="block text-xs text-gray-500">{t("covid_primary_desc")}</span>
                    </span>
                  </label>
                  {covidPrimary && (
                    <div className="mt-2 ml-7 space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600">{t("covid_primary_date")}</label>
                        <input
                          value={covidPrimaryDate}
                          onChange={(e) => setCovidPrimaryDate(e.target.value)}
                          onBlur={(e) => updateCovidDate(e.target.value)}
                          placeholder={t("f_date_ph")}
                          className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#9B7FD4] focus:outline-none"
                        />
                      </div>
                      {boosters.map((b, i) => (
                        <div key={b.id}>
                          <label className="block text-xs text-gray-600">{t("booster_label")} {i + 1}</label>
                          <div className="mt-1 flex items-center gap-2">
                            <input
                              value={b.date}
                              onChange={(e) => setBoosters((s) => s.map((x) => x.id === b.id ? { ...x, date: e.target.value } : x))}
                              onBlur={(e) => updateBoosterDate(b.id, e.target.value)}
                              placeholder={t("covid_booster_date_ph")}
                              className="flex-1 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#9B7FD4] focus:outline-none"
                            />
                            <button type="button" onClick={() => deleteBooster(b.id)} className="rounded-md p-1.5 text-red-500 hover:bg-gray-200" aria-label="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addBooster} className="text-xs font-medium text-[#7B5FB4] hover:underline">
                        + {t("add_booster")}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Other vaccines sub-section */}
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-bold text-[#0D1B2A]">{t("other_section")}</h3>
                <div className="space-y-3">
                  {others.map((item) => item.collapsed ? (
                    <SummaryRow key={item.id} text={[item.vaccine_name, item.date].filter(Boolean).join(" · ")} onEdit={() => updateOther(item.id, { collapsed: false })} onDelete={() => deleteOther(item)} />
                  ) : (
                    <div key={item.id} className="space-y-2 rounded-xl bg-[#F8F9FA] p-4">
                      <Field label={t("other_name")} value={item.vaccine_name} ph={t("other_name_ph")} onChange={(v) => editOther(item.id, { vaccine_name: v })} />
                      <Field label={t("f_date")} value={item.date} ph={t("f_date_ph")} onChange={(v) => editOther(item.id, { date: v })} />
                      <div>
                        <label className="block text-xs text-gray-600">{t("notes")}</label>
                        <textarea
                          value={item.notes}
                          onChange={(e) => editOther(item.id, { notes: e.target.value })}
                          placeholder={t("notes_ph")}
                          rows={2}
                          className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#9B7FD4] focus:outline-none"
                        />
                      </div>
                      {dirtyIds.has(`oth:${item.id}`) && (
                        <CardUnsavedBanner onSave={() => saveOther(item)} onDiscard={() => discardOther(item)} />
                      )}
                      <CardActions onSave={() => saveOther(item)} onDelete={() => deleteOther(item)} saveLabel={t("save_item")} />
                    </div>

                  ))}
                </div>
                <AddBtn label={t("add_other")} onClick={addOther} />
              </div>
            </section>

            {/* Section 3 — Travel vaccines accordion */}
            <Accordion title={t("s3")} open={travelOpen} onToggle={() => setTravelOpen(!travelOpen)}>
              <div className="space-y-3">
                {travelGroups.map((group) => {
                  const sugg = suggestionsFor(group.destination);
                  const ticked = new Set(group.rows.map((r) => r.vaccine));
                  if (group.collapsed) {
                    const summary = group.rows.map((r) => [r.vaccine, group.destination, r.date].filter(Boolean).join(" · ")).join(" • ");
                    return (
                      <SummaryRow
                        key={group.key}
                        text={summary || group.destination}
                        onEdit={() => updateGroup(group.key, { collapsed: false })}
                        onDelete={() => deleteGroup(group)}
                      />
                    );
                  }
                  return (
                    <div key={group.key} className="space-y-3 rounded-xl bg-[#F8F9FA] p-4">
                      <Field
                        label={t("f_destination")}
                        value={group.destination}
                        ph={t("f_destination_ph")}
                        onChange={(v) => updateGroup(group.key, { destination: v })}
                      />
                      {group.destination.trim() && sugg !== null && (
                        <div>
                          <p className="mb-2 text-xs text-gray-600">
                            {sugg.length === 0
                              ? t("travel_none")
                              : TRAVEL_SUGGESTIONS[group.destination.trim()]
                                ? t("travel_pick")
                                : t("travel_unknown")}
                          </p>
                          <div className="space-y-2">
                            {sugg.map((v) => {
                              const isOn = ticked.has(v);
                              const row = group.rows.find((r) => r.vaccine === v);
                              return (
                                <div key={v} className="rounded-lg bg-white p-2">
                                  <label className="flex cursor-pointer items-center gap-3">
                                    <Checkbox checked={isOn} onCheckedChange={(c) => setGroupVaccine(group, v, !!c)} />
                                    <span className="text-sm text-[#0D1B2A]">{v}</span>
                                  </label>
                                  {isOn && row && (
                                    <input
                                      value={row.date}
                                      onChange={(e) => updateGroup(group.key, { rows: group.rows.map((r) => r.id === row.id ? { ...r, date: e.target.value } : r) })}
                                      onBlur={(e) => setRowDate(group, row.id, e.target.value)}
                                      placeholder={t("f_date_ph")}
                                      className="mt-2 ml-7 w-[calc(100%-1.75rem)] rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#9B7FD4] focus:outline-none"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Custom vaccine adder */}
                      {group.destination.trim() && (
                        <div className="flex gap-2">
                          <input
                            value={group.customDraft}
                            onChange={(e) => updateGroup(group.key, { customDraft: e.target.value })}
                            placeholder={t("custom_vax_ph")}
                            className="flex-1 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#9B7FD4] focus:outline-none"
                          />
                          <button type="button" onClick={() => addCustomToGroup(group)} className="rounded-md bg-[#7B5FB4] px-3 py-2 text-xs font-medium text-white hover:bg-[#6A4FA0]">
                            + {t("add_custom_vax")}
                          </button>
                        </div>
                      )}
                      {/* List custom-added (not in suggestions) entries */}
                      {group.rows.filter((r) => !(sugg ?? []).includes(r.vaccine)).map((r) => (
                        <div key={r.id} className="flex items-center justify-between rounded-lg bg-white p-2">
                          <span className="text-sm">{r.vaccine}{r.date ? ` · ${r.date}` : ""}</span>
                          <button type="button" onClick={() => setGroupVaccine(group, r.vaccine, false)} className="rounded-md p-1.5 text-red-500 hover:bg-gray-200" aria-label="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => deleteGroup(group)} className="rounded-md p-2 text-red-500 hover:bg-gray-200" aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => updateGroup(group.key, { collapsed: true })} className="rounded-md bg-[#7B5FB4] px-4 py-2 text-xs font-medium text-white hover:bg-[#6A4FA0]">
                          {t("save_item")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <AddBtn label={t("add_travel")} onClick={addTravelGroup} />
            </Accordion>

            {/* Section 4 — Certificates & contraindications */}
            <Accordion title={t("s4")} open={certsOpen} onToggle={() => setCertsOpen(!certsOpen)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600">{t("f_ihr")}</label>
                  <div className="mt-2 flex gap-2">
                    {[
                      { v: "yes", l: t("ihr_yes") },
                      { v: "no", l: t("ihr_no") },
                      { v: "lost", l: t("ihr_lost") },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => { setIhr(opt.v); upsertCert({ ihr_card: opt.v }); }}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          ihr === opt.v
                            ? "border-[#9B7FD4] bg-[#F1ECFA] text-[#3E2F66] font-medium"
                            : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:bg-[#F8F9FA]"
                        }`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600">{t("f_contra")}</label>
                  <textarea
                    value={contra}
                    onChange={(e) => setContra(e.target.value)}
                    onBlur={() => upsertCert({ contraindication_notes: contra })}
                    placeholder={t("f_contra_ph")}
                    rows={4}
                    className="mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#9B7FD4] focus:outline-none"
                  />
                </div>
              </div>
            </Accordion>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E5E7EB] bg-white p-4">
        <button
          type="button"
          onClick={saveAll}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9B7FD4] to-[#7B5FB4] px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
        >
          <Check className="h-4 w-4" />
          {t("save")}
        </button>
      </div>
      <LeaveDialog resolver={resolver} onSaveAndLeave={saveAllDirty} />
    </div>
  );
}

function Field({ label, value, ph, onChange }: { label: string; value: string; ph: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-600">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#9B7FD4] focus:outline-none"
      />
    </div>
  );
}

function SummaryRow({ text, onEdit, onDelete }: { text: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#F8F9FA] px-4 py-3">
      <span className="truncate text-sm text-[#0D1B2A]">{text}</span>
      <div className="flex gap-2">
        <button type="button" aria-label="Edit" onClick={onEdit} className="rounded-md p-1.5 text-gray-600 hover:bg-gray-200">
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Delete" onClick={onDelete} className="rounded-md p-1.5 text-red-500 hover:bg-gray-200">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CardActions({ onSave, onDelete, saveLabel }: { onSave: () => void; onDelete: () => void; saveLabel: string }) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button type="button" onClick={onDelete} className="rounded-md p-2 text-red-500 hover:bg-gray-200" aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
      <button type="button" onClick={onSave} className="rounded-md bg-[#7B5FB4] px-4 py-2 text-xs font-medium text-white hover:bg-[#6A4FA0]">
        {saveLabel}
      </button>
    </div>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E5E7EB] px-4 py-3 text-sm text-gray-600 hover:bg-[#F8F9FA]">
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

function Accordion({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <section>
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between py-2 text-left">
        <h2 className="text-sm font-bold text-[#0D1B2A]">{title}</h2>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </section>
  );
}
