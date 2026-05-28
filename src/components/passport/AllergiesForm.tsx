import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X, Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLeaveGuard, LeaveDialog } from "./unsaved";

const ACCENT = "#E07B6B";
const ACCENT_2 = "#C45A4A";

type Entry = {
  id: string; // local id (may equal db id if loaded)
  dbId?: string;
  name: string;
  reaction: string;
  is_preset: boolean;
  editing?: boolean;
};

type SectionState = {
  preset: Record<string, boolean>;
  customs: Entry[];
};

type State = {
  nothing: boolean;
  drug: SectionState;
  food: SectionState;
  env: SectionState;
  intol: SectionState;
};

const DRUG_PRESETS = [
  "Penicillin",
  "Amoxicillin",
  "Sulfonamides",
  "Aspirin/NSAIDs",
  "Codeine/Opioids",
  "Ibuprofen",
  "Tetracycline",
  "Cephalosporins",
];
const FOOD_PRESETS = [
  "Peanuts",
  "Tree nuts",
  "Milk/Dairy",
  "Eggs",
  "Wheat/Gluten",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
];
const ENV_PRESETS = [
  "Pollen (grass)",
  "Pollen (tree)",
  "Dust mites",
  "Pet dander (cats)",
  "Pet dander (dogs)",
  "Latex",
  "Nickel",
  "Mould",
  "Insect stings",
];
const INTOL_PRESETS = [
  "Aspirin (GI upset)",
  "ACE inhibitor cough",
  "Aspirin-exacerbated respiratory disease (AERD)",
  "Penicillin (GI intolerance)",
  "Statins (muscle pain)",
  "Metformin (GI upset)",
  "Codeine (nausea)",
];

const SV_LABELS: Record<string, string> = {
  // drugs
  "Penicillin": "Penicillin",
  "Amoxicillin": "Amoxicillin",
  "Sulfonamides": "Sulfonamider",
  "Aspirin/NSAIDs": "Aspirin/NSAID",
  "Codeine/Opioids": "Kodein/Opioider",
  "Ibuprofen": "Ibuprofen",
  "Tetracycline": "Tetracyklin",
  "Cephalosporins": "Cefalosporiner",
  // foods
  "Peanuts": "Jordnötter",
  "Tree nuts": "Trädnötter",
  "Milk/Dairy": "Mjölk/Mejeri",
  "Eggs": "Ägg",
  "Wheat/Gluten": "Vete/Gluten",
  "Soy": "Soja",
  "Fish": "Fisk",
  "Shellfish": "Skaldjur",
  "Sesame": "Sesam",
  // env
  "Pollen (grass)": "Pollen (gräs)",
  "Pollen (tree)": "Pollen (träd)",
  "Dust mites": "Dammkvalster",
  "Pet dander (cats)": "Pälsdjur (katt)",
  "Pet dander (dogs)": "Pälsdjur (hund)",
  "Latex": "Latex",
  "Nickel": "Nickel",
  "Mould": "Mögel",
  "Insect stings": "Insektsstick",
  // intol
  "Aspirin (GI upset)": "Aspirin (magbesvär)",
  "ACE inhibitor cough": "ACE-hämmarhosta",
  "Aspirin-exacerbated respiratory disease (AERD)": "Aspirin-utlöst luftvägssjukdom (AERD)",
  "Penicillin (GI intolerance)": "Penicillin (magbesvär)",
  "Statins (muscle pain)": "Statiner (muskelvärk)",
  "Metformin (GI upset)": "Metformin (magbesvär)",
  "Codeine (nausea)": "Kodein (illamående)",
};

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: "Allergies",
    subtitle: "Drug, food, environment & contrast reactions",
    nothing: "Nothing to report",
    save: "Save",
    saved: "Saved",
    saveError: "Could not save",
    s_drug: "Drug allergies",
    s_food: "Food allergies",
    s_env: "Environmental & contact allergies",
    s_intol: "Drug intolerances",
    note_allergy: "An allergy involves an immune response — e.g. rash, swelling, anaphylaxis.",
    note_intol: "An intolerance is not an immune reaction but is clinically important for safe prescribing.",
    add_drug: "+ Add other drug allergy",
    add_food: "+ Add other food allergy",
    add_env: "+ Add other",
    add_intol: "+ Add other intolerance",
    drug_name: "Drug name",
    drug_name_ph: "E.g. Vancomycin",
    reaction: "Reaction",
    reaction_ph_drug: "E.g. Anaphylaxis, rash, swelling",
    reaction_ph_food: "E.g. Hives, anaphylaxis, vomiting",
    reaction_ph_env: "E.g. Contact dermatitis, rhinitis",
    food_item: "Food item",
    food_item_ph: "E.g. Kiwi, mustard",
    allergen: "Allergen",
    allergen_ph: "E.g. Horse hair, perfume",
    intol_drug_ph: "E.g. Tramadol",
    symptom: "Symptom",
    symptom_ph: "E.g. Severe nausea, dizziness",
    save_entry: "Save entry",
    cancel: "Cancel",
  },
  sv: {
    title: "Allergier",
    subtitle: "Läkemedel, mat, miljö & kontrastreaktioner",
    nothing: "Inget att rapportera",
    save: "Spara",
    saved: "Sparat",
    saveError: "Kunde inte spara",
    s_drug: "Läkemedelsallergier",
    s_food: "Matallergier",
    s_env: "Miljö- & kontaktallergier",
    s_intol: "Läkemedelsintoleranser",
    note_allergy: "En allergi innebär en immunreaktion — t.ex. utslag, svullnad, anafylaxi.",
    note_intol: "En intolerans är ingen immunreaktion men är kliniskt viktig för säker förskrivning.",
    add_drug: "+ Lägg till annan läkemedelsallergi",
    add_food: "+ Lägg till annan matallergi",
    add_env: "+ Lägg till annan",
    add_intol: "+ Lägg till annan intolerans",
    drug_name: "Läkemedelsnamn",
    drug_name_ph: "T.ex. Vancomycin",
    reaction: "Reaktion",
    reaction_ph_drug: "T.ex. Anafylaxi, utslag, svullnad",
    reaction_ph_food: "T.ex. Nässelutslag, anafylaxi, kräkning",
    reaction_ph_env: "T.ex. Kontakteksem, snuva",
    food_item: "Livsmedel",
    food_item_ph: "T.ex. Kiwi, senap",
    allergen: "Allergen",
    allergen_ph: "T.ex. Hästhår, parfym",
    intol_drug_ph: "T.ex. Tramadol",
    symptom: "Symtom",
    symptom_ph: "T.ex. Kraftigt illamående, yrsel",
    save_entry: "Spara post",
    cancel: "Avbryt",
  },
};

