import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X, Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { SaveButton } from "@/components/ui/save-button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useLeaveGuard, LeaveDialog } from "./unsaved";
import { AutocompleteInput, COMMON_MEDICATIONS } from "./AutocompleteInput";


const ACCENT = "#EF3638";
const ACCENT_2 = "#EF3638";

type Detail = {
  reaction_type?: string | null; // Rash | Urticaria | Angioedema | Anaphylaxis | Other
  severity?: string | null; // Mild | Moderate | Severe
  carry_epipen?: boolean;
};

type Entry = Detail & {
  id: string; // local id (may equal db id if loaded)
  dbId?: string;
  name: string;
  reaction: string;
  is_preset: boolean;
  editing?: boolean;
};

type PresetDetail = Detail & { on: boolean };

type SectionState = {
  preset: Record<string, PresetDetail>;
  customs: Entry[];
};

type State = {
  nothing: boolean;
  drug: SectionState;
  food: SectionState;
  env: SectionState;
  contrast: SectionState;
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
const CONTRAST_PRESETS = [
  "Iodine-based contrast (CT)",
  "Gadolinium (MRI)",
  "Local anaesthetic",
  "General anaesthetic",
  "Other (specify)",
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

const REACTION_TYPES = ["Rash", "Urticaria", "Angioedema", "Anaphylaxis", "Other"];
const SEVERITIES = ["Mild", "Moderate", "Severe"];

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
  // contrast
  "Iodine-based contrast (CT)": "Jodbaserad kontrast (CT)",
  "Gadolinium (MRI)": "Gadolinium (MR)",
  "Local anaesthetic": "Lokalbedövning",
  "General anaesthetic": "Narkos",
  "Other (specify)": "Annat (ange)",
  // intol
  "Aspirin (GI upset)": "Aspirin (magbesvär)",
  "ACE inhibitor cough": "ACE-hämmarhosta",
  "Aspirin-exacerbated respiratory disease (AERD)": "Aspirin-utlöst luftvägssjukdom (AERD)",
  "Penicillin (GI intolerance)": "Penicillin (magbesvär)",
  "Statins (muscle pain)": "Statiner (muskelvärk)",
  "Metformin (GI upset)": "Metformin (magbesvär)",
  "Codeine (nausea)": "Kodein (illamående)",
  // detail values
  "Rash": "Utslag",
  "Urticaria": "Nässelutslag",
  "Angioedema": "Angioödem",
  "Anaphylaxis": "Anafylaxi",
  "Other": "Annat",
  "Mild": "Mild",
  "Moderate": "Måttlig",
  "Severe": "Svår",
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
    s_contrast: "Contrast & anaesthetic reactions",
    s_intol: "Drug intolerances",
    note_allergy: "An allergy involves an immune response — e.g. rash, swelling, anaphylaxis.",
    note_intol: "An intolerance is not an immune reaction but is clinically important for safe prescribing.",
    add_drug: "+ Add other drug allergy",
    add_food: "+ Add other food allergy",
    add_env: "+ Add other",
    add_contrast: "+ Add other",
    add_intol: "+ Add other intolerance",
    drug_name: "Drug name",
    drug_name_ph: "E.g. Vancomycin",
    reaction: "Reaction",
    reaction_ph_drug: "E.g. Anaphylaxis, rash, swelling",
    reaction_ph_food: "E.g. Hives, anaphylaxis, vomiting",
    reaction_ph_env: "E.g. Contact dermatitis, rhinitis",
    reaction_ph_contrast: "E.g. Urticaria, hypotension",
    food_item: "Food item",
    food_item_ph: "E.g. Kiwi, mustard",
    allergen: "Allergen",
    allergen_ph: "E.g. Horse hair, perfume",
    agent: "Agent",
    agent_ph: "E.g. Lidocaine",
    intol_drug_ph: "E.g. Tramadol",
    symptom: "Symptom",
    symptom_ph: "E.g. Severe nausea, dizziness",
    save_entry: "Save entry",
    cancel: "Cancel",
    details: "Details",
    reaction_type: "Reaction type",
    severity: "Severity",
    carry_epipen: "Carry EpiPen?",
    remove: "Remove",
    done: "Done",
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
    s_contrast: "Kontrast- & bedövningsreaktioner",
    s_intol: "Läkemedelsintoleranser",
    note_allergy: "En allergi innebär en immunreaktion — t.ex. utslag, svullnad, anafylaxi.",
    note_intol: "En intolerans är ingen immunreaktion men är kliniskt viktig för säker förskrivning.",
    add_drug: "+ Lägg till annan läkemedelsallergi",
    add_food: "+ Lägg till annan matallergi",
    add_env: "+ Lägg till annan",
    add_contrast: "+ Lägg till annan",
    add_intol: "+ Lägg till annan intolerans",
    drug_name: "Läkemedelsnamn",
    drug_name_ph: "T.ex. Vancomycin",
    reaction: "Reaktion",
    reaction_ph_drug: "T.ex. Anafylaxi, utslag, svullnad",
    reaction_ph_food: "T.ex. Nässelutslag, anafylaxi, kräkning",
    reaction_ph_env: "T.ex. Kontakteksem, snuva",
    reaction_ph_contrast: "T.ex. Nässelutslag, blodtrycksfall",
    food_item: "Livsmedel",
    food_item_ph: "T.ex. Kiwi, senap",
    allergen: "Allergen",
    allergen_ph: "T.ex. Hästhår, parfym",
    agent: "Medel",
    agent_ph: "T.ex. Lidokain",
    intol_drug_ph: "T.ex. Tramadol",
    symptom: "Symtom",
    symptom_ph: "T.ex. Kraftigt illamående, yrsel",
    save_entry: "Spara post",
    cancel: "Avbryt",
    details: "Detaljer",
    reaction_type: "Reaktionstyp",
    severity: "Allvarlighet",
    carry_epipen: "Bär EpiPen?",
    remove: "Ta bort",
    done: "Klar",
  },
};

