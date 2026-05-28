import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X, Pencil, Trash2, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLeaveGuard, LeaveDialog, CardUnsavedBanner } from "./unsaved";

type Stay = {
  id: string;
  event: string;
  year: string;
  hospital_country: string;
  notes: string;
  collapsed: boolean;
  persisted: boolean;
};

type ConditionTag = {
  id: string;
  condition_name: string;
  year: string;
  persisted: boolean;
};

const SUGGESTIONS = [
  "Type 1 diabetes", "Type 2 diabetes", "Hypertension", "Asthma", "COPD",
  "Coronary artery disease", "Heart failure", "Atrial fibrillation", "Stroke",
  "Epilepsy", "Multiple sclerosis", "Parkinson's disease", "Alzheimer's / dementia",
  "Rheumatoid arthritis", "Osteoarthritis", "Osteoporosis", "Crohn's disease",
  "Ulcerative colitis", "Irritable bowel syndrome", "Coeliac disease",
  "Hypothyroidism", "Hyperthyroidism", "Chronic kidney disease", "Liver cirrhosis",
  "HIV", "Hepatitis B", "Hepatitis C", "Cancer (specify type)", "Depression",
  "Anxiety disorder", "Bipolar disorder", "PTSD", "ADHD", "Autism spectrum disorder",
  "Lupus", "Fibromyalgia", "Chronic fatigue syndrome", "Sleep apnoea", "Migraine",
  "Psoriasis", "Eczema", "Endometriosis", "PCOS",
];

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: "Medical History",
    subtitle: "Diagnoses, hospitalisations & operations",
    nothing: "Nothing to report",
    s1: "Current & chronic conditions",
    s1ph: "Search or type a condition…",
    s1_year_ph: "Year diagnosed, e.g. 2018",
    s2: "Hospital stays & operations",
    f_event: "Event / procedure",
    f_event_ph: "E.g. Appendectomy",
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
    subtitle: "Diagnoser, sjukhusvistelser & operationer",
    nothing: "Inget att rapportera",
    s1: "Pågående & kroniska tillstånd",
    s1ph: "Sök eller skriv ett tillstånd…",
    s1_year_ph: "År för diagnos, t.ex. 2018",
    s2: "Sjukhusvistelser & operationer",
    f_event: "Händelse / ingrepp",
    f_event_ph: "T.ex. Blindtarmsoperation",
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
  const markStayDirty = (id: string) => setDirtyStays((s) => { const n = new Set(s); n.add(id); return n; });
  const clearStayDirty = (id: string) => setDirtyStays((s) => { const n = new Set(s); n.delete(id); return n; });
  const markTagDirty = (id: string) => setDirtyTags((s) => { const n = new Set(s); n.add(id); return n; });
  const clearTagDirty = (id: string) => setDirtyTags((s) => { const n = new Set(s); n.delete(id); return n; });
  const anyDirty = dirty || dirtyStays.size > 0 || dirtyTags.size > 0;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(user.id);

      const [prof, sum, mc, hs, oh] = await Promise.all([
        supabase.from("profiles").select("biological_sex").eq("user_id", user.id).maybeSingle(),
        supabase.from("medical_conditions_summary").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("medical_conditions").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("hospital_stays").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("obstetric_history").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      setBiologicalSex(((prof.data as any)?.biological_sex ?? null));
      if (sum.data) setNothing(sum.data.nothing_to_report ?? false);
      if (mc.data) {
        const rows = mc.data as any[];
        setCurrent(rows.filter((r) => !r.is_resolved).map((r) => ({
          id: r.id, condition_name: r.condition_name, year: r.year ?? "", persisted: true,
        })));
        setPast(rows.filter((r) => r.is_resolved).map((r) => ({
          id: r.id, condition_name: r.condition_name, year: r.year ?? "", persisted: true,
        })));
      }
      if (hs.data) {
        setStays(hs.data.map((r: any) => ({
          id: r.id,
          event: r.event ?? "",
          year: r.year ?? "",
          hospital_country: r.hospital_country ?? "",
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
  const addTag = async (
    list: "current" | "past",
    condition_name: string,
  ) => {
    if (!userId) return;
    const name = condition_name.trim();
    if (!name) return;
    const is_resolved = list === "past";
    const { data, error } = await supabase
      .from("medical_conditions")
      .insert({ user_id: userId, condition_name: name, year: null, is_resolved })
      .select()
      .single();
    if (error) { toast.error(t("saveError")); return; }
    const tag: ConditionTag = { id: data.id, condition_name: name, year: "", persisted: true };
    if (list === "current") setCurrent((c) => [...c, tag]);
    else setPast((c) => [...c, tag]);
    audit("medical_conditions", "insert");
  };

  const removeTag = async (list: "current" | "past", id: string) => {
    await supabase.from("medical_conditions").delete().eq("id", id);
    audit("medical_conditions", "delete");
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
    clearTagDirty(id);
  };

  // -------- Hospital stays --------
  const addStay = () => {
    const id = crypto.randomUUID();
    setStays((s) => [
      ...s,
      { id, event: "", year: "", hospital_country: "", notes: "", collapsed: false, persisted: false },
    ]);
    markStayDirty(id);
  };

  const updateStay = (id: string, patch: Partial<Stay>, dirty = true) => {
    setStays((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (dirty) markStayDirty(id);
  };

  const saveStay = async (stay: Stay) => {
    if (!userId) return;
    if (stay.persisted) {
      await supabase
        .from("hospital_stays")
        .update({ event: stay.event, year: stay.year, hospital_country: stay.hospital_country, notes: stay.notes })
        .eq("id", stay.id);
      audit("hospital_stays", "update");
      updateStay(stay.id, { collapsed: true }, false);
    } else {
      const { data } = await supabase
        .from("hospital_stays")
        .insert({ user_id: userId, event: stay.event, year: stay.year, hospital_country: stay.hospital_country, notes: stay.notes })
        .select()
        .single();
      audit("hospital_stays", "insert");
      if (data) updateStay(stay.id, { id: data.id, persisted: true, collapsed: true }, false);
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
      updateStay(stay.id, {
        event: data.event ?? "",
        year: data.year ?? "",
        hospital_country: data.hospital_country ?? "",
        notes: data.notes ?? "",
        collapsed: true,
      }, false);
    }
    clearStayDirty(stay.id);
  };

  const deleteStay = async (stay: Stay) => {
    if (stay.persisted) {
      await supabase.from("hospital_stays").delete().eq("id", stay.id);
      audit("hospital_stays", "delete");
    }
    setStays((s) => s.filter((x) => x.id !== stay.id));
    clearStayDirty(stay.id);
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
      toast.success(t("saved"));
      return true;
    } catch {
      toast.error(t("saveError"));
      return false;
    }
  };

  const handleSaveAndExit = async () => {
    const ok = await saveAll();
    if (ok) navigate({ to: "/passport" });
  };

  const resolver = useLeaveGuard(anyDirty);

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
                onAdd={(name) => addTag("current", name)}
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
              <div className="space-y-3">
                {stays.map((stay) =>
                  stay.collapsed ? (
                    <div
                      key={stay.id}
                      className="flex items-center justify-between rounded-xl bg-[#F8F9FA] px-4 py-3"
                    >
                      <span className="truncate text-sm text-[#0D1B2A]">
                        {[stay.event, stay.year, stay.hospital_country].filter(Boolean).join(" · ")}
                      </span>
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
                      <Field label={t("f_event")} value={stay.event} ph={t("f_event_ph")} onChange={(v) => updateStay(stay.id, { event: v })} />
                      <Field label={t("f_year")} value={stay.year} ph={t("f_year_ph")} onChange={(v) => updateStay(stay.id, { year: v })} />
                      <Field label={t("f_hosp")} value={stay.hospital_country} ph={t("f_hosp_ph")} onChange={(v) => updateStay(stay.id, { hospital_country: v })} />
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
                {t("add_stay")}
              </button>
            </section>

            <section>
              <h2 className="mb-2 text-sm font-bold text-[#0D1B2A]">{t("s3")}</h2>
              <ConditionTagInput
                tags={past}
                onAdd={(name) => addTag("past", name)}
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
  tags, onAdd, onRemove, onYearChange, onYearBlur,
  searchPlaceholder, yearPlaceholder, noMatchHint, addLabel,
}: {
  tags: ConditionTag[];
  onAdd: (name: string) => void;
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
  const wrapRef = useRef<HTMLDivElement>(null);

  const used = useMemo(() => new Set(tags.map((t) => t.condition_name.toLowerCase())), [tags]);
  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return SUGGESTIONS.filter((s) => !used.has(s.toLowerCase())).slice(0, 8);
    return SUGGESTIONS
      .filter((s) => s.toLowerCase().includes(term) && !used.has(s.toLowerCase()))
      .slice(0, 8);
  }, [q, used]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const commit = (name: string) => {
    const v = name.trim();
    if (!v) return;
    if (used.has(v.toLowerCase())) { setQ(""); return; }
    onAdd(v);
    setQ("");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-2 rounded-full bg-[#EEF0FB] py-1 pl-3 pr-1 text-sm text-[#0D1B2A]"
          >
            <span className="font-medium">{tag.condition_name}</span>
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
        {open && (matches.length > 0 || q.trim()) && (
          <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
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
            {q.trim() && !SUGGESTIONS.some((s) => s.toLowerCase() === q.trim().toLowerCase()) && (
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
