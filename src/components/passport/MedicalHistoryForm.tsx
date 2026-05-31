import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X, Pencil, Trash2, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLeaveGuard, LeaveDialog, CardUnsavedBanner } from "./unsaved";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TOP_CONDITIONS, CONDITION_GROUPS, ALL_CONDITIONS } from "@/lib/medicalConditions";
import { searchIcd11, type Icd11Match } from "@/lib/icd11";
import {
  upsertPassportEntry,
  deletePassportEntry,
  titleForCondition,
  titleForStay,
  titleForLocation,
  firstYear,
} from "@/lib/passportRecords";

type Stay = {
  id: string;
  event: string;
  diagnosis: string;
  year: string;
  institution: string;
  city: string;
  country: string;
  record_type: string;
  notes: string;
  collapsed: boolean;
  persisted: boolean;
};


type ConditionTag = {
  id: string;
  condition_name: string;
  year: string;
  icd11_code: string | null;
  persisted: boolean;
};

type RecordLocation = {
  id: string;
  institution: string;
  city: string;
  country: string;
  years: string;
  record_type: string;
  collapsed: boolean;
  persisted: boolean;
};

const RECORD_TYPES = [
  "General records",
  "Imaging / Radiology",
  "Lab results",
  "Specialist records",
  "Other",
];



const SUGGESTIONS = ALL_CONDITIONS;


const T: Record<Lang, Record<string, string>> = {
  en: {
    title: "Medical History",
    subtitle: "Diagnoses, hospitalisations, operations & record locations",
    nothing: "Nothing to report",
    s1: "Current & chronic conditions",
    s1ph: "Search or type a condition…",
    s1_year_ph: "Year diagnosed, e.g. 2018",
    s2: "Hospitalisations, Operations & Global Record Locations",
    f_event: "Event / procedure",
    f_event_ph: "E.g. Appendectomy",
    f_diagnosis: "Diagnosis / condition treated",
    f_diagnosis_ph: "E.g. Appendicitis, hip fracture",
    f_year: "Year",
    f_year_ph: "E.g. 2019",
    f_hosp: "Hospital & country",
    f_hosp_ph: "E.g. Karolinska, Sweden",
    f_notes: "Notes / complications",
    f_notes_ph: "E.g. No complications",
    add_stay: "Add hospital stay",
    save_stay: "Save",
    s3: "Past resolved conditions",
    s3ph: "Search or type a condition…",
    s3_year_ph: "Year resolved, e.g. 2015",
    s4: "Obstetric & reproductive history",
    s4_optional: "Obstetric & reproductive history (if applicable)",
    na: "Not applicable",
    gave_birth: "Have you given birth?",
    num_children: "Number of children",
    complications: "Any complications during pregnancy or birth?",
    complications_ph: "E.g. Caesarean section, premature birth…",
    assisted: "Conceived via assisted reproduction?",
    describe: "Please describe",
    yes: "Yes",
    no: "No",
    save: "Save",
    saved: "Saved",
    saveError: "Could not save",
    add: "Add",
    no_match: "Press Enter to add",
  },
  sv: {
    title: "Sjukdomshistorik",
    subtitle: "Diagnoser, sjukhusvistelser, operationer & journalplatser",
    nothing: "Inget att rapportera",
    s1: "Pågående & kroniska tillstånd",
    s1ph: "Sök eller skriv ett tillstånd…",
    s1_year_ph: "År för diagnos, t.ex. 2018",
    s2: "Sjukhusvistelser, operationer & globala journalplatser",
    f_event: "Händelse / ingrepp",
    f_event_ph: "T.ex. Blindtarmsoperation",
    f_diagnosis: "Diagnos / behandlat tillstånd",
    f_diagnosis_ph: "T.ex. Blindtarmsinflammation, höftfraktur",
    f_year: "År",
    f_year_ph: "T.ex. 2019",
    f_hosp: "Sjukhus & land",
    f_hosp_ph: "T.ex. Karolinska, Sverige",
    f_notes: "Anteckningar / komplikationer",
    f_notes_ph: "T.ex. Inga komplikationer",
    add_stay: "Lägg till sjukhusvistelse",
    save_stay: "Spara",
    s3: "Tidigare avslutade tillstånd",
    s3ph: "Sök eller skriv ett tillstånd…",
    s3_year_ph: "År avslutat, t.ex. 2015",
    s4: "Obstetrisk & reproduktiv historik",
    s4_optional: "Obstetrisk & reproduktiv historik (om tillämpligt)",
    na: "Ej tillämpligt",
    gave_birth: "Har du fött barn?",
    num_children: "Antal barn",
    complications: "Komplikationer under graviditet eller förlossning?",
    complications_ph: "T.ex. Kejsarsnitt, för tidig födsel…",
    assisted: "Befruktad via assisterad befruktning?",
    describe: "Beskriv",
    yes: "Ja",
    no: "Nej",
    save: "Spara",
    saved: "Sparat",
    saveError: "Kunde inte spara",
    add: "Lägg till",
    no_match: "Tryck Enter för att lägga till",
  },
};

