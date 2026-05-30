import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLeaveGuard, LeaveDialog } from "./unsaved";

const ACCENT = "#E0A066";
const ACCENT_2 = "#C4854A";

type ParentState = {
  unknown: boolean;
  living: string; // "yes" | "no" | "unknown" | ""
  year_born: string;
  age_at_death: string;
  cause_of_death: string;
  known_conditions: string;
};

const emptyParent: ParentState = {
  unknown: false,
  living: "",
  year_born: "",
  age_at_death: "",
  cause_of_death: "",
  known_conditions: "",
};

type CustomCondition = { id: string; name: string; relative: string };

type State = {
  nothing: boolean;
  father: ParentState;
  mother: ParentState;
  fatherConfirmed: boolean;
  motherConfirmed: boolean;
  conditions: Record<string, string>; // condition key -> which_relative
  conditionsChecked: Record<string, boolean>;
  conditionsConfirmed: Record<string, boolean>;
  specifyByCondition: Record<string, string>; // condition key -> which_condition / age / specify
  customConditions: CustomCondition[];
  noneOfAbove: boolean;
  has_siblings: boolean | null;
  sibling_count: string;
  sibling_conditions: string;
  tested: boolean | null;
  findings: string;
  under_counselling: boolean | null;
  dna_tests: string[];
  dna_other: string;
  dna_file_path: string | null;
  dna_file_name: string | null;
};

type AgeKind = "stroke" | "onset";
const CONDITIONS: { v: string; l_en: string; l_sv: string; needsSpecify?: boolean; ageKind?: AgeKind }[] = [
  { v: "cardio_early", l_en: "Cardiovascular disease (early onset)", l_sv: "Hjärt-kärlsjukdom (tidig debut)" },
  { v: "stroke", l_en: "Stroke", l_sv: "Stroke", ageKind: "stroke" },
  { v: "diabetes_t1", l_en: "Diabetes type 1", l_sv: "Diabetes typ 1" },
  { v: "diabetes_t2", l_en: "Diabetes type 2", l_sv: "Diabetes typ 2" },
  { v: "breast_cancer", l_en: "Breast cancer", l_sv: "Bröstcancer" },
  { v: "ovarian_cancer", l_en: "Ovarian cancer", l_sv: "Äggstockscancer" },
  { v: "colorectal_cancer", l_en: "Colorectal cancer", l_sv: "Tjock- och ändtarmscancer" },
  { v: "prostate_cancer", l_en: "Prostate cancer", l_sv: "Prostatacancer" },
  { v: "alzheimer", l_en: "Alzheimer's / dementia", l_sv: "Alzheimers / demens", ageKind: "onset" },
  { v: "parkinson", l_en: "Parkinson's disease", l_sv: "Parkinsons sjukdom", ageKind: "onset" },
  { v: "mental_illness", l_en: "Mental illness", l_sv: "Psykisk sjukdom" },
  { v: "autoimmune", l_en: "Autoimmune disease", l_sv: "Autoimmun sjukdom", needsSpecify: true },
  { v: "kidney", l_en: "Kidney disease", l_sv: "Njursjukdom", needsSpecify: true },
  { v: "haemophilia", l_en: "Haemophilia / clotting disorder", l_sv: "Blödarsjuka / koagulationsrubbning" },
  { v: "sudden_cardiac", l_en: "Sudden cardiac death (young)", l_sv: "Plötslig hjärtdöd (ung)" },
  { v: "familial_chol", l_en: "Familial hypercholesterolaemia", l_sv: "Familjär hyperkolesterolemi" },
  { v: "cystic_fibrosis", l_en: "Cystic fibrosis", l_sv: "Cystisk fibros", ageKind: "onset" },
];

const FAMILY_MEMBERS: { v: string; l_en: string; l_sv: string }[] = [
  { v: "paternal_grandfather", l_en: "Paternal grandfather", l_sv: "Farfar" },
  { v: "paternal_grandmother", l_en: "Paternal grandmother", l_sv: "Farmor" },
  { v: "maternal_grandfather", l_en: "Maternal grandfather", l_sv: "Morfar" },
  { v: "maternal_grandmother", l_en: "Maternal grandmother", l_sv: "Mormor" },
  { v: "father", l_en: "Father", l_sv: "Far" },
  { v: "mother", l_en: "Mother", l_sv: "Mor" },
  { v: "brother", l_en: "Brother", l_sv: "Bror" },
  { v: "sister", l_en: "Sister", l_sv: "Syster" },
  { v: "son", l_en: "Son", l_sv: "Son" },
  { v: "daughter", l_en: "Daughter", l_sv: "Dotter" },
  { v: "paternal_uncle_aunt", l_en: "Paternal uncle / aunt", l_sv: "Farbror / faster" },
  { v: "maternal_uncle_aunt", l_en: "Maternal uncle / aunt", l_sv: "Morbror / moster" },
  { v: "cousin", l_en: "Cousin", l_sv: "Kusin" },
  { v: "other", l_en: "Other (specify)", l_sv: "Annan (specificera)" },
];