const emptySection = (): SectionState => ({ preset: {}, customs: [] });

const initial: State = {
  nothing: false,
  drug: emptySection(),
  food: emptySection(),
  env: emptySection(),
  intol: emptySection(),
};

type SectionKey = "drug" | "food" | "env" | "intol";

const TABLES: Record<SectionKey, { table: string; nameCol: string; reactionCol: string }> = {
  drug: { table: "drug_allergies", nameCol: "drug_name", reactionCol: "reaction" },
  food: { table: "food_allergies", nameCol: "food_item", reactionCol: "reaction" },
  env: { table: "environmental_allergies", nameCol: "allergen", reactionCol: "reaction" },
  intol: { table: "allergy_drug_intolerances", nameCol: "drug_name", reactionCol: "symptom" },
};

export default function AllergiesForm() {
  const { lang } = useI18n();
  const t = (k: keyof typeof T["en"]) => T[lang][k] ?? T.en[k];
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState<State>(initial);
  const [dirty, setDirty] = useState(false);

  const label = (preset: string) => (lang === "sv" ? SV_LABELS[preset] ?? preset : preset);

  const setSection = (key: SectionKey, patch: Partial<SectionState>) => {
    setS((p) => ({ ...p, [key]: { ...p[key], ...patch } }));
    setDirty(true);
  };

  const togglePreset = (key: SectionKey, preset: string) => {
    setS((p) => ({
      ...p,
      [key]: { ...p[key], preset: { ...p[key].preset, [preset]: !p[key].preset[preset] } },
    }));
    setDirty(true);
  };

  const addCustom = (key: SectionKey) => {
    const entry: Entry = {
      id: crypto.randomUUID(),
      name: "",
      reaction: "",
      is_preset: false,
      editing: true,
    };
    setS((p) => ({ ...p, [key]: { ...p[key], customs: [...p[key].customs, entry] } }));
    setDirty(true);
  };

  const updateCustom = (key: SectionKey, id: string, patch: Partial<Entry>) => {
    setS((p) => ({
      ...p,
      [key]: {
        ...p[key],
        customs: p[key].customs.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      },
    }));
    setDirty(true);
  };

  const removeCustom = (key: SectionKey, id: string) => {
    setS((p) => ({
      ...p,
      [key]: { ...p[key], customs: p[key].customs.filter((e) => e.id !== id) },
    }));
    setDirty(true);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(user.id);
      const sb = supabase as any;
      const [sum, da, fa, ea, di] = await Promise.all([
        sb.from("allergies_summary").select("*").eq("user_id", user.id).maybeSingle(),
        sb.from("drug_allergies").select("*").eq("user_id", user.id),
        sb.from("food_allergies").select("*").eq("user_id", user.id),
        sb.from("environmental_allergies").select("*").eq("user_id", user.id),
        sb.from("allergy_drug_intolerances").select("*").eq("user_id", user.id),
      ]);

      const build = (
        rows: any[],
        nameCol: string,
        reactionCol: string,
        presets: string[],
      ): SectionState => {
        const sec = emptySection();
        for (const r of rows ?? []) {
          const name = r[nameCol] as string;
          if (r.is_preset && presets.includes(name)) {
            sec.preset[name] = true;
          } else {
            sec.customs.push({
              id: r.id,
              dbId: r.id,
              name: name ?? "",
              reaction: r[reactionCol] ?? "",
              is_preset: false,
              editing: false,
            });
          }
        }
        return sec;
      };

      setS({
        nothing: sum.data?.nothing_to_report ?? false,
        drug: build(da.data, "drug_name", "reaction", DRUG_PRESETS),
        food: build(fa.data, "food_item", "reaction", FOOD_PRESETS),
        env: build(ea.data, "allergen", "reaction", ENV_PRESETS),
        intol: build(di.data, "drug_name", "symptom", INTOL_PRESETS),
      });
      setLoading(false);
    })();
  }, [navigate]);

  const audit = (table: string, action: string) => {
    if (!userId) return;
    supabase.from("audit_log").insert({ user_id: userId, table_name: table, action });
  };

  const saveAndExit = async () => {
    const ok = await saveAll();
    if (ok) navigate({ to: "/passport" });
    return ok;
  };

  const saveAll = async () => {
    if (!userId) return false;
    try {
      const sb = supabase as any;
      await sb
        .from("allergies_summary")
        .upsert(
          { user_id: userId, nothing_to_report: s.nothing, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        );

      for (const key of ["drug", "food", "env", "intol"] as SectionKey[]) {
        const { table, nameCol, reactionCol } = TABLES[key];
        // wipe & re-insert for simplicity
        await sb.from(table).delete().eq("user_id", userId);

        if (s.nothing) continue;

        const presetRows = Object.entries(s[key].preset)
          .filter(([, v]) => v)
          .map(([name]) => ({
            user_id: userId,
            [nameCol]: name,
            [reactionCol]: null,
            is_preset: true,
          }));
        const customRows = s[key].customs
          .filter((e) => e.name.trim().length > 0)
          .map((e) => ({
            user_id: userId,
            [nameCol]: e.name.trim(),
            [reactionCol]: e.reaction.trim() || null,
            is_preset: false,
          }));
        const all = [...presetRows, ...customRows];
        if (all.length > 0) await sb.from(table).insert(all);
        audit(table, "upsert");
      }

      audit("allergies_summary", "upsert");
      // Mark customs as not-editing after save
      setS((p) => ({
        ...p,
        drug: { ...p.drug, customs: p.drug.customs.map((e) => ({ ...e, editing: false })) },
        food: { ...p.food, customs: p.food.customs.map((e) => ({ ...e, editing: false })) },
        env: { ...p.env, customs: p.env.customs.map((e) => ({ ...e, editing: false })) },
        intol: { ...p.intol, customs: p.intol.customs.map((e) => ({ ...e, editing: false })) },
      }));
      setDirty(false);
      toast.success(t("saved"));
      return true;
    } catch {
      toast.error(t("saveError"));
      return false;
    }
  };

  const resolver = useLeaveGuard(dirty);

  if (loading) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white pb-28 text-[#0D1B2A]">
      <header
        className="px-5 pt-6 pb-7"
        style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_2} 100%)` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">⚠️</span>
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
            checked={s.nothing}
            onCheckedChange={(v) => setS((p) => {
              setDirty(true);
              return { ...p, nothing: v };
            })}
          />
        </div>

        {!s.nothing && (
          <>
            <AllergySection
              title={t("s_drug")}
              note={t("note_allergy")}
              presets={DRUG_PRESETS}
              label={label}
              state={s.drug}
              chipTone="red"
              addLabel={t("add_drug")}
              nameLabel={t("drug_name")}
              namePh={t("drug_name_ph")}
              reactionLabel={t("reaction")}
              reactionPh={t("reaction_ph_drug")}
              t={t}
              onTogglePreset={(p) => togglePreset("drug", p)}
              onAdd={() => addCustom("drug")}
              onUpdate={(id, patch) => updateCustom("drug", id, patch)}
              onRemove={(id) => removeCustom("drug", id)}
            />
            <AllergySection
              title={t("s_food")}
              presets={FOOD_PRESETS}
              label={label}
              state={s.food}
              chipTone="red"
              addLabel={t("add_food")}
              nameLabel={t("food_item")}
              namePh={t("food_item_ph")}
              reactionLabel={t("reaction")}
              reactionPh={t("reaction_ph_food")}
              t={t}
              onTogglePreset={(p) => togglePreset("food", p)}
              onAdd={() => addCustom("food")}
              onUpdate={(id, patch) => updateCustom("food", id, patch)}
              onRemove={(id) => removeCustom("food", id)}
            />
            <AllergySection
              title={t("s_env")}
              presets={ENV_PRESETS}
              label={label}
              state={s.env}
              chipTone="amber"
              addLabel={t("add_env")}
              nameLabel={t("allergen")}
              namePh={t("allergen_ph")}
              reactionLabel={t("reaction")}
              reactionPh={t("reaction_ph_env")}
              t={t}
              onTogglePreset={(p) => togglePreset("env", p)}
              onAdd={() => addCustom("env")}
              onUpdate={(id, patch) => updateCustom("env", id, patch)}
              onRemove={(id) => removeCustom("env", id)}
            />
            <AllergySection
              title={t("s_intol")}
              note={t("note_intol")}
              presets={INTOL_PRESETS}
              label={label}
              state={s.intol}
              chipTone="yellow"
              addLabel={t("add_intol")}
              nameLabel={t("drug_name")}
              namePh={t("intol_drug_ph")}
              reactionLabel={t("symptom")}
              reactionPh={t("symptom_ph")}
              t={t}
              onTogglePreset={(p) => togglePreset("intol", p)}
              onAdd={() => addCustom("intol")}
              onUpdate={(id, patch) => updateCustom("intol", id, patch)}
              onRemove={(id) => removeCustom("intol", id)}
            />
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-white/95 px-5 py-3 backdrop-blur border-t border-gray-100">
        <button
          type="button"
          onClick={saveAndExit}
          className="block w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_2} 100%)` }}
        >
          {t("save")}
        </button>
      </div>

      <LeaveDialog resolver={resolver} onSaveAndLeave={saveAll} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-[#0D1B2A]">{title}</h2>
      {children}
    </section>
  );
}

