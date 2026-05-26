import { useEffect, useState } from "react";
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

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: "Medical History",
    subtitle: "Diagnoses, hospitalisations & operations",
    nothing: "Nothing to report",
    s1: "Current & chronic conditions",
    s1ph: "E.g. Type 2 diabetes (diagnosed 2018), hypertension, asthma…",
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
    s3ph: "E.g. Appendicitis 2010 — fully recovered. Pneumonia 2015.",
    s4: "Obstetric & reproductive history",
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
  },
  sv: {
    title: "Sjukdomshistorik",
    subtitle: "Diagnoser, sjukhusvistelser & operationer",
    nothing: "Inget att rapportera",
    s1: "Pågående & kroniska tillstånd",
    s1ph: "T.ex. Typ 2-diabetes (diagnostiserad 2018), högt blodtryck, astma…",
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
    s3ph: "T.ex. Blindtarmsinflammation 2010 — helt återhämtad. Lunginflammation 2015.",
    s4: "Obstetrisk & reproduktiv historik",
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
  const [conditions, setConditions] = useState("");
  const [past, setPast] = useState("");
  const [stays, setStays] = useState<Stay[]>([]);

  const [obNA, setObNA] = useState(false);
  const [gaveBirth, setGaveBirth] = useState<boolean | null>(null);
  const [numChildren, setNumChildren] = useState<string>("");
  const [obComplications, setObComplications] = useState("");
  const [assisted, setAssisted] = useState<boolean | null>(null);
  const [assistedNotes, setAssistedNotes] = useState("");

  const [dirty, setDirty] = useState(false);
  const [dirtyStays, setDirtyStays] = useState<Set<string>>(new Set());
  const markStayDirty = (id: string) => setDirtyStays((s) => { const n = new Set(s); n.add(id); return n; });
  const clearStayDirty = (id: string) => setDirtyStays((s) => { const n = new Set(s); n.delete(id); return n; });
  const anyDirty = dirty || dirtyStays.size > 0;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(user.id);

      const [mc, pc, hs, oh] = await Promise.all([
        supabase.from("medical_conditions").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("past_conditions").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("hospital_stays").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("obstetric_history").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (mc.data) {
        setConditions(mc.data.conditions_text ?? "");
        setNothing(mc.data.nothing_to_report ?? false);
      }
      if (pc.data) setPast(pc.data.conditions_text ?? "");
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

  const audit = (table: string, action: string) => {
    if (!userId) return;
    supabase.from("audit_log").insert({ user_id: userId, table_name: table, action });
  };

  const saveConditions = async () => {
    if (!userId) return;
    await supabase
      .from("medical_conditions")
      .upsert(
        { user_id: userId, conditions_text: conditions, nothing_to_report: nothing },
        { onConflict: "user_id" },
      );
    audit("medical_conditions", "upsert");
  };

  const savePast = async () => {
    if (!userId) return;
    await supabase
      .from("past_conditions")
      .upsert({ user_id: userId, conditions_text: past }, { onConflict: "user_id" });
    audit("past_conditions", "upsert");
  };

  const addStay = () => {
    setStays((s) => [
      ...s,
      {
        id: crypto.randomUUID(),
        event: "",
        year: "",
        hospital_country: "",
        notes: "",
        collapsed: false,
        persisted: false,
      },
    ]);
  };

  const updateStay = (id: string, patch: Partial<Stay>) =>
    setStays((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const saveStay = async (stay: Stay) => {
    if (!userId) return;
    if (stay.persisted) {
      await supabase
        .from("hospital_stays")
        .update({
          event: stay.event,
          year: stay.year,
          hospital_country: stay.hospital_country,
          notes: stay.notes,
        })
        .eq("id", stay.id);
      audit("hospital_stays", "update");
    } else {
      const { data } = await supabase
        .from("hospital_stays")
        .insert({
          user_id: userId,
          event: stay.event,
          year: stay.year,
          hospital_country: stay.hospital_country,
          notes: stay.notes,
        })
        .select()
        .single();
      audit("hospital_stays", "insert");
      if (data) updateStay(stay.id, { id: data.id, persisted: true, collapsed: true });
      return;
    }
    updateStay(stay.id, { collapsed: true });
  };

  const deleteStay = async (stay: Stay) => {
    if (stay.persisted) {
      await supabase.from("hospital_stays").delete().eq("id", stay.id);
      audit("hospital_stays", "delete");
    }
    setStays((s) => s.filter((x) => x.id !== stay.id));
  };

  const saveAll = async () => {
    if (!userId) return;
    try {
      await Promise.all([
        supabase
          .from("medical_conditions")
          .upsert(
            { user_id: userId, conditions_text: conditions, nothing_to_report: nothing },
            { onConflict: "user_id" },
          ),
        supabase
          .from("past_conditions")
          .upsert({ user_id: userId, conditions_text: past }, { onConflict: "user_id" }),
        supabase.from("obstetric_history").upsert(
          {
            user_id: userId,
            not_applicable: obNA,
            gave_birth: obNA ? null : gaveBirth,
            num_children: obNA || !gaveBirth || !numChildren ? null : parseInt(numChildren, 10),
            complications: obNA ? null : obComplications,
            assisted_reproduction: obNA ? null : assisted,
            notes: obNA ? null : assistedNotes,
          },
          { onConflict: "user_id" },
        ),
      ]);
      audit("medical_history", "save_all");
      toast.success(t("saved"));
      navigate({ to: "/passport" });
    } catch (e) {
      toast.error(t("saveError"));
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white pb-28 text-[#0D1B2A]">
      {/* Header */}
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
              if (userId) {
                supabase
                  .from("medical_conditions")
                  .upsert(
                    { user_id: userId, conditions_text: conditions, nothing_to_report: v },
                    { onConflict: "user_id" },
                  )
                  .then(() => audit("medical_conditions", "toggle_nothing"));
              }
            }}
          />
        </div>

        {!nothing && (
          <>
            <section>
              <h2 className="mb-2 text-sm font-bold text-[#0D1B2A]">{t("s1")}</h2>
              <textarea
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                onBlur={saveConditions}
                placeholder={t("s1ph")}
                rows={4}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#5B6BD4] focus:outline-none"
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
              <textarea
                value={past}
                onChange={(e) => setPast(e.target.value)}
                onBlur={savePast}
                placeholder={t("s3ph")}
                rows={4}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#5B6BD4] focus:outline-none"
              />
            </section>

            <section>
              <h2 className="mb-2 text-sm font-bold text-[#0D1B2A]">{t("s4")}</h2>
              <div className="space-y-3 rounded-xl bg-[#F8F9FA] p-4">
                <label className="flex items-center gap-2 text-sm text-[#0D1B2A]">
                  <Checkbox checked={obNA} onCheckedChange={(v) => setObNA(v === true)} />
                  {t("na")}
                </label>

                {!obNA && (
                  <>
                    <YesNo label={t("gave_birth")} value={gaveBirth} onChange={setGaveBirth} yes={t("yes")} no={t("no")} />
                    {gaveBirth && (
                      <div>
                        <label className="block text-xs text-gray-600">{t("num_children")}</label>
                        <input
                          type="number"
                          min={0}
                          value={numChildren}
                          onChange={(e) => setNumChildren(e.target.value)}
                          className="mt-1 w-32 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0D1B2A] focus:border-[#5B6BD4] focus:outline-none"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-gray-600">{t("complications")}</label>
                      <textarea
                        value={obComplications}
                        onChange={(e) => setObComplications(e.target.value)}
                        placeholder={t("complications_ph")}
                        rows={3}
                        className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white p-2 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#5B6BD4] focus:outline-none"
                      />
                    </div>
                    <YesNo label={t("assisted")} value={assisted} onChange={setAssisted} yes={t("yes")} no={t("no")} />
                    {assisted && (
                      <textarea
                        value={assistedNotes}
                        onChange={(e) => setAssistedNotes(e.target.value)}
                        placeholder={t("describe")}
                        rows={3}
                        className="w-full rounded-md border border-[#E5E7EB] bg-white p-2 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#5B6BD4] focus:outline-none"
                      />
                    )}
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E5E7EB] bg-white p-4">
        <button
          type="button"
          onClick={saveAll}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5B6BD4] to-[#7B8BE4] px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
        >
          <Check className="h-4 w-4" />
          {t("save")}
        </button>
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