const ACCENT = "#5B6BD4";
const ACCENT_2 = "#7B8BE4";

export default function MedicalHistoryForm() {
  const { lang } = useI18n();
  const t = (k: keyof typeof T["en"]) => T[lang][k] ?? T.en[k];
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [nothing, setNothing] = useState(false);
  const [current, setCurrent] = useState<ConditionTag[]>([]);
  const [past, setPast] = useState<ConditionTag[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [locations, setLocations] = useState<RecordLocation[]>([]);


  const [biologicalSex, setBiologicalSex] = useState<string | null>(null);

  const [obNA, setObNA] = useState(false);
  const [gaveBirth, setGaveBirth] = useState<boolean | null>(null);
  const [numChildren, setNumChildren] = useState<string>("");
  const [obComplications, setObComplications] = useState("");
  const [assisted, setAssisted] = useState<boolean | null>(null);
  const [assistedNotes, setAssistedNotes] = useState("");

  const [dirty, setDirty] = useState(false);
  const [dirtyStays, setDirtyStays] = useState<Set<string>>(new Set());
  const [dirtyTags, setDirtyTags] = useState<Set<string>>(new Set());
  const [dirtyLocations, setDirtyLocations] = useState<Set<string>>(new Set());
  const markStayDirty = (id: string) => setDirtyStays((s) => { const n = new Set(s); n.add(id); return n; });
  const clearStayDirty = (id: string) => setDirtyStays((s) => { const n = new Set(s); n.delete(id); return n; });
  const markTagDirty = (id: string) => setDirtyTags((s) => { const n = new Set(s); n.add(id); return n; });
  const clearTagDirty = (id: string) => setDirtyTags((s) => { const n = new Set(s); n.delete(id); return n; });
  const markLocDirty = (id: string) => setDirtyLocations((s) => { const n = new Set(s); n.add(id); return n; });
  const clearLocDirty = (id: string) => setDirtyLocations((s) => { const n = new Set(s); n.delete(id); return n; });
  const anyDirty = dirty || dirtyStays.size > 0 || dirtyTags.size > 0 || dirtyLocations.size > 0;


  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(user.id);

      const [prof, sum, mc, hs, oh, rl] = await Promise.all([
        supabase.from("profiles").select("biological_sex").eq("user_id", user.id).maybeSingle(),
        supabase.from("medical_conditions_summary").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("medical_conditions").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("hospital_stays").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("obstetric_history").select("*").eq("user_id", user.id).maybeSingle(),
        (supabase as any).from("record_locations").select("*").eq("user_id", user.id).order("created_at"),
      ]);


      setBiologicalSex(((prof.data as any)?.biological_sex ?? null));
      if (sum.data) setNothing(sum.data.nothing_to_report ?? false);
      if (mc.data) {
        const rows = mc.data as any[];
        setCurrent(rows.filter((r) => !r.is_resolved).map((r) => ({
          id: r.id, condition_name: r.condition_name, year: r.year ?? "", icd11_code: r.icd11_code ?? null, persisted: true,
        })));
        setPast(rows.filter((r) => r.is_resolved).map((r) => ({
          id: r.id, condition_name: r.condition_name, year: r.year ?? "", icd11_code: r.icd11_code ?? null, persisted: true,
        })));
      }
      if (hs.data) {
        setStays(hs.data.map((r: any) => ({
          id: r.id,
          event: r.event ?? "",
          diagnosis: r.diagnosis ?? "",
          year: r.year ?? "",
          institution: r.institution ?? "",
          city: r.city ?? "",
          country: r.country ?? r.hospital_country ?? "",
          record_type: r.record_type ?? "",
          notes: r.notes ?? "",
          collapsed: true,
          persisted: true,
        })));
      }

      if (oh.data) {
        setObNA(oh.data.not_applicable ?? false);
        setGaveBirth(oh.data.gave_birth);
        setNumChildren(oh.data.num_children != null ? String(oh.data.num_children) : "");
        setObComplications(oh.data.complications ?? "");
        setAssisted(oh.data.assisted_reproduction);
        setAssistedNotes(oh.data.notes ?? "");
      }
      if (rl.data) {
        setLocations((rl.data as any[]).map((r) => ({
          id: r.id,
          institution: r.institution ?? "",
          city: r.city ?? "",
          country: r.country ?? "",
          years: r.years ?? "",
          record_type: r.record_type ?? "",
          collapsed: true,
          persisted: true,
        })));
      }
      setLoading(false);
    })();
  }, [navigate]);


  // Reactive biological_sex via realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`profile-sex-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${userId}` },
        (payload) => {
          const next = (payload.new as any)?.biological_sex ?? null;
          setBiologicalSex(next);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const audit = (table: string, action: string) => {
    if (!userId) return;
    supabase.from("audit_log").insert({ user_id: userId, table_name: table, action });
  };

  // -------- Conditions tag input helpers --------
  const syncConditionEntry = async (tag: ConditionTag, list: "current" | "past") => {
    if (!userId) return;
    const sourceKind = list === "current" ? "condition_current" : "condition_past";
    await upsertPassportEntry({
      userId,
      sourceKind,
      sourceId: tag.id,
      title: titleForCondition(list, tag.condition_name, tag.icd11_code, tag.year || null),
      body: tag.icd11_code ? `ICD-11: ${tag.icd11_code}` : null,
      eventYear: tag.year || null,
    });
  };

  const addTag = async (
    list: "current" | "past",
    condition_name: string,
    icd11_code: string | null = null,
  ) => {
    if (!userId) return;
    const name = condition_name.trim();
    if (!name) return;
    const is_resolved = list === "past";
    const { data, error } = await supabase
      .from("medical_conditions")
      .insert({ user_id: userId, condition_name: name, year: null, is_resolved, icd11_code } as any)
      .select()
      .single();
    if (error) { toast.error(t("saveError")); return; }
    const tag: ConditionTag = { id: data.id, condition_name: name, year: "", icd11_code, persisted: true };
    if (list === "current") setCurrent((c) => [...c, tag]);
    else setPast((c) => [...c, tag]);
    audit("medical_conditions", "insert");
    await syncConditionEntry(tag, list);
  };

  const removeTag = async (list: "current" | "past", id: string) => {
    await supabase.from("medical_conditions").delete().eq("id", id);
    audit("medical_conditions", "delete");
    if (userId) {
      await deletePassportEntry(userId, list === "current" ? "condition_current" : "condition_past", id);
    }
    if (list === "current") setCurrent((c) => c.filter((x) => x.id !== id));
    else setPast((c) => c.filter((x) => x.id !== id));
    clearTagDirty(id);
  };

  const updateTagYear = (list: "current" | "past", id: string, year: string) => {
    if (list === "current") setCurrent((c) => c.map((x) => x.id === id ? { ...x, year } : x));
    else setPast((c) => c.map((x) => x.id === id ? { ...x, year } : x));
    markTagDirty(id);
  };

  const saveTagYear = async (id: string, year: string) => {
    await supabase.from("medical_conditions").update({ year: year || null }).eq("id", id);
    audit("medical_conditions", "update");
    const inCurrent = current.find((c) => c.id === id);
    const inPast = past.find((c) => c.id === id);
    if (inCurrent) await syncConditionEntry({ ...inCurrent, year }, "current");
    else if (inPast) await syncConditionEntry({ ...inPast, year }, "past");
    clearTagDirty(id);
  };

  // -------- Hospital stays --------
  const addStay = () => {
    const id = crypto.randomUUID();
    setStays((s) => [
      ...s,
      { id, event: "", diagnosis: "", year: "", institution: "", city: "", country: "", record_type: "", notes: "", collapsed: false, persisted: false },
    ]);
    markStayDirty(id);
  };

  const updateStay = (id: string, patch: Partial<Stay>, dirty = true) => {
    setStays((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (dirty) markStayDirty(id);
  };

  const saveStay = async (stay: Stay) => {
    if (!userId) return;
    const payload: any = {
      event: stay.event,
      diagnosis: stay.diagnosis,
      year: stay.year,
      institution: stay.institution,
      city: stay.city,
      country: stay.country,
      record_type: stay.record_type,
      notes: stay.notes,
    };
    let stayId = stay.id;
    if (stay.persisted) {
      await supabase.from("hospital_stays").update(payload).eq("id", stay.id);
      audit("hospital_stays", "update");
      updateStay(stay.id, { collapsed: true }, false);
    } else {
      const { data } = await supabase
        .from("hospital_stays")
        .insert({ user_id: userId, ...payload })
        .select()
        .single();
      audit("hospital_stays", "insert");
      if (data) {
        stayId = data.id;
        updateStay(stay.id, { id: data.id, persisted: true, collapsed: true }, false);
      }
    }
    // Mirror into Records feed
    const title = titleForStay(stay);
    if (title.trim()) {
      await upsertPassportEntry({
        userId,
        sourceKind: "hospital_stay",
        sourceId: stayId,
        title,
        body: stay.notes || null,
        eventYear: firstYear(stay.year),
      });
    }
    clearStayDirty(stay.id);
  };

  const discardStay = async (stay: Stay) => {
    if (!stay.persisted) {
      setStays((s) => s.filter((x) => x.id !== stay.id));
      clearStayDirty(stay.id);
      return;
    }
    const { data } = await supabase.from("hospital_stays").select("*").eq("id", stay.id).maybeSingle();
    if (data) {
      const r = data as any;
      updateStay(stay.id, {
        event: r.event ?? "",
        diagnosis: r.diagnosis ?? "",
        year: r.year ?? "",
        institution: r.institution ?? "",
        city: r.city ?? "",
        country: r.country ?? r.hospital_country ?? "",
        record_type: r.record_type ?? "",
        notes: r.notes ?? "",
        collapsed: true,
      }, false);
    }
    clearStayDirty(stay.id);
  };


  const deleteStay = async (stay: Stay) => {
    if (stay.persisted) {
      await supabase.from("hospital_stays").delete().eq("id", stay.id);
      audit("hospital_stays", "delete");
      if (userId) await deletePassportEntry(userId, "hospital_stay", stay.id);
    }
    setStays((s) => s.filter((x) => x.id !== stay.id));
    clearStayDirty(stay.id);
  };

  // -------- Record locations --------
  const sbAny = supabase as any;

  const addLocation = () => {
    const id = crypto.randomUUID();
    setLocations((arr) => [
      ...arr,
      { id, institution: "", city: "", country: "", years: "", record_type: "", collapsed: false, persisted: false },
    ]);
    markLocDirty(id);
  };

  const updateLocation = (id: string, patch: Partial<RecordLocation>, dirtyFlag = true) => {
    setLocations((arr) => arr.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (dirtyFlag) markLocDirty(id);
  };

  const saveLocation = async (loc: RecordLocation) => {
    if (!userId) return;
    const payload = {
      institution: loc.institution,
      city: loc.city || null,
      country: loc.country || null,
      years: loc.years || null,
      record_type: loc.record_type || null,
    };
    if (loc.persisted) {
      await sbAny.from("record_locations").update(payload).eq("id", loc.id);
      audit("record_locations", "update");
      updateLocation(loc.id, { collapsed: true }, false);
    } else {
      const { data } = await sbAny
        .from("record_locations")
        .insert({ user_id: userId, ...payload })
        .select()
        .single();
      audit("record_locations", "insert");
      if (data) updateLocation(loc.id, { id: data.id, persisted: true, collapsed: true }, false);
    }
    clearLocDirty(loc.id);
  };

  const discardLocation = async (loc: RecordLocation) => {
    if (!loc.persisted) {
      setLocations((arr) => arr.filter((x) => x.id !== loc.id));
      clearLocDirty(loc.id);
      return;
    }
    const { data } = await sbAny.from("record_locations").select("*").eq("id", loc.id).maybeSingle();
    if (data) {
      updateLocation(loc.id, {
        institution: data.institution ?? "",
        city: data.city ?? "",
        country: data.country ?? "",
        years: data.years ?? "",
        record_type: data.record_type ?? "",
        collapsed: true,
      }, false);
    }
    clearLocDirty(loc.id);
  };

  const deleteLocation = async (loc: RecordLocation) => {
    if (loc.persisted) {
      await sbAny.from("record_locations").delete().eq("id", loc.id);
      audit("record_locations", "delete");
    }
    setLocations((arr) => arr.filter((x) => x.id !== loc.id));
    clearLocDirty(loc.id);
  };


  // Visibility for obstetric section
  const sex = (biologicalSex ?? "").toLowerCase();
  const showObstetric = sex !== "male";
  const obstetricHeading = sex === "other" ? t("s4_optional") : t("s4");
  const showNA = sex !== "female"; // hide checkbox for female; show for other / null / unknown
  // For female, never treat as N/A
  const effectiveNA = showNA ? obNA : false;

  const saveAll = async () => {
    if (!userId) return false;
    try {
      // Save dirty tag years
      for (const tag of [...current, ...past]) {
        if (dirtyTags.has(tag.id)) {
          await supabase.from("medical_conditions").update({ year: tag.year || null }).eq("id", tag.id);
        }
      }
      // Save any open dirty stay cards
      for (const stay of stays) {
        if (dirtyStays.has(stay.id)) {
          await saveStay(stay);
        }
      }
      // Save any open dirty location cards
      for (const loc of locations) {
        if (dirtyLocations.has(loc.id) && loc.institution.trim()) {
          await saveLocation(loc);
        }
      }

      await Promise.all([
        supabase
          .from("medical_conditions_summary")
          .upsert(
            { user_id: userId, nothing_to_report: nothing },
            { onConflict: "user_id" },
          ),
        showObstetric
          ? supabase.from("obstetric_history").upsert(
              {
                user_id: userId,
                not_applicable: effectiveNA,
                gave_birth: effectiveNA ? null : gaveBirth,
                num_children: effectiveNA || !gaveBirth || !numChildren ? null : parseInt(numChildren, 10),
                complications: effectiveNA ? null : obComplications,
                assisted_reproduction: effectiveNA ? null : assisted,
                notes: effectiveNA ? null : assistedNotes,
              },
              { onConflict: "user_id" },
            )
          : Promise.resolve(),
      ]);
      audit("medical_history", "save_all");
      setDirty(false);
      setDirtyStays(new Set());
      setDirtyTags(new Set());
      setDirtyLocations(new Set());

      toast.success(t("saved"));
      return true;
    } catch {
      toast.error(t("saveError"));
      return false;
    }
  };

  const bypassGuardRef = useRef(false);
  const handleSaveAndExit = async () => {
    bypassGuardRef.current = true;
    const ok = await saveAll();
    if (ok) navigate({ to: "/passport" });
    else bypassGuardRef.current = false;
  };

  const resolver = useLeaveGuard(() => anyDirty && !bypassGuardRef.current);

  if (loading) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white pb-28 text-[#0D1B2A]">
      <header
        className="px-5 pt-6 pb-7"
        style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_2} 100%)` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">🏥</span>
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

      <div className="space-y-5 px-5 pt-5">
        <div className="flex items-center justify-between rounded-2xl bg-[#F8F9FA] p-4">
          <span className="text-sm font-medium text-[#0D1B2A]">{t("nothing")}</span>
          <Switch
            checked={nothing}
            onCheckedChange={(v) => {
              setNothing(v);
              setDirty(true);
              if (userId) {
                supabase
                  .from("medical_conditions_summary")
                  .upsert(
                    { user_id: userId, nothing_to_report: v },
                    { onConflict: "user_id" },
                  )
                  .then(() => audit("medical_conditions_summary", "toggle_nothing"));
              }
            }}
          />
        </div>

        {!nothing && (
          <>
            <section>
              <h2 className="mb-2 text-sm font-bold text-[#0D1B2A]">{t("s1")}</h2>
              <ConditionTagInput
                tags={current}
                lang={lang}
                onAdd={(name, code) => addTag("current", name, code)}
                onRemove={(id) => removeTag("current", id)}
                onYearChange={(id, y) => updateTagYear("current", id, y)}
                onYearBlur={(id, y) => saveTagYear(id, y)}
                searchPlaceholder={t("s1ph")}
                yearPlaceholder={t("s1_year_ph")}
                noMatchHint={t("no_match")}
                addLabel={t("add")}
              />
            </section>

            <section>
              <h2 className="mb-2 text-sm font-bold text-[#0D1B2A]">{t("s2")}</h2>
              <p className="mb-3 text-xs text-gray-600">
                Enter the locations where your health records are held around the world. We will notify you when automated retrieval becomes operational in your region — and retrieve them on your behalf.
              </p>
              <div className="space-y-3">
                {locations.map((loc) =>
                  loc.collapsed ? (
                    <div key={loc.id} className="flex items-center justify-between rounded-xl bg-[#F8F9FA] px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[#0D1B2A]">{loc.institution}</div>
                        <div className="truncate text-xs text-gray-600">
                          {[loc.city, loc.country, loc.years].filter(Boolean).join(" · ")}
                          {loc.record_type ? ` — ${loc.record_type}` : ""}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" aria-label="Edit" onClick={() => updateLocation(loc.id, { collapsed: false })} className="rounded-md p-1.5 text-gray-600 hover:bg-gray-200">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label="Delete" onClick={() => deleteLocation(loc)} className="rounded-md p-1.5 text-red-500 hover:bg-gray-200">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={loc.id} className="space-y-2 rounded-xl bg-[#F8F9FA] p-4">
                      <Field label="Institution / Hospital name" value={loc.institution} ph="E.g. Karolinska University Hospital" onChange={(v) => updateLocation(loc.id, { institution: v })} />
                      <Field label="City" value={loc.city} ph="E.g. Stockholm" onChange={(v) => updateLocation(loc.id, { city: v })} />
                      <Field label="Country" value={loc.country} ph="E.g. Sweden" onChange={(v) => updateLocation(loc.id, { country: v })} />
                      <Field label="Approximate year(s)" value={loc.years} ph="E.g. 2018–2022" onChange={(v) => updateLocation(loc.id, { years: v })} />
                      <div>
                        <label className="block text-xs text-gray-600">Record type</label>
                        <select
                          value={loc.record_type}
                          onChange={(e) => updateLocation(loc.id, { record_type: e.target.value })}
                          className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0D1B2A] focus:border-[#5B6BD4] focus:outline-none"
                        >
                          <option value="">Select…</option>
                          {RECORD_TYPES.map((rt) => (
                            <option key={rt} value={rt}>{rt}</option>
                          ))}
                        </select>
                      </div>
                      {dirtyLocations.has(loc.id) && (
                        <CardUnsavedBanner onSave={() => saveLocation(loc)} onDiscard={() => discardLocation(loc)} />
                      )}
                      <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => deleteLocation(loc)} className="rounded-md p-2 text-red-500 hover:bg-gray-200" aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => saveLocation(loc)}
                          disabled={!loc.institution.trim()}
                          className="rounded-md bg-[#5B6BD4] px-4 py-2 text-xs font-medium text-white hover:bg-[#4B5BC4] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {t("save_stay")}
                        </button>
                      </div>
                    </div>
                  ),
                )}

                {stays.map((stay) =>
                  stay.collapsed ? (
                    <div
                      key={stay.id}
                      className="flex items-center justify-between rounded-xl bg-[#F8F9FA] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[#0D1B2A]">
                          {[stay.event, stay.year].filter(Boolean).join(" · ") || stay.institution || "—"}
                        </div>
                        <div className="truncate text-xs text-gray-600">
                          {[stay.institution, stay.city, stay.country].filter(Boolean).join(" · ")}
                          {stay.record_type ? ` — ${stay.record_type}` : ""}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" aria-label="Edit" onClick={() => updateStay(stay.id, { collapsed: false })} className="rounded-md p-1.5 text-gray-600 hover:bg-gray-200">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label="Delete" onClick={() => deleteStay(stay)} className="rounded-md p-1.5 text-red-500 hover:bg-gray-200">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={stay.id} className="space-y-2 rounded-xl bg-[#F8F9FA] p-4">
                      <Field label={t("f_event")} value={stay.event} ph="E.g. Appendectomy, outpatient consultation" onChange={(v) => updateStay(stay.id, { event: v })} />
                      <Field label={t("f_diagnosis")} value={stay.diagnosis} ph={t("f_diagnosis_ph")} onChange={(v) => updateStay(stay.id, { diagnosis: v })} />
                      <Field label={t("f_year")} value={stay.year} ph="E.g. 2019 or 2018–2022" onChange={(v) => updateStay(stay.id, { year: v })} />
                      <Field label="Institution / Hospital name" value={stay.institution} ph="E.g. Karolinska University Hospital" onChange={(v) => updateStay(stay.id, { institution: v })} />
                      <Field label="City" value={stay.city} ph="E.g. Stockholm" onChange={(v) => updateStay(stay.id, { city: v })} />
                      <Field label="Country" value={stay.country} ph="E.g. Sweden" onChange={(v) => updateStay(stay.id, { country: v })} />
                      <div>
                        <label className="block text-xs text-gray-600">Record type</label>
                        <select
                          value={stay.record_type}
                          onChange={(e) => updateStay(stay.id, { record_type: e.target.value })}
                          className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0D1B2A] focus:border-[#5B6BD4] focus:outline-none"
                        >
                          <option value="">Select…</option>
                          {RECORD_TYPES.map((rt) => (
                            <option key={rt} value={rt}>{rt}</option>
                          ))}
                        </select>
                      </div>
                      <Field label={t("f_notes")} value={stay.notes} ph={t("f_notes_ph")} onChange={(v) => updateStay(stay.id, { notes: v })} />
                      {dirtyStays.has(stay.id) && (
                        <CardUnsavedBanner onSave={() => saveStay(stay)} onDiscard={() => discardStay(stay)} />
                      )}
                      <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => deleteStay(stay)} className="rounded-md p-2 text-red-500 hover:bg-gray-200" aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => saveStay(stay)} className="rounded-md bg-[#5B6BD4] px-4 py-2 text-xs font-medium text-white hover:bg-[#4B5BC4]">
                          {t("save_stay")}
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <button
                type="button"
                onClick={addStay}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E5E7EB] px-4 py-3 text-sm text-gray-600 hover:bg-[#F8F9FA]"
              >
                <Plus className="h-4 w-4" />
                Add clinical contact, hospitalisation or record location
              </button>

              <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#E5E7EB] bg-[#FFF8E1] p-3 text-xs text-[#0D1B2A]">
                <span className="text-base leading-none">📎</span>
                <p>
                  We will notify you when this feature becomes operational in your area. In the meantime, you can manually upload records, scans and images under{" "}
                  <Link to="/records" className="font-semibold text-[#5B6BD4] underline">
                    Records
                  </Link>{" "}
                  in GlobeDoc.
                </p>
              </div>
            </section>




            <section>
              <h2 className="mb-2 text-sm font-bold text-[#0D1B2A]">{t("s3")}</h2>
              <ConditionTagInput
                tags={past}
                lang={lang}
                onAdd={(name, code) => addTag("past", name, code)}
                onRemove={(id) => removeTag("past", id)}
                onYearChange={(id, y) => updateTagYear("past", id, y)}
                onYearBlur={(id, y) => saveTagYear(id, y)}
                searchPlaceholder={t("s3ph")}
                yearPlaceholder={t("s3_year_ph")}
                noMatchHint={t("no_match")}
                addLabel={t("add")}
              />
            </section>

            {showObstetric && (
              <section>
                <h2 className="mb-2 text-sm font-bold text-[#0D1B2A]">{obstetricHeading}</h2>
                <div className="space-y-3 rounded-xl bg-[#F8F9FA] p-4">
                  {showNA && (
                    <label className="flex items-center gap-2 text-sm text-[#0D1B2A]">
                      <Checkbox checked={obNA} onCheckedChange={(v) => { setObNA(v === true); setDirty(true); }} />
                      {t("na")}
                    </label>
                  )}

                  {!effectiveNA && (
                    <>
                      <YesNo label={t("gave_birth")} value={gaveBirth} onChange={(v) => { setGaveBirth(v); setDirty(true); }} yes={t("yes")} no={t("no")} />
                      {gaveBirth && (
                        <div>
                          <label className="block text-xs text-gray-600">{t("num_children")}</label>
                          <input
                            type="number"
                            min={0}
                            value={numChildren}
                            onChange={(e) => { setNumChildren(e.target.value); setDirty(true); }}
                            className="mt-1 w-32 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0D1B2A] focus:border-[#5B6BD4] focus:outline-none"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-600">{t("complications")}</label>
                        <textarea
                          value={obComplications}
                          onChange={(e) => { setObComplications(e.target.value); setDirty(true); }}
                          placeholder={t("complications_ph")}
                          rows={3}
                          className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white p-2 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#5B6BD4] focus:outline-none"
                        />
                      </div>
                      <YesNo label={t("assisted")} value={assisted} onChange={(v) => { setAssisted(v); setDirty(true); }} yes={t("yes")} no={t("no")} />
                      {assisted && (
                        <textarea
                          value={assistedNotes}
                          onChange={(e) => { setAssistedNotes(e.target.value); setDirty(true); }}
                          placeholder={t("describe")}
                          rows={3}
                          className="w-full rounded-md border border-[#E5E7EB] bg-white p-2 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#5B6BD4] focus:outline-none"
                        />
                      )}
                    </>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E5E7EB] bg-white p-4">
        <button
          type="button"
          onClick={handleSaveAndExit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5B6BD4] to-[#7B8BE4] px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
        >
          <Check className="h-4 w-4" />
          {t("save")}
        </button>
      </div>
      <LeaveDialog resolver={resolver} onSaveAndLeave={saveAll} />
    </div>
  );
}

function ConditionTagInput({
  tags, lang, onAdd, onRemove, onYearChange, onYearBlur,
  searchPlaceholder, yearPlaceholder, noMatchHint, addLabel,
}: {
  tags: ConditionTag[];
  lang: Lang;
  onAdd: (name: string, icd11_code: string | null) => void;
  onRemove: (id: string) => void;
  onYearChange: (id: string, y: string) => void;
  onYearBlur: (id: string, y: string) => void;
  searchPlaceholder: string;
  yearPlaceholder: string;
  noMatchHint: string;
  addLabel: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseQ, setBrowseQ] = useState("");
  const [commonOpen, setCommonOpen] = useState(false);
  const [icdResults, setIcdResults] = useState<Icd11Match[]>([]);
  const [icdLoading, setIcdLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const used = useMemo(() => new Set(tags.map((t) => t.condition_name.toLowerCase())), [tags]);

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return SUGGESTIONS
      .filter((s) => s.toLowerCase().includes(term) && !used.has(s.toLowerCase()))
      .slice(0, 10);
  }, [q, used]);

  // Debounced ICD-11 search at 3+ chars
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) { setIcdResults([]); setIcdLoading(false); return; }
    const ctrl = new AbortController();
    setIcdLoading(true);
    const handle = setTimeout(async () => {
      const res = await searchIcd11(term, lang, ctrl.signal);
      setIcdResults(res.filter((r) => !used.has(r.title.toLowerCase())));
      setIcdLoading(false);
    }, 300);
    return () => { clearTimeout(handle); ctrl.abort(); };
  }, [q, lang, used]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const commit = (name: string, code: string | null = null) => {
    const v = name.trim();
    if (!v) return;
    if (used.has(v.toLowerCase())) { setQ(""); return; }
    onAdd(v, code);
    setQ("");
    setOpen(false);
  };

  const infoNote =
    lang === "sv"
      ? "Tillstånd kan sökas på något av de 43 språk som stöds av WHO:s ICD-11-klassificering, inklusive engelska, arabiska, kinesiska, franska, ryska, spanska, svenska, tyska, japanska, hindi, portugisiska, turkiska, koreanska och fler. Skriv på ditt föredragna språk så visas matchande diagnoser med sin ICD-11-kod. ICD-11 är Världshälsoorganisationens globala standard för sjukdomsklassificering och används i hälsojournaler världen över."
      : "Conditions can be searched in any of the 43 languages supported by the WHO ICD-11 classification, including English, Arabic, Chinese, French, Russian, Spanish, Swedish, German, Japanese, Hindi, Portuguese, Turkish, Korean and more. Type in your preferred language and matching diagnoses will appear with their ICD-11 code. ICD-11 is the World Health Organization's global standard for disease classification, used in health records worldwide.";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-2 rounded-full bg-[#EEF0FB] py-1 pl-3 pr-1 text-sm text-[#0D1B2A]"
          >
            <span className="font-medium">{tag.condition_name}</span>
            {tag.icd11_code && (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                {tag.icd11_code}
              </span>
            )}
            <input
              type="number"
              value={tag.year}
              onChange={(e) => onYearChange(tag.id, e.target.value)}
              onBlur={(e) => onYearBlur(tag.id, e.target.value)}
              placeholder={yearPlaceholder}
              className="w-36 rounded-full border border-transparent bg-white/70 px-2 py-0.5 text-xs text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#5B6BD4] focus:outline-none"
            />
            <button
              type="button"
              aria-label="Remove"
              onClick={() => onRemove(tag.id)}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-white hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div ref={wrapRef} className="relative">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (matches.length > 0 && q.trim() && matches[0].toLowerCase().startsWith(q.trim().toLowerCase())) {
                commit(matches[0]);
              } else {
                commit(q);
              }
            }
          }}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#5B6BD4] focus:outline-none"
        />
        {open && q.trim() && (
          <div className="absolute z-10 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
            {matches.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => commit(m)}
                className="block w-full px-3 py-2 text-left text-sm text-[#0D1B2A] hover:bg-[#F8F9FA]"
              >
                {m}
              </button>
            ))}

            {q.trim().length >= 3 && (icdLoading || icdResults.length > 0) && (
              <>
                <div className="border-t border-[#E5E7EB] bg-[#F8F9FA] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  ICD-11 — WHO Global Disease Classification
                </div>
                {icdLoading && icdResults.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
                )}
                {icdResults.map((r) => (
                  <button
                    key={`${r.code}-${r.title}`}
                    type="button"
                    onClick={() => commit(r.title, r.code)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-[#0D1B2A] hover:bg-[#F8F9FA]"
                  >
                    <span className="truncate">{r.title}</span>
                    <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      {r.code}
                    </span>
                  </button>
                ))}
              </>
            )}

            {!SUGGESTIONS.some((s) => s.toLowerCase() === q.trim().toLowerCase()) &&
              !icdResults.some((r) => r.title.toLowerCase() === q.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => commit(q)}
                className="block w-full border-t border-[#E5E7EB] px-3 py-2 text-left text-sm text-[#5B6BD4] hover:bg-[#F8F9FA]"
              >
                + {addLabel} “{q.trim()}” — {noMatchHint}
              </button>
            )}
          </div>
        )}
      </div>

      <p className="pt-1 text-[11px] leading-snug text-gray-500">{infoNote}</p>

      <div className="flex flex-col gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => setCommonOpen(true)}
          className="self-start text-xs font-medium text-[#5B6BD4] hover:underline"
        >
          Browse most common conditions →
        </button>
        <button
          type="button"
          onClick={() => { setBrowseQ(""); setBrowseOpen(true); }}
          className="self-start text-xs font-medium text-[#5B6BD4] hover:underline"
        >
          Browse by speciality →
        </button>
      </div>

      <Sheet open={commonOpen} onOpenChange={setCommonOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Most common conditions</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-wrap gap-1.5 pb-8">
            {TOP_CONDITIONS.map((c) => {
              const isUsed = used.has(c.toLowerCase());
              return (
                <button
                  key={c}
                  type="button"
                  disabled={isUsed}
                  onClick={() => commit(c)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    isUsed
                      ? "cursor-not-allowed border-[#E5E7EB] bg-[#F1F2F6] text-gray-400"
                      : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:border-[#5B6BD4] hover:bg-[#EEF0FB]"
                  }`}
                >
                  {isUsed ? `✓ ${c}` : c}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>


      <Sheet open={browseOpen} onOpenChange={setBrowseOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Browse by speciality</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <input
              value={browseQ}
              onChange={(e) => setBrowseQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#5B6BD4] focus:outline-none"
            />
          </div>
          <div className="mt-4 space-y-5 pb-8">
            {CONDITION_GROUPS.map((group) => {
              const term = browseQ.trim().toLowerCase();
              const items = term
                ? group.items.filter((i) => i.toLowerCase().includes(term))
                : group.items;
              if (items.length === 0) return null;
              return (
                <div key={group.specialty}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                    {group.specialty}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((c) => {
                      const isUsed = used.has(c.toLowerCase());
                      return (
                        <button
                          key={`${group.specialty}-${c}`}
                          type="button"
                          disabled={isUsed}
                          onClick={() => commit(c)}
                          className={`rounded-full border px-3 py-1 text-xs ${
                            isUsed
                              ? "cursor-not-allowed border-[#E5E7EB] bg-[#F1F2F6] text-gray-400"
                              : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:border-[#5B6BD4] hover:bg-[#EEF0FB]"
                          }`}
                        >
                          {isUsed ? `✓ ${c}` : c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
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
        className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#5B6BD4] focus:outline-none"
      />
    </div>
  );
}

function YesNo({ label, value, onChange, yes, no }: { label: string; value: boolean | null; onChange: (v: boolean) => void; yes: string; no: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-600">{label}</label>
      <div className="mt-1 inline-flex overflow-hidden rounded-md border border-[#E5E7EB]">
        <button type="button" onClick={() => onChange(true)} className={`px-4 py-1.5 text-xs ${value === true ? "bg-[#5B6BD4] text-white" : "text-gray-700 hover:bg-[#F8F9FA]"}`}>{yes}</button>
        <button type="button" onClick={() => onChange(false)} className={`px-4 py-1.5 text-xs ${value === false ? "bg-[#5B6BD4] text-white" : "text-gray-700 hover:bg-[#F8F9FA]"}`}>{no}</button>
      </div>
    </div>
  );
}