function AllergySection({
  title,
  note,
  presets,
  label,
  state,
  chipTone,
  addLabel,
  nameLabel,
  namePh,
  reactionLabel,
  reactionPh,
  t,
  onTogglePreset,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  note?: string;
  presets: string[];
  label: (k: string) => string;
  state: SectionState;
  chipTone: "red" | "amber" | "yellow";
  addLabel: string;
  nameLabel: string;
  namePh: string;
  reactionLabel: string;
  reactionPh: string;
  t: (k: keyof typeof T["en"]) => string;
  onTogglePreset: (preset: string) => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Entry>) => void;
  onRemove: (id: string) => void;
}) {
  const toneOn = useMemo(() => {
    if (chipTone === "red") return "bg-[#E07B6B] text-white border-[#E07B6B]";
    if (chipTone === "amber") return "bg-[#E89B4A] text-white border-[#E89B4A]";
    return "bg-[#E8C24A] text-[#5A4500] border-[#E8C24A]";
  }, [chipTone]);

  return (
    <Section title={title}>
      {note && <p className="mb-3 text-xs text-gray-600">{note}</p>}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const on = !!state.preset[p];
          return (
            <button
              key={p}
              type="button"
              onClick={() => onTogglePreset(p)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                on
                  ? toneOn
                  : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:bg-gray-50"
              }`}
            >
              {label(p)}
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-2">
        {state.customs.map((e) => (
          <div key={e.id} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
            {e.editing ? (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">{nameLabel}</label>
                  <Input
                    value={e.name}
                    onChange={(ev) => onUpdate(e.id, { name: ev.target.value })}
                    placeholder={namePh}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">{reactionLabel}</label>
                  <Input
                    value={e.reaction}
                    onChange={(ev) => onUpdate(e.id, { reaction: ev.target.value })}
                    placeholder={reactionPh}
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onRemove(e.id)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate(e.id, { editing: false })}
                    disabled={e.name.trim().length === 0}
                    className="rounded-md bg-[#0D1B2A] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {t("save_entry")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-[#0D1B2A]">
                  <span className="font-semibold">{e.name}</span>
                  {e.reaction && <span className="text-gray-600"> · {e.reaction}</span>}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => onUpdate(e.id, { editing: true })}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => onRemove(e.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#C45A4A] hover:underline"
      >
        <Plus className="h-4 w-4" />
        {addLabel.replace(/^\+\s*/, "")}
      </button>
    </Section>
  );
}