function parseRelatives(s: string | null | undefined): { picks: string[]; other: string } {
  if (!s) return { picks: [], other: "" };
  const picks: string[] = [];
  let other = "";
  for (const raw of s.split(",").map((p) => p.trim()).filter(Boolean)) {
    if (raw.startsWith("other:")) {
      other = raw.slice(6).trim();
      if (!picks.includes("other")) picks.push("other");
    } else if (FAMILY_MEMBERS.some((fm) => fm.v === raw)) {
      picks.push(raw);
    } else {
      // Legacy free-text — treat as Other
      other = other ? `${other}, ${raw}` : raw;
      if (!picks.includes("other")) picks.push("other");
    }
  }
  return { picks, other };
}

function serializeRelatives(picks: string[], other: string): string {
  return picks
    .map((p) => (p === "other" ? (other.trim() ? `other:${other.trim()}` : "") : p))
    .filter(Boolean)
    .join(",");
}

function displayRelatives(s: string | null | undefined, lang: Lang): string {
  const { picks, other } = parseRelatives(s);
  return picks
    .map((p) => {
      if (p === "other") return other || (lang === "sv" ? "Annan" : "Other");
      const fm = FAMILY_MEMBERS.find((f) => f.v === p);
      return fm ? (lang === "sv" ? fm.l_sv : fm.l_en) : p;
    })
    .join(", ");
}


const initialState: State = {
  nothing: false,
  father: { ...emptyParent },
  mother: { ...emptyParent },
  fatherConfirmed: false,
  motherConfirmed: false,
  conditions: {},
  conditionsChecked: {},
  conditionsConfirmed: {},
  specifyByCondition: {},
  customConditions: [],
  noneOfAbove: false,
  has_siblings: null,
  sibling_count: "",
  sibling_conditions: "",
  tested: null,
  findings: "",
  under_counselling: null,
  dna_tests: [],
  dna_other: "",
  dna_file_path: null,
  dna_file_name: null,
};

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: "Heredity",
    subtitle: "Family medical history & genetic conditions",
    nothing: "Nothing to report",
    yes: "Yes",
    no: "No",
    unknown: "Unknown",
    save: "Save",
    saved: "Saved",
    saveError: "Could not save",
    s_father: "Biological Father",
    s_mother: "Biological Mother",
    dont_know_father: "I don't know my biological father",
    dont_know_mother: "I don't know my biological mother",
    living: "Living?",
    age_at_death: "Age at death",
    cause_of_death: "Cause of death",
    cause_ph: "E.g. Heart attack, cancer…",
    year_born: "Year born",
    year_born_ph: "E.g. 1948",
    known_conditions: "Known medical conditions",
    known_conditions_ph: "E.g. Type 2 diabetes, hypertension, heart disease…",
    s_conditions: "Hereditary conditions — tick all that apply in your close family",
    close_family_note: "Close family = parents, siblings, grandparents, aunts & uncles",
    which_relative: "Which relative?",
    which_condition: "Which condition?",
    which_condition_ph: "E.g. Chronic kidney disease, polycystic kidney disease…",
    age_at_first_stroke: "Age at first stroke?",
    age_at_onset: "Age at onset?",
    please_specify: "Please specify…",
    none_of_above: "None of the above",
    add_other_condition: "Add other condition",
    other_condition_ph: "Type a condition…",
    s_siblings: "Siblings",
    has_siblings_q: "Do you have biological siblings?",
    num_siblings: "Number of siblings",
    sibling_conditions_q: "Any known genetic or hereditary conditions among your siblings?",
    sibling_conditions_ph: "E.g. Brother has Type 1 diabetes, sister has breast cancer…",
    s_genetic: "Genetic testing",
    tested_q: "Have you or any close family member undergone genetic testing?",
    findings_q: "What was tested and what were the findings?",
    findings_ph: "E.g. BRCA1 gene test — negative. Father tested positive for Huntington's gene.",
    counselling_q: "Are you currently under genetic counselling?",
    s_dna_title: "Import raw DNA data",
    s_dna_sub: "Have you taken a consumer DNA test? Import your raw data file to enrich your genetic health profile.",
    dna_which_q: "Which test did you take?",
    dna_other_ph: "Specify other genetic test…",
    dna_upload_btn: "Upload raw DNA file",
    dna_upload_hint: "Supported formats: 23andMe .txt · AncestryDNA .txt · VCF · BAM (whole genome)",
    dna_privacy: "Your raw DNA data is stored encrypted and is never shared without your explicit consent. GlobeDoc does not interpret raw DNA — this file can be shared with a clinical geneticist via pairing code.",
    dna_uploaded: "Uploaded",
    dna_remove: "Remove",
    dna_uploading: "Uploading…",
  },
  sv: {
    title: "Ärftlighet",
    subtitle: "Familjehistoria & genetiska tillstånd",
    nothing: "Inget att rapportera",
    yes: "Ja",
    no: "Nej",
    unknown: "Vet ej",
    save: "Spara",
    saved: "Sparat",
    saveError: "Kunde inte spara",
    s_father: "Biologisk far",
    s_mother: "Biologisk mor",
    dont_know_father: "Jag känner inte min biologiska far",
    dont_know_mother: "Jag känner inte min biologiska mor",
    living: "Lever?",
    age_at_death: "Ålder vid död",
    cause_of_death: "Dödsorsak",
    cause_ph: "T.ex. Hjärtinfarkt, cancer…",
    year_born: "Födelseår",
    year_born_ph: "T.ex. 1948",
    known_conditions: "Kända medicinska tillstånd",
    known_conditions_ph: "T.ex. Diabetes typ 2, högt blodtryck, hjärtsjukdom…",
    s_conditions: "Ärftliga tillstånd — kryssa i allt som gäller i din nära familj",
    close_family_note: "Nära familj = föräldrar, syskon, mor- och farföräldrar, mostrar/morbröder/fastrar/farbröder",
    which_relative: "Vilken släkting?",
    which_relative_ph: "T.ex. Far, farfar",
    which_condition: "Vilket tillstånd?",
    which_condition_ph: "T.ex. Kronisk njursjukdom, polycystisk njursjukdom…",
    please_specify: "Vänligen specificera…",
    age_at_first_stroke: "Ålder vid första stroke?",
    age_at_onset: "Ålder vid debut?",
    none_of_above: "Inget av ovanstående",

    add_other_condition: "Lägg till annat tillstånd",
    other_condition_ph: "Skriv ett tillstånd…",
    s_siblings: "Syskon",
    has_siblings_q: "Har du biologiska syskon?",
    num_siblings: "Antal syskon",
    sibling_conditions_q: "Några kända genetiska eller ärftliga tillstånd bland dina syskon?",
    sibling_conditions_ph: "T.ex. Bror har diabetes typ 1, syster har bröstcancer…",
    s_genetic: "Genetisk testning",
    tested_q: "Har du eller någon nära familjemedlem genomgått genetisk testning?",
    findings_q: "Vad testades och vad blev resultatet?",
    findings_ph: "T.ex. BRCA1-gentest — negativt. Far testade positivt för Huntingtons gen.",
    counselling_q: "Får du genetisk rådgivning just nu?",
    s_dna_title: "Importera rå DNA-data",
    s_dna_sub: "Har du gjort ett konsument-DNA-test? Importera din rådatafil för att berika din genetiska hälsoprofil.",
    dna_which_q: "Vilket test gjorde du?",
    dna_other_ph: "Specificera annat gentest…",
    dna_upload_btn: "Ladda upp rå DNA-fil",
    dna_upload_hint: "Format som stöds: 23andMe .txt · AncestryDNA .txt · VCF · BAM (helgenom)",
    dna_privacy: "Din rå DNA-data lagras krypterad och delas aldrig utan ditt uttryckliga samtycke. GlobeDoc tolkar inte rå DNA — filen kan delas med en klinisk genetiker via parkod.",
    dna_uploaded: "Uppladdad",
    dna_remove: "Ta bort",
    dna_uploading: "Laddar upp…",
  },
};