const emptySection = (): SectionState => ({ preset: {}, customs: [] });

const initial: State = {
  nothing: false,
  drug: emptySection(),
  food: emptySection(),
  env: emptySection(),
  contrast: emptySection(),
  intol: emptySection(),
};

type SectionKey = "drug" | "food" | "env" | "contrast" | "intol";

const TABLES: Record<SectionKey, { table: string; nameCol: string; reactionCol: string }> = {
  drug: { table: "drug_allergies", nameCol: "drug_name", reactionCol: "reaction" },
  food: { table: "food_allergies", nameCol: "food_item", reactionCol: "reaction" },
  env: { table: "environmental_allergies", nameCol: "allergen", reactionCol: "reaction" },
  contrast: { table: "contrast_allergies", nameCol: "agent", reactionCol: "reaction" },
  intol: { table: "allergy_drug_intolerances", nameCol: "drug_name", reactionCol: "symptom" },
};

// Detail fields are stored on all allergy tables except intolerances
const SECTIONS_WITH_DETAILS: SectionKey[] = ["drug", "food", "env", "contrast"];

export default function AllergiesForm() {
  const { lang } = useI18n();
  const t = (k: keyof typeof T["en"]) => T[lang][k] ?? T.en[k];
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState<State>(initial);
  const [dirty, setDirty] = useState(false);

  const label = (preset: string) => (lang === "sv" ? SV_LABELS[preset] ?? preset : preset);

  const togglePreset = (key: SectionKey, preset: string) => {
    setS((p) => {
      const cur = p[key].preset[preset];
      const next = cur?.on
        ? { ...cur, on: false }
        : { ...(cur ?? {}), on: true };
      return { ...p, [key]: { ...p[key], preset: { ...p[key].preset, [preset]: next } } };
    });
    setDirty(true);
  };

  const updatePresetDetail = (key: SectionKey, preset: string, patch: Partial<PresetDetail>) => {
    setS((p) => {
      const cur = p[key].preset[preset] ?? { on: true };
      return {
        ...p,
        [key]: { ...p[key], preset: { ...p[key].preset, [preset]: { ...cur, ...patch } } },
      };
    });
    setDirty(true);
  };

  const addCustom = (key: SectionKey) => {
    const entry: Entry = {
      id: crypto.randomUUID(),
      name: "",
      reaction: "",
      is_preset: false,
      editing: true,
      carry_epipen: false,
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
      const [sum, da, fa, ea, ca, di] = await Promise.all([
        sb.from("allergies_summary").select("*").eq("user_id", user.id).maybeSingle(),
        sb.from("drug_allergies").select("*").eq("user_id", user.id),
        sb.from("food_allergies").select("*").eq("user_id", user.id),
        sb.from("environmental_allergies").select("*").eq("user_id", user.id),
        sb.from("contrast_allergies").select("*").eq("user_id", user.id),
        sb.from("allergy_drug_intolerances").select("*").eq("user_id", user.id),
      ]);

      const build = (
        rows: any[],
        nameCol: string,
        reactionCol: string,
        presets: string[],
        withDetails: boolean,
      ): SectionState => {
        const sec = emptySection();
        for (const r of rows ?? []) {
          const name = r[nameCol] as string;
          const details: Detail = withDetails
            ? {
                reaction_type: r.reaction_type ?? null,
                severity: r.severity ?? null,
                carry_epipen: !!r.carry_epipen,
              }
            : {};
          if (r.is_preset && presets.includes(name)) {
            sec.preset[name] = { on: true, ...details };
          } else {
            sec.customs.push({
              id: r.id,
              dbId: r.id,
              name: name ?? "",
              reaction: r[reactionCol] ?? "",
              is_preset: false,
              editing: false,
              ...details,
            });
          }
        }
        return sec;
      };

      setS({
        nothing: sum.data?.nothing_to_report ?? false,
        drug: build(da.data, "drug_name", "reaction", DRUG_PRESETS, true),
        food: build(fa.data, "food_item", "reaction", FOOD_PRESETS, true),
        env: build(ea.data, "allergen", "reaction", ENV_PRESETS, true),
        contrast: build(ca.data, "agent", "reaction", CONTRAST_PRESETS, true),
        intol: build(di.data, "drug_name", "symptom", INTOL_PRESETS, false),
      });
      setLoading(false);
    })();
  }, [navigate]);

  const audit = (table: string, action: string) => {
    if (!userId) return;
    supabase.from("audit_log").insert({ user_id: userId, table_name: table, action });
  };

  const bypassGuardRef = useRef(false);
  const saveAndExit = async () => {
    bypassGuardRef.current = true;
    const ok = await saveAll();
    if (ok) navigate({ to: "/passport" });
    else bypassGuardRef.current = false;
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

      for (const key of ["drug", "food", "env", "contrast", "intol"] as SectionKey[]) {
        const { table, nameCol, reactionCol } = TABLES[key];
        // wipe & re-insert for simplicity
        await sb.from(table).delete().eq("user_id", userId);

        if (s.nothing) continue;

        const withDetails = SECTIONS_WITH_DETAILS.includes(key);

        const presetRows = Object.entries(s[key].preset)
          .filter(([, v]) => v?.on)
          .map(([name, v]) => ({
            user_id: userId,
            [nameCol]: name,
            [reactionCol]: null,
            is_preset: true,
            ...(withDetails
              ? {
                  reaction_type: v.reaction_type ?? null,
                  severity: v.severity ?? null,
                  carry_epipen: !!v.carry_epipen,
                }
              : {}),
          }));
        const customRows = s[key].customs
          .filter((e) => e.name.trim().length > 0)
          .map((e) => ({
            user_id: userId,
            [nameCol]: e.name.trim(),
            [reactionCol]: e.reaction.trim() || null,
            is_preset: false,
            ...(withDetails
              ? {
                  reaction_type: e.reaction_type ?? null,
                  severity: e.severity ?? null,
                  carry_epipen: !!e.carry_epipen,
                }
              : {}),
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
        contrast: { ...p.contrast, customs: p.contrast.customs.map((e) => ({ ...e, editing: false })) },
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

  const resolver = useLeaveGuard(() => dirty && !bypassGuardRef.current);

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
              withDetails
              onTogglePreset={(p) => togglePreset("drug", p)}
              onUpdatePresetDetail={(p, patch) => updatePresetDetail("drug", p, patch)}
              onAdd={() => addCustom("drug")}
              onUpdate={(id, patch) => updateCustom("drug", id, patch)}
              onRemove={(id) => removeCustom("drug", id)}
              nameSuggestions={COMMON_MEDICATIONS}

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
              withDetails
              onTogglePreset={(p) => togglePreset("food", p)}
              onUpdatePresetDetail={(p, patch) => updatePresetDetail("food", p, patch)}
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
              withDetails
              onTogglePreset={(p) => togglePreset("env", p)}
              onUpdatePresetDetail={(p, patch) => updatePresetDetail("env", p, patch)}
              onAdd={() => addCustom("env")}
              onUpdate={(id, patch) => updateCustom("env", id, patch)}
              onRemove={(id) => removeCustom("env", id)}
            />
            <AllergySection
              title={t("s_contrast")}
              presets={CONTRAST_PRESETS}
              label={label}
              state={s.contrast}
              chipTone="amber"
              addLabel={t("add_contrast")}
              nameLabel={t("agent")}
              namePh={t("agent_ph")}
              reactionLabel={t("reaction")}
              reactionPh={t("reaction_ph_contrast")}
              t={t}
              withDetails
              onTogglePreset={(p) => togglePreset("contrast", p)}
              onUpdatePresetDetail={(p, patch) => updatePresetDetail("contrast", p, patch)}
              onAdd={() => addCustom("contrast")}
              onUpdate={(id, patch) => updateCustom("contrast", id, patch)}
              onRemove={(id) => removeCustom("contrast", id)}
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
              onUpdatePresetDetail={(p, patch) => updatePresetDetail("intol", p, patch)}
              onAdd={() => addCustom("intol")}
              onUpdate={(id, patch) => updateCustom("intol", id, patch)}
              onRemove={(id) => removeCustom("intol", id)}
              nameSuggestions={COMMON_MEDICATIONS}

            />
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-white/95 px-5 py-3 backdrop-blur border-t border-gray-100">
        <SaveButton
          onSave={async () => { const ok = await saveAndExit(); if (!ok) return false; }}
          className="block w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_2} 100%)` }}
        >
          {t("save")}
        </SaveButton>
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

function DetailEditor({
  detail,
  onChange,
  t,
  label,
}: {
  detail: Detail;
  onChange: (patch: Partial<Detail>) => void;
  t: (k: keyof typeof T["en"]) => string;
  label: (k: string) => string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-medium text-gray-700 mb-1.5">{t("reaction_type")}</div>
        <div className="flex flex-wrap gap-1.5">
          {REACTION_TYPES.map((r) => {
            const on = detail.reaction_type === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ reaction_type: on ? null : r })}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  on
                    ? "bg-[#EF3638] text-white border-[#EF3638]"
                    : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:bg-gray-50"
                }`}
              >
                {label(r)}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-700 mb-1.5">{t("severity")}</div>
        <div className="flex flex-wrap gap-1.5">
          {SEVERITIES.map((sv) => {
            const on = detail.severity === sv;
            return (
              <button
                key={sv}
                type="button"
                onClick={() => onChange({ severity: on ? null : sv })}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  on
                    ? "bg-[#EF3638] text-white border-[#EF3638]"
                    : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:bg-gray-50"
                }`}
              >
                {label(sv)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-medium text-gray-700">{t("carry_epipen")}</span>
        <Switch
          checked={!!detail.carry_epipen}
          onCheckedChange={(v) => onChange({ carry_epipen: v })}
        />
      </div>
    </div>
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
  withDetails,
  onTogglePreset,
  onUpdatePresetDetail,
  onAdd,
  onUpdate,
  onRemove,
  nameSuggestions,
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
  withDetails?: boolean;
  onTogglePreset: (preset: string) => void;
  onUpdatePresetDetail: (preset: string, patch: Partial<PresetDetail>) => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Entry>) => void;
  onRemove: (id: string) => void;
  nameSuggestions?: string[];
}) {
  const toneOn = "bg-[#EF3638] text-white border-[#EF3638]";
  void chipTone;

  return (
    <Section title={title}>
      {note && <p className="mb-3 text-xs text-gray-600">{note}</p>}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const detail = state.preset[p];
          const on = !!detail?.on;
          const chip = (
            <button
              type="button"
              onClick={() => {
                if (!withDetails) {
                  onTogglePreset(p);
                  return;
                }
                if (!on) onTogglePreset(p);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                on ? toneOn : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:bg-gray-50"
              }`}
            >
              {label(p)}
            </button>
          );
          if (!withDetails) return <span key={p}>{chip}</span>;
          if (!on) return <span key={p}>{chip}</span>;
          return (
            <Popover key={p}>
              <PopoverTrigger asChild>{chip}</PopoverTrigger>
              <PopoverContent align="start" className="w-72">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#0D1B2A]">{label(p)}</div>
                  <button
                    type="button"
                    onClick={() => onTogglePreset(p)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    {t("remove")}
                  </button>
                </div>
                <DetailEditor
                  detail={detail ?? {}}
                  onChange={(patch) => onUpdatePresetDetail(p, patch)}
                  t={t}
                  label={label}
                />
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
      {withDetails && presets.length > 0 && (
        <p className="mt-2 text-[11px] text-gray-500">
          Tap once to select · Tap again to describe reaction and severity
        </p>
      )}



      <div className="mt-3 space-y-2">
        {state.customs.map((e) => {
          const commit = () => {
            if (e.name.trim().length > 0) onUpdate(e.id, { editing: false });
          };
          const onKey = (ev: React.KeyboardEvent<HTMLInputElement>) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              commit();
            }
          };
          return (
          <div key={e.id} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
            {e.editing ? (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">{nameLabel}</label>
                  {nameSuggestions ? (
                    <AutocompleteInput
                      value={e.name}
                      onChange={(v) => onUpdate(e.id, { name: v })}
                      placeholder={namePh}
                      suggestions={nameSuggestions}
                      onKeyDown={onKey}
                      autoFocus
                    />
                  ) : (
                    <Input
                      value={e.name}
                      onChange={(ev) => onUpdate(e.id, { name: ev.target.value })}
                      onKeyDown={onKey}
                      placeholder={namePh}
                      className="mt-1"
                      autoFocus
                    />
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">{reactionLabel}</label>
                  <Input
                    value={e.reaction}
                    onChange={(ev) => onUpdate(e.id, { reaction: ev.target.value })}
                    onKeyDown={onKey}
                    placeholder={reactionPh}
                    className="mt-1"
                  />
                </div>
                {withDetails && (
                  <div className="rounded-lg border border-[#E5E7EB] bg-gray-50/50 p-3">
                    <DetailEditor
                      detail={e}
                      onChange={(patch) => onUpdate(e.id, patch)}
                      t={t}
                      label={label}
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onRemove(e.id)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    {t("cancel")}
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
                  {withDetails && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label={t("details")}
                          className="rounded-md px-2 py-1 text-[11px] font-medium text-[#EF3638] hover:bg-red-50"
                        >
                          {t("details")}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-72">
                        <div className="mb-2 text-sm font-semibold text-[#0D1B2A]">{e.name}</div>
                        <DetailEditor
                          detail={e}
                          onChange={(patch) => onUpdate(e.id, patch)}
                          t={t}
                          label={label}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
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
          );
        })}

      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#EF3638] hover:underline"
      >
        <Plus className="h-4 w-4" />
        {addLabel.replace(/^\+\s*/, "")}
      </button>
    </Section>
  );
}