export default function HeredityForm() {
  const { lang } = useI18n();
  const t = (k: keyof typeof T["en"]) => T[lang][k] ?? T.en[k];
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState<State>(initialState);
  const [dirty, setDirty] = useState(false);
  const [openSiblings, setOpenSiblings] = useState(false);
  const [openGenetic, setOpenGenetic] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const bypassGuardRef = useRef(false);


  const setField = <K extends keyof State>(k: K, v: State[K]) => {
    setS((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };
  const setParent = (which: "father" | "mother", patch: Partial<ParentState>) => {
    setS((p) => ({ ...p, [which]: { ...p[which], ...patch } }));
    setDirty(true);
  };
  const toggleCondition = (v: string) => {
    setS((p) => {
      const checked = !!p.conditionsChecked[v];
      const confirmed = !!p.conditionsConfirmed[v];
      // Confirmed chip → unconfirm to re-edit (keep checked)
      if (checked && confirmed) {
        const nc = { ...p.conditionsConfirmed };
        delete nc[v];
        return { ...p, conditionsConfirmed: nc };
      }
      // Unconfirmed checked chip → uncheck
      // Unchecked chip → check (will show edit form)
      const next = !checked;
      return {
        ...p,
        conditionsChecked: { ...p.conditionsChecked, [v]: next },
        noneOfAbove: next ? false : p.noneOfAbove,
      };
    });
    setDirty(true);
  };
  const confirmCondition = (v: string) => {
    setS((p) => ({ ...p, conditionsConfirmed: { ...p.conditionsConfirmed, [v]: true } }));
  };
  const confirmParent = (which: "father" | "mother") => {
    setS((p) => ({ ...p, [`${which}Confirmed`]: true } as State));
  };
  const editParent = (which: "father" | "mother") => {
    setS((p) => ({ ...p, [`${which}Confirmed`]: false } as State));
  };
  const deleteParent = (which: "father" | "mother") => {
    setS((p) => ({ ...p, [which]: { ...emptyParent }, [`${which}Confirmed`]: false } as State));
    setDirty(true);
  };
  const toggleNoneOfAbove = () => {
    setS((p) => {
      const next = !p.noneOfAbove;
      return {
        ...p,
        noneOfAbove: next,
        // Toggling on "none" clears all condition checks
        conditionsChecked: next ? {} : p.conditionsChecked,
      };
    });
    setDirty(true);
  };
  const setConditionRelative = (v: string, txt: string) => {
    setS((p) => ({ ...p, conditions: { ...p.conditions, [v]: txt } }));
    setDirty(true);
  };
  const setConditionSpecify = (v: string, txt: string) => {
    setS((p) => ({ ...p, specifyByCondition: { ...p.specifyByCondition, [v]: txt } }));
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
      const [sum, parents, conds, sibs, gen] = await Promise.all([
        sb.from("heredity_summary").select("*").eq("user_id", user.id).maybeSingle(),
        sb.from("heredity_parents").select("*").eq("user_id", user.id),
        sb.from("heredity_conditions").select("*").eq("user_id", user.id),
        sb.from("heredity_siblings").select("*").eq("user_id", user.id).maybeSingle(),
        sb.from("heredity_genetic_testing").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      const next: State = {
        ...initialState,
        father: { ...emptyParent },
        mother: { ...emptyParent },
        conditions: {},
        conditionsChecked: {},
        conditionsConfirmed: {},
        specifyByCondition: {},
        customConditions: [],
      };
      next.nothing = sum.data?.nothing_to_report ?? false;
      for (const row of parents.data ?? []) {
        const ps: ParentState = {
          unknown: row.unknown ?? false,
          living: row.living_status ?? "",
          // current_age column repurposed to store year born
          year_born: row.current_age != null ? String(row.current_age) : "",
          age_at_death: row.age_at_death != null ? String(row.age_at_death) : "",
          cause_of_death: row.cause_of_death ?? "",
          known_conditions: row.known_conditions ?? "",
        };
        const hasData =
          ps.unknown || ps.living || ps.year_born || ps.age_at_death || ps.cause_of_death || ps.known_conditions;
        if (row.parent_type === "father") {
          next.father = ps;
          if (hasData) next.fatherConfirmed = true;
        }
        if (row.parent_type === "mother") {
          next.mother = ps;
          if (hasData) next.motherConfirmed = true;
        }
      }
      const presetKeys = new Set(CONDITIONS.map((c) => c.v));
      for (const row of conds.data ?? []) {
        if (presetKeys.has(row.condition_name)) {
          next.conditionsChecked[row.condition_name] = true;
          next.conditionsConfirmed[row.condition_name] = true;
          if (row.which_relative) next.conditions[row.condition_name] = row.which_relative;
          if (row.other_specify) next.specifyByCondition[row.condition_name] = row.other_specify;
        } else {
          next.customConditions.push({ id: row.id, name: row.condition_name, relative: row.which_relative ?? "" });
        }
      }
      if (sibs.data) {
        next.has_siblings = sibs.data.has_siblings;
        next.sibling_count = sibs.data.sibling_count != null ? String(sibs.data.sibling_count) : "";
        next.sibling_conditions = sibs.data.sibling_conditions ?? "";
      }
      if (gen.data) {
        next.tested = gen.data.tested;
        next.findings = gen.data.findings ?? "";
        next.under_counselling = gen.data.under_counselling;
        next.dna_tests = gen.data.dna_tests ?? [];
        next.dna_other = gen.data.dna_other ?? "";
        next.dna_file_path = gen.data.dna_file_path ?? null;
        next.dna_file_name = gen.data.dna_file_name ?? null;
      }
      setS(next);
      setLoading(false);
    })();
  }, [navigate]);

  const audit = (table: string, action: string) => {
    if (!userId) return;
    supabase.from("audit_log").insert({ user_id: userId, table_name: table, action });
  };

  const saveAll = async () => {
    if (!userId) return false;
    try {
      const sb = supabase as any;
      // Summary
      await sb
        .from("heredity_summary")
        .upsert({ user_id: userId, nothing_to_report: s.nothing }, { onConflict: "user_id" });

      if (s.nothing) {
        await Promise.all([
          sb.from("heredity_parents").delete().eq("user_id", userId),
          sb.from("heredity_conditions").delete().eq("user_id", userId),
          sb.from("heredity_siblings").delete().eq("user_id", userId),
          sb.from("heredity_genetic_testing").delete().eq("user_id", userId),
        ]);
      } else {
        // Parents
        const parentRows = (["father", "mother"] as const).map((pt) => {
          const ps = s[pt];
          return {
            user_id: userId,
            parent_type: pt,
            unknown: ps.unknown,
            living_status: ps.unknown ? null : ps.living || null,
            // year_born is stored in the current_age integer column
            current_age:
              !ps.unknown && (ps.living === "yes" || ps.living === "unknown") && ps.year_born
                ? parseInt(ps.year_born, 10)
                : null,
            age_at_death:
              !ps.unknown && ps.living === "no" && ps.age_at_death
                ? parseInt(ps.age_at_death, 10)
                : null,
            cause_of_death:
              !ps.unknown && ps.living === "no" ? ps.cause_of_death || null : null,
            known_conditions: ps.unknown ? null : ps.known_conditions || null,
            updated_at: new Date().toISOString(),
          };
        });
        await sb.from("heredity_parents").upsert(parentRows, { onConflict: "user_id,parent_type" });

        // Conditions: delete then re-insert checked
        const checked = Object.entries(s.conditionsChecked)
          .filter(([, v]) => v)
          .map(([k]) => k);
        await sb.from("heredity_conditions").delete().eq("user_id", userId);
        const condRows = [
          ...checked.map((k) => ({
            user_id: userId,
            condition_name: k,
            which_relative: s.conditions[k] || null,
            other_specify: s.specifyByCondition[k] || null,
          })),
          ...s.customConditions
            .filter((c) => c.name.trim().length > 0)
            .map((c) => ({
              user_id: userId,
              condition_name: c.name.trim(),
              which_relative: c.relative.trim() || null,

              other_specify: null,
            })),
        ];
        if (condRows.length > 0) {
          await sb.from("heredity_conditions").insert(condRows);
        }

        // Siblings
        await sb.from("heredity_siblings").upsert(
          {
            user_id: userId,
            has_siblings: s.has_siblings,
            sibling_count:
              s.has_siblings && s.sibling_count ? parseInt(s.sibling_count, 10) : null,
            sibling_conditions: s.has_siblings ? s.sibling_conditions || null : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

        // Genetic testing
        await sb.from("heredity_genetic_testing").upsert(
          {
            user_id: userId,
            tested: s.tested,
            findings: s.tested ? s.findings || null : null,
            under_counselling: s.tested ? s.under_counselling : null,
            dna_tests: s.dna_tests.length > 0 ? s.dna_tests : null,
            dna_other: s.dna_other || null,
            dna_file_path: s.dna_file_path,
            dna_file_name: s.dna_file_name,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      }

      audit("heredity_summary", "upsert");
      audit("heredity_parents", "upsert");
      audit("heredity_conditions", "upsert");
      audit("heredity_siblings", "upsert");
      audit("heredity_genetic_testing", "upsert");

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
            <span className="text-3xl leading-none">🧬</span>
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
          <Switch checked={s.nothing} onCheckedChange={(v) => setField("nothing", v)} />
        </div>

        {!s.nothing && (
          <>
            <ParentSection
              t={t}
              title={t("s_father")}
              dontKnowLabel={t("dont_know_father")}
              value={s.father}
              confirmed={s.fatherConfirmed}
              onChange={(patch) => setParent("father", patch)}
              onConfirm={() => confirmParent("father")}
              onEdit={() => editParent("father")}
              onDelete={() => deleteParent("father")}
            />
            <ParentSection
              t={t}
              title={t("s_mother")}
              dontKnowLabel={t("dont_know_mother")}
              value={s.mother}
              confirmed={s.motherConfirmed}
              onChange={(patch) => setParent("mother", patch)}
              onConfirm={() => confirmParent("mother")}
              onEdit={() => editParent("mother")}
              onDelete={() => deleteParent("mother")}
            />


            {/* Hereditary conditions — chip toggle design */}
            <Section title={t("s_conditions")}>
              <p className="mb-3 text-xs text-gray-600">{t("close_family_note")}</p>
              <div className={`flex flex-wrap gap-2 ${s.noneOfAbove ? "pointer-events-none opacity-40" : ""}`}>
                {CONDITIONS.map((c) => {
                  const on = !!s.conditionsChecked[c.v];
                  return (
                    <button
                      key={c.v}
                      type="button"
                      onClick={() => toggleCondition(c.v)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        on
                          ? "border-[#E0A066] bg-[#E0A066] text-white"
                          : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:bg-gray-50"
                      }`}
                    >
                      {lang === "sv" ? c.l_sv : c.l_en}
                    </button>
                  );
                })}
              </div>

              {/* Saved entries list — confirmed preset conditions + custom conditions */}
              {!s.noneOfAbove &&
                (CONDITIONS.some((c) => s.conditionsChecked[c.v] && s.conditionsConfirmed[c.v]) ||
                  s.customConditions.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {CONDITIONS.filter((c) => s.conditionsChecked[c.v] && s.conditionsConfirmed[c.v]).map((c) => {
                      const label = lang === "sv" ? c.l_sv : c.l_en;
                      const rel = s.conditions[c.v];
                      const spec = s.specifyByCondition[c.v];
                      const ageLabel = c.ageKind === "stroke" ? t("age_at_first_stroke") : t("age_at_onset");
                      const parts: string[] = [];
                      if (rel) parts.push(`${t("which_relative")} ${displayRelatives(rel, lang)}`);
                      if (c.ageKind && spec) parts.push(`${ageLabel} ${spec}`);
                      if (c.needsSpecify && spec) parts.push(`${t("which_condition")} ${spec}`);
                      return (
                        <div
                          key={c.v}
                          className="flex items-start justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3"
                        >
                          <div className="min-w-0 flex-1 text-sm text-[#0D1B2A]">
                            <div className="font-medium">{label}</div>
                            {parts.length > 0 && (
                              <div className="mt-0.5 text-xs text-gray-600">{parts.join(" · ")}</div>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              aria-label="Edit"
                              onClick={() => {
                                setS((p) => {
                                  const nc = { ...p.conditionsConfirmed };
                                  delete nc[c.v];
                                  return { ...p, conditionsConfirmed: nc };
                                });
                              }}
                              className="rounded-md p-1.5 text-gray-600 hover:bg-white"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete"
                              onClick={() => {
                                setS((p) => {
                                  const nChecked = { ...p.conditionsChecked };
                                  delete nChecked[c.v];
                                  const nConfirmed = { ...p.conditionsConfirmed };
                                  delete nConfirmed[c.v];
                                  const nRel = { ...p.conditions };
                                  delete nRel[c.v];
                                  const nSpec = { ...p.specifyByCondition };
                                  delete nSpec[c.v];
                                  return {
                                    ...p,
                                    conditionsChecked: nChecked,
                                    conditionsConfirmed: nConfirmed,
                                    conditions: nRel,
                                    specifyByCondition: nSpec,
                                  };
                                });
                                setDirty(true);
                              }}
                              className="rounded-md p-1.5 text-gray-600 hover:bg-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {s.customConditions.map((cc) =>
                      editingCustomId === cc.id ? (
                        <AddOtherCondition
                          key={cc.id}
                          lang={lang}
                          whichRelativeLabel={t("which_relative")}
                          whichRelativePh={t("which_relative_ph")}
                          whichConditionLabel={t("which_condition")}
                          whichConditionPh={t("please_specify")}
                          buttonLabel={t("add_other_condition")}
                          disabled={false}
                          initialName={cc.name}
                          initialRelative={cc.relative}
                          startOpen
                          onCancel={() => setEditingCustomId(null)}
                          onAdd={(name, relative) => {
                            setS((p) => ({
                              ...p,
                              customConditions: p.customConditions.map((x) =>
                                x.id === cc.id ? { ...x, name, relative } : x,
                              ),
                            }));
                            setDirty(true);
                            setEditingCustomId(null);
                          }}
                        />
                      ) : (
                        <div
                          key={cc.id}
                          className="flex items-start justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3"
                        >
                          <div className="min-w-0 flex-1 text-sm text-[#0D1B2A]">
                            <div className="font-medium">{cc.name}</div>
                            {cc.relative && (
                              <div className="mt-0.5 text-xs text-gray-600">
                                {t("which_relative")} {displayRelatives(cc.relative, lang)}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              aria-label="Edit"
                              onClick={() => setEditingCustomId(cc.id)}
                              className="rounded-md p-1.5 text-gray-600 hover:bg-white"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete"
                              onClick={() => {
                                setS((p) => ({
                                  ...p,
                                  customConditions: p.customConditions.filter((x) => x.id !== cc.id),
                                }));
                                setDirty(true);
                              }}
                              className="rounded-md p-1.5 text-gray-600 hover:bg-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

              <AddOtherCondition
                whichRelativeLabel={t("which_relative")}
                whichRelativePh={t("which_relative_ph")}
                whichConditionLabel={t("which_condition")}
                whichConditionPh={t("please_specify")}
                buttonLabel={t("add_other_condition")}
                disabled={s.noneOfAbove}
                onAdd={(name, relative) => {
                  setS((p) => ({
                    ...p,
                    customConditions: [...p.customConditions, { id: crypto.randomUUID(), name, relative }],
                    noneOfAbove: false,
                  }));
                  setDirty(true);
                }}
              />

              {/* Optional "which relative" for checked preset conditions — hidden once confirmed */}
              {!s.noneOfAbove && CONDITIONS.some((c) => s.conditionsChecked[c.v] && !s.conditionsConfirmed[c.v]) && (
                <div className="mt-4 space-y-3">
                  {CONDITIONS.filter((c) => s.conditionsChecked[c.v] && !s.conditionsConfirmed[c.v]).map((c) => {
                    const onEnter = (e: React.KeyboardEvent) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        confirmCondition(c.v);
                      }
                    };
                    return (
                      <div key={c.v} className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3">
                        <div className="mb-2 text-xs font-semibold text-[#0D1B2A]">
                          {lang === "sv" ? c.l_sv : c.l_en}
                        </div>
                        <Lbl>{t("which_relative")}</Lbl>
                        <RelativeChecklist
                          value={s.conditions[c.v] ?? ""}
                          onChange={(v) => setConditionRelative(c.v, v)}
                          lang={lang}
                        />
                        {c.ageKind && (
                          <div className="mt-2">
                            <Lbl>{c.ageKind === "stroke" ? t("age_at_first_stroke") : t("age_at_onset")}</Lbl>
                            <input
                              type="number"
                              min={0}
                              max={120}
                              value={s.specifyByCondition[c.v] ?? ""}
                              onChange={(e) => setConditionSpecify(c.v, e.target.value)}
                              onKeyDown={onEnter}
                              className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm focus:border-[#E0A066] focus:outline-none"
                            />
                          </div>
                        )}
                        {c.needsSpecify && (
                          <div className="mt-2">
                            <Txt
                              value={s.specifyByCondition[c.v] ?? ""}
                              onChange={(v) => setConditionSpecify(c.v, v)}
                              placeholder={t("which_condition_ph")}
                              label={t("which_condition")}
                              onKeyDown={onEnter}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}


              <div className="mt-4">
                <button
                  type="button"
                  onClick={toggleNoneOfAbove}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    s.noneOfAbove
                      ? "border-[#E0A066] bg-[#FFF7EE] text-[#8a5a20]"
                      : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:bg-gray-50"
                  }`}
                >
                  {t("none_of_above")}
                </button>
              </div>
            </Section>


            {/* Siblings */}
            <Accordion
              title={t("s_siblings")}
              open={openSiblings}
              onToggle={() => setOpenSiblings((o) => !o)}
            >
              <YesNo
                label={t("has_siblings_q")}
                value={s.has_siblings}
                onChange={(v) => setField("has_siblings", v)}
                yes={t("yes")}
                no={t("no")}
              />
              {s.has_siblings && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Lbl>{t("num_siblings")}</Lbl>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={s.sibling_count}
                      onChange={(e) => setField("sibling_count", e.target.value)}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm focus:border-[#E0A066] focus:outline-none"
                    />
                  </div>
                  <div>
                    <Lbl>{t("sibling_conditions_q")}</Lbl>
                    <textarea
                      value={s.sibling_conditions}
                      onChange={(e) => setField("sibling_conditions", e.target.value)}
                      placeholder={t("sibling_conditions_ph")}
                      rows={3}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm placeholder:text-gray-400 focus:border-[#E0A066] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </Accordion>

            {/* Genetic testing */}
            <Accordion
              title={t("s_genetic")}
              open={openGenetic}
              onToggle={() => setOpenGenetic((o) => !o)}
            >
              <YesNo
                label={t("tested_q")}
                value={s.tested}
                onChange={(v) => setField("tested", v)}
                yes={t("yes")}
                no={t("no")}
              />
              {s.tested && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Lbl>{t("findings_q")}</Lbl>
                    <textarea
                      value={s.findings}
                      onChange={(e) => setField("findings", e.target.value)}
                      placeholder={t("findings_ph")}
                      rows={3}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm placeholder:text-gray-400 focus:border-[#E0A066] focus:outline-none"
                    />
                  </div>
                  <YesNo
                    label={t("counselling_q")}
                    value={s.under_counselling}
                    onChange={(v) => setField("under_counselling", v)}
                    yes={t("yes")}
                    no={t("no")}
                  />
                </div>
              )}
            </Accordion>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-100 bg-white p-4">
        <button
          type="button"
          onClick={async () => {
            bypassGuardRef.current = true;
            const ok = await saveAll();
            if (ok) navigate({ to: "/passport" });
            else bypassGuardRef.current = false;
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

function ParentSection({
  t,
  title,
  dontKnowLabel,
  value,
  confirmed,
  onChange,
  onConfirm,
  onEdit,
  onDelete,
}: {
  t: (k: any) => string;
  title: string;
  dontKnowLabel: string;
  value: ParentState;
  confirmed: boolean;
  onChange: (patch: Partial<ParentState>) => void;
  onConfirm: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onConfirm();
    }
  };

  if (confirmed) {
    const bits: string[] = [];
    if (value.unknown) bits.push(dontKnowLabel);
    else {
      if (value.year_born) bits.push(`${t("year_born")}: ${value.year_born}`);
      if (value.living === "no" && value.age_at_death) bits.push(`${t("age_at_death")}: ${value.age_at_death}`);
      if (value.living === "no" && value.cause_of_death) bits.push(value.cause_of_death);
      if (value.known_conditions) bits.push(value.known_conditions);
    }
    const summary = bits.join(" · ") || "—";
    return (
      <Section title={title}>
        <div className="flex items-start justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3">
          <div className="min-w-0 flex-1 text-sm text-[#0D1B2A]">{summary}</div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Edit"
              onClick={onEdit}
              className="rounded-md p-1.5 text-gray-600 hover:bg-white"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Delete"
              onClick={onDelete}
              className="rounded-md p-1.5 text-gray-600 hover:bg-white"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section title={title}>
      <label className="mb-3 flex cursor-pointer items-center gap-3 text-sm text-[#0D1B2A]">
        <Checkbox
          checked={value.unknown}
          onCheckedChange={(v) => onChange({ unknown: !!v })}
        />
        {dontKnowLabel}
      </label>
      {!value.unknown && (
        <div className="space-y-3">
          <div>
            <Lbl>{t("living")}</Lbl>
            <Pills
              value={value.living}
              onChange={(v) => onChange({ living: v })}
              options={[
                { v: "yes", l: t("yes") },
                { v: "no", l: t("no") },
                { v: "unknown", l: t("unknown") },
              ]}
            />
          </div>
          {value.living === "no" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Lbl>{t("age_at_death")}</Lbl>
                <input
                  type="number"
                  value={value.age_at_death}
                  onChange={(e) => onChange({ age_at_death: e.target.value })}
                  onKeyDown={onEnter}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm focus:border-[#E0A066] focus:outline-none"
                />
              </div>
              <div>
                <Lbl>{t("cause_of_death")}</Lbl>
                <input
                  type="text"
                  value={value.cause_of_death}
                  onChange={(e) => onChange({ cause_of_death: e.target.value })}
                  onKeyDown={onEnter}
                  placeholder={t("cause_ph")}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm placeholder:text-gray-400 focus:border-[#E0A066] focus:outline-none"
                />
              </div>
            </div>
          )}
          {(value.living === "yes" || value.living === "unknown") && (
            <div>
              <Lbl>{t("year_born")}</Lbl>
              <input
                type="number"
                value={value.year_born}
                onChange={(e) => onChange({ year_born: e.target.value })}
                onKeyDown={onEnter}
                placeholder={t("year_born_ph")}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm placeholder:text-gray-400 focus:border-[#E0A066] focus:outline-none"
              />
            </div>
          )}
          <div>
            <Lbl>{t("known_conditions")}</Lbl>
            <textarea
              value={value.known_conditions}
              onChange={(e) => onChange({ known_conditions: e.target.value })}
              onKeyDown={onEnter}
              placeholder={t("known_conditions_ph")}
              rows={3}
              className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm placeholder:text-gray-400 focus:border-[#E0A066] focus:outline-none"
            />
          </div>
        </div>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold text-[#0D1B2A]">{title}</h2>
      {children}
    </section>
  );
}

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="text-sm font-bold text-[#0D1B2A]">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-[#E5E7EB] p-4">{children}</div>}
    </section>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs text-gray-600">{children}</label>;
}

function Txt({
  value,
  onChange,
  placeholder,
  label,
  onKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      {label && <Lbl>{label}</Lbl>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm placeholder:text-gray-400 focus:border-[#E0A066] focus:outline-none"
      />
    </div>
  );
}

function Pills({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
            value === o.v
              ? "border-[#E0A066] bg-[#E0A066] text-white"
              : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:bg-[#F8F9FA]"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function YesNo({
  label,
  value,
  onChange,
  yes,
  no,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  yes: string;
  no: string;
}) {
  return (
    <div>
      <Lbl>{label}</Lbl>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
            value === true
              ? "border-[#E0A066] bg-[#E0A066] text-white"
              : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:bg-[#F8F9FA]"
          }`}
        >
          {yes}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
            value === false
              ? "border-[#E0A066] bg-[#E0A066] text-white"
              : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:bg-[#F8F9FA]"
          }`}
        >
          {no}
        </button>
      </div>
    </div>
  );
}

function AddOtherCondition({
  whichRelativeLabel,
  whichRelativePh: _whichRelativePh,
  whichConditionLabel,
  whichConditionPh,
  buttonLabel,
  disabled,
  onAdd,
  initialName = "",
  initialRelative = "",
  startOpen = false,
  onCancel,
  lang,
}: {
  whichRelativeLabel: string;
  whichRelativePh: string;
  whichConditionLabel: string;
  whichConditionPh: string;
  buttonLabel: string;
  disabled: boolean;
  onAdd: (name: string, relative: string) => void;
  initialName?: string;
  initialRelative?: string;
  startOpen?: boolean;
  onCancel?: () => void;
  lang: Lang;
}) {
  const [open, setOpen] = useState(startOpen);
  const [name, setName] = useState(initialName);
  const [relative, setRelative] = useState(initialRelative);
  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#C4854A] hover:underline disabled:opacity-40"
      >
        + {buttonLabel}
      </button>
    );
  }
  const commit = () => {
    const n = name.trim();
    if (n) onAdd(n, relative.trim());
    if (!startOpen) {
      setName("");
      setRelative("");
      setOpen(false);
    }
  };
  const cancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    setName("");
    setRelative("");
    setOpen(false);
  };
  return (
    <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3 space-y-2">
      <div>
        <label className="mb-1 block text-xs text-gray-600">{whichRelativeLabel}</label>
        <RelativeChecklist value={relative} onChange={setRelative} lang={lang} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-600">{whichConditionLabel}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } if (e.key === "Escape") cancel(); }}
          placeholder={whichConditionPh}
          className="w-full rounded-xl border border-[#E5E7EB] bg-white p-2 text-sm placeholder:text-gray-400 focus:border-[#E0A066] focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={commit}
          className="rounded-xl bg-[#E0A066] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#C4854A]"
        >
          Add
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#0D1B2A] hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
