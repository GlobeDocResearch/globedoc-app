import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLeaveGuard, LeaveDialog } from "./unsaved";

const ACCENT = "#5BB8A8";
const ACCENT_2 = "#3D9A8A";

type State = {
  nothing: boolean;
  tobacco_status: string;
  tobacco_products: string[];
  tobacco_amount: string;
  tobacco_duration: string;
  tobacco_year_stopped: string;
  alcohol_frequency: string;
  alcohol_drinks_per_week: string;
  alcohol_type: string[];
  height_cm: string;
  weight_kg: string;
  exercise_frequency: string;
  exercise_types: string[];
  exercise_other: string;
  exercise_duration: string;
  diet_restrictions: string[];
  diet_other: string;
  sleep_status: string;
  sleep_issues: string[];
  sleep_other: string;
  uses_cpap: boolean | null;
  mental_health_treated: boolean | null;
  mental_health_conditions: string[];
  mental_health_other: string;
  currently_in_treatment: boolean | null;
  treatment_type: string[];
  substances: string[];
  substances_other: string;
};

const initialState: State = {
  nothing: false,
  tobacco_status: "",
  tobacco_products: [],
  tobacco_amount: "",
  tobacco_duration: "",
  tobacco_year_stopped: "",
  alcohol_frequency: "",
  alcohol_drinks_per_week: "",
  alcohol_type: [],
  height_cm: "",
  weight_kg: "",
  exercise_frequency: "",
  exercise_types: [],
  exercise_other: "",
  exercise_duration: "",
  diet_restrictions: [],
  diet_other: "",
  sleep_status: "",
  sleep_issues: [],
  sleep_other: "",
  uses_cpap: null,
  mental_health_treated: null,
  mental_health_conditions: [],
  mental_health_other: "",
  currently_in_treatment: null,
  treatment_type: [],
  substances: [],
  substances_other: "",
};

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: "Lifestyle & Risk",
    subtitle: "Habits that matter clinically",
    nothing: "Nothing to report",
    yes: "Yes",
    no: "No",
    save: "Save",
    saved: "Saved",
    saveError: "Could not save",
    s_tobacco: "Tobacco use",
    tob_never: "Never",
    tob_former: "Former smoker",
    tob_current: "Current smoker",
    tob_product: "Product",
    tob_amount: "Amount",
    tob_duration: "Duration",
    tob_duration_ph: "E.g. 10 years",
    tob_year_stopped: "Year stopped",
    tob_year_stopped_ph: "E.g. 2018",
    amt_lt5: "Less than 5/day",
    amt_5_10: "5–10/day",
    amt_10_20: "10–20/day",
    amt_gt20: "More than 20/day",
    s_alcohol: "Alcohol use",
    alc_never: "Never",
    alc_occ: "Occasionally",
    alc_weekly: "Weekly",
    alc_daily: "Daily",
    alc_drinks: "Standard drinks per week",
    alc_type: "Type",
    alc_beer: "Beer",
    alc_wine: "Wine",
    alc_spirits: "Spirits",
    alc_mixed: "Mixed",
    s_hw: "Height & Weight",
    height: "Height (cm)",
    weight: "Weight (kg)",
    bmi: "BMI",
    bmi_under: "Underweight",
    bmi_normal: "Normal",
    bmi_over: "Overweight",
    bmi_obese: "Obese",
    s_ex: "Exercise",
    ex_freq: "Overall frequency",
    ex_never: "Never",
    ex_1_2: "1–2 times/week",
    ex_3_4: "3–4 times/week",
    ex_5p: "5+ times/week",
    ex_types: "Activity type",
    ex_cardio: "Cardio",
    ex_strength: "Strength training",
    ex_swim: "Swimming",
    ex_yoga: "Yoga/Pilates",
    ex_climb: "Climbing",
    ex_cycle: "Cycling",
    ex_team: "Team sports",
    ex_walk: "Walking/Hiking",
    other: "Other",
    please_specify: "Please specify…",
    please_describe: "Please describe…",
    ex_dur: "Duration per session",
    dur_lt30: "Less than 30 min",
    dur_30_60: "30–60 min",
    dur_gt60: "More than 60 min",
    s_diet: "Diet & nutrition",
    diet_q: "Any dietary requirements or restrictions?",
    diet_none: "No restrictions",
    diet_veg: "Vegetarian",
    diet_vegan: "Vegan",
    diet_gf: "Gluten-free",
    diet_lf: "Lactose-free",
    diet_halal: "Halal",
    diet_kosher: "Kosher",
    diet_keto: "Carnivore/Keto",
    s_sleep: "Sleep",
    sleep_none: "No issues",
    sleep_occ: "Occasional issues",
    sleep_sig: "Significant issues",
    sleep_insomnia: "Insomnia",
    sleep_apnoea: "Sleep apnoea",
    sleep_rls: "Restless legs syndrome",
    sleep_eds: "Excessive daytime sleepiness",
    sleep_cpap: "Do you use CPAP?",
    s_mh: "Mental health",
    mh_note:
      "If you take medication for your mental health, please add it under Medications in your passport.",
    mh_q: "Have you ever been treated for a mental health condition?",
    mh_anx: "Anxiety",
    mh_dep: "Depression",
    mh_bp: "Bipolar disorder",
    mh_ptsd: "PTSD",
    mh_ocd: "OCD",
    mh_ed: "Eating disorder",
    mh_current: "Are you currently under treatment?",
    mh_tt: "Type of treatment",
    mh_med: "Medication",
    mh_therapy: "Therapy/Counselling",
    mh_both: "Both",
    s_sub: "Recreational & self-administered substances",
    sub_q:
      "Do you use any of the following? (This information is confidential and helps your clinician provide safe care)",
    sub_test: "Self-administered testosterone",
    sub_steroids: "Anabolic steroids",
    sub_cannabis: "Cannabis",
    sub_stim: "Stimulants (e.g. ADHD medication unprescribed)",
  },
  sv: {
    title: "Livsstil & Risk",
    subtitle: "Vanor som har klinisk betydelse",
    nothing: "Inget att rapportera",
    yes: "Ja",
    no: "Nej",
    save: "Spara",
    saved: "Sparat",
    saveError: "Kunde inte spara",
    s_tobacco: "Tobaksbruk",
    tob_never: "Aldrig",
    tob_former: "Tidigare rökare",
    tob_current: "Nuvarande rökare",
    tob_product: "Produkt",
    tob_amount: "Mängd",
    tob_duration: "Varaktighet",
    tob_duration_ph: "T.ex. 10 år",
    tob_year_stopped: "Slutade år",
    tob_year_stopped_ph: "T.ex. 2018",
    amt_lt5: "Mindre än 5/dag",
    amt_5_10: "5–10/dag",
    amt_10_20: "10–20/dag",
    amt_gt20: "Mer än 20/dag",
    s_alcohol: "Alkoholbruk",
    alc_never: "Aldrig",
    alc_occ: "Ibland",
    alc_weekly: "Varje vecka",
    alc_daily: "Dagligen",
    alc_drinks: "Standardglas per vecka",
    alc_type: "Typ",
    alc_beer: "Öl",
    alc_wine: "Vin",
    alc_spirits: "Sprit",
    alc_mixed: "Blandat",
    s_hw: "Längd & Vikt",
    height: "Längd (cm)",
    weight: "Vikt (kg)",
    bmi: "BMI",
    bmi_under: "Undervikt",
    bmi_normal: "Normalvikt",
    bmi_over: "Övervikt",
    bmi_obese: "Fetma",
    s_ex: "Träning",
    ex_freq: "Övergripande frekvens",
    ex_never: "Aldrig",
    ex_1_2: "1–2 gånger/vecka",
    ex_3_4: "3–4 gånger/vecka",
    ex_5p: "5+ gånger/vecka",
    ex_types: "Typ av aktivitet",
    ex_cardio: "Kondition",
    ex_strength: "Styrketräning",
    ex_swim: "Simning",
    ex_yoga: "Yoga/Pilates",
    ex_climb: "Klättring",
    ex_cycle: "Cykling",
    ex_team: "Lagsport",
    ex_walk: "Promenad/Vandring",
    other: "Annat",
    please_specify: "Vänligen specificera…",
    please_describe: "Vänligen beskriv…",
    ex_dur: "Längd per pass",
    dur_lt30: "Mindre än 30 min",
    dur_30_60: "30–60 min",
    dur_gt60: "Mer än 60 min",
    s_diet: "Kost & näring",
    diet_q: "Några kostkrav eller restriktioner?",
    diet_none: "Inga restriktioner",
    diet_veg: "Vegetarian",
    diet_vegan: "Vegan",
    diet_gf: "Glutenfri",
    diet_lf: "Laktosfri",
    diet_halal: "Halal",
    diet_kosher: "Kosher",
    diet_keto: "Carnivore/Keto",
    s_sleep: "Sömn",
    sleep_none: "Inga problem",
    sleep_occ: "Tillfälliga problem",
    sleep_sig: "Betydande problem",
    sleep_insomnia: "Sömnlöshet",
    sleep_apnoea: "Sömnapné",
    sleep_rls: "Restless legs",
    sleep_eds: "Onormal trötthet dagtid",
    sleep_cpap: "Använder du CPAP?",
    s_mh: "Psykisk hälsa",
    mh_note:
      "Om du tar medicin för din psykiska hälsa, lägg till den under Mediciner i ditt pass.",
    mh_q: "Har du någonsin behandlats för ett psykiskt tillstånd?",
    mh_anx: "Ångest",
    mh_dep: "Depression",
    mh_bp: "Bipolär sjukdom",
    mh_ptsd: "PTSD",
    mh_ocd: "OCD",
    mh_ed: "Ätstörning",
    mh_current: "Får du behandling just nu?",
    mh_tt: "Typ av behandling",
    mh_med: "Medicinering",
    mh_therapy: "Terapi/Samtalsstöd",
    mh_both: "Båda",
    s_sub: "Rekreations- och självadministrerade substanser",
    sub_q:
      "Använder du något av följande? (Denna information är konfidentiell och hjälper din kliniker att ge säker vård)",
    sub_test: "Självadministrerat testosteron",
    sub_steroids: "Anabola steroider",
    sub_cannabis: "Cannabis",
    sub_stim: "Stimulantia (t.ex. ADHD-medicin utan recept)",
  },
};

export default function LifestyleForm() {
  const { lang } = useI18n();
  const t = (k: keyof typeof T["en"]) => T[lang][k] ?? T.en[k];
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState<State>(initialState);
  const [dirty, setDirty] = useState(false);

  const set = <K extends keyof State>(k: K, v: State[K]) => {
    setS((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };
  const toggleArr = (k: keyof State, val: string) => {
    setS((prev) => {
      const arr = (prev[k] as string[]) || [];
      const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      return { ...prev, [k]: next };
    });
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
      const { data } = await (supabase as any)
        .from("lifestyle_risk")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setS({
          nothing: data.nothing_to_report ?? false,
          tobacco_status: data.tobacco_status ?? "",
          tobacco_products: data.tobacco_products ?? [],
          tobacco_amount: data.tobacco_amount ?? "",
          tobacco_duration: data.tobacco_duration ?? "",
          tobacco_year_stopped: data.tobacco_year_stopped ?? "",
          alcohol_frequency: data.alcohol_frequency ?? "",
          alcohol_drinks_per_week:
            data.alcohol_drinks_per_week != null ? String(data.alcohol_drinks_per_week) : "",
          alcohol_type: Array.isArray(data.alcohol_type) ? data.alcohol_type : (data.alcohol_type ? [data.alcohol_type] : []),
          height_cm: data.height_cm != null ? String(data.height_cm) : "",
          weight_kg: data.weight_kg != null ? String(data.weight_kg) : "",
          exercise_frequency: data.exercise_frequency ?? "",
          exercise_types: data.exercise_types ?? [],
          exercise_other: data.exercise_other ?? "",
          exercise_duration: data.exercise_duration ?? "",
          diet_restrictions: data.diet_restrictions ?? [],
          diet_other: data.diet_other ?? "",
          sleep_status: data.sleep_status ?? "",
          sleep_issues: data.sleep_issues ?? [],
          sleep_other: data.sleep_other ?? "",
          uses_cpap: data.uses_cpap,
          mental_health_treated: data.mental_health_treated,
          mental_health_conditions: data.mental_health_conditions ?? [],
          mental_health_other: data.mental_health_other ?? "",
          currently_in_treatment: data.currently_in_treatment,
          treatment_type: data.treatment_type ?? [],
          substances: data.substances ?? [],
          substances_other: data.substances_other ?? "",
        });
      }
      setLoading(false);
    })();
  }, [navigate]);

  const audit = (action: string) => {
    if (!userId) return;
    supabase.from("audit_log").insert({ user_id: userId, table_name: "lifestyle_risk", action });
  };

  const bmi = useMemo(() => {
    const h = parseFloat(s.height_cm);
    const w = parseFloat(s.weight_kg);
    if (!h || !w || h <= 0) return null;
    const v = w / Math.pow(h / 100, 2);
    if (!isFinite(v)) return null;
    return v;
  }, [s.height_cm, s.weight_kg]);

  const bmiInfo = (() => {
    if (bmi == null) return null;
    if (bmi < 18.5) return { label: t("bmi_under"), color: "#EAB308", bg: "#FEF9C3" };
    if (bmi < 25) return { label: t("bmi_normal"), color: "#16A34A", bg: "#DCFCE7" };
    if (bmi < 30) return { label: t("bmi_over"), color: "#EA580C", bg: "#FFEDD5" };
    return { label: t("bmi_obese"), color: "#DC2626", bg: "#FEE2E2" };
  })();

  const saveAll = async () => {
    if (!userId) return false;
    try {
      const payload: any = {
        user_id: userId,
        nothing_to_report: s.nothing,
        tobacco_status: s.nothing ? null : s.tobacco_status || null,
        tobacco_products: s.nothing ? null : s.tobacco_products,
        tobacco_amount: s.nothing ? null : s.tobacco_amount || null,
        tobacco_duration: s.nothing ? null : s.tobacco_duration || null,
        tobacco_year_stopped: s.nothing ? null : s.tobacco_year_stopped || null,
        alcohol_frequency: s.nothing ? null : s.alcohol_frequency || null,
        alcohol_drinks_per_week:
          s.nothing || !s.alcohol_drinks_per_week
            ? null
            : parseInt(s.alcohol_drinks_per_week, 10),
        alcohol_type: s.nothing ? null : s.alcohol_type,
        height_cm: s.nothing || !s.height_cm ? null : parseFloat(s.height_cm),
        weight_kg: s.nothing || !s.weight_kg ? null : parseFloat(s.weight_kg),
        exercise_frequency: s.nothing ? null : s.exercise_frequency || null,
        exercise_types: s.nothing ? null : s.exercise_types,
        exercise_other: s.nothing ? null : s.exercise_other || null,
        exercise_duration: s.nothing ? null : s.exercise_duration || null,
        diet_restrictions: s.nothing ? null : s.diet_restrictions,
        diet_other: s.nothing ? null : s.diet_other || null,
        sleep_status: s.nothing ? null : s.sleep_status || null,
        sleep_issues: s.nothing ? null : s.sleep_issues,
        sleep_other: s.nothing ? null : s.sleep_other || null,
        uses_cpap: s.nothing ? null : s.uses_cpap,
        mental_health_treated: s.nothing ? null : s.mental_health_treated,
        mental_health_conditions: s.nothing ? null : s.mental_health_conditions,
        mental_health_other: s.nothing ? null : s.mental_health_other || null,
        currently_in_treatment: s.nothing ? null : s.currently_in_treatment,
        treatment_type: s.nothing ? null : s.treatment_type,
        substances: s.nothing ? null : s.substances,
        substances_other: s.nothing ? null : s.substances_other || null,
      };
      const { error } = await (supabase as any)
        .from("lifestyle_risk")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      audit("upsert");
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

  const showTobaccoExtra = s.tobacco_status === "former" || s.tobacco_status === "current";
  const showAlcoholExtra = s.alcohol_frequency && s.alcohol_frequency !== "never";
  const showExerciseExtra = s.exercise_frequency && s.exercise_frequency !== "never";
  const showSleepIssues = s.sleep_status && s.sleep_status !== "none";

  return (
    <div className="min-h-screen bg-white pb-28 text-[#0D1B2A]">
      <header
        className="px-5 pt-6 pb-7"
        style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_2} 100%)` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">🏃</span>
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
          <Switch checked={s.nothing} onCheckedChange={(v) => set("nothing", v)} />
        </div>

        {!s.nothing && (
          <>
            {/* TOBACCO */}
            <Section title={t("s_tobacco")}>
              <Radios
                value={s.tobacco_status}
                onChange={(v) => set("tobacco_status", v)}
                options={[
                  { v: "never", l: t("tob_never") },
                  { v: "former", l: t("tob_former") },
                  { v: "current", l: t("tob_current") },
                ]}
              />
              {showTobaccoExtra && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Lbl>{t("tob_product")}</Lbl>
                    <Chips
                      values={s.tobacco_products}
                      onToggle={(v) => toggleArr("tobacco_products", v)}
                      options={[
                        { v: "cigarettes", l: "Cigarettes" },
                        { v: "snus", l: "Snus" },
                        { v: "vape", l: "Vape/e-cigarette" },
                        { v: "pipe", l: "Pipe" },
                        { v: "cigar", l: "Cigar" },
                      ]}
                    />
                  </div>
                  <div>
                    <Lbl>{t("tob_amount")}</Lbl>
                    <Sel
                      value={s.tobacco_amount}
                      onChange={(v) => set("tobacco_amount", v)}
                      options={[
                        { v: "lt5", l: t("amt_lt5") },
                        { v: "5_10", l: t("amt_5_10") },
                        { v: "10_20", l: t("amt_10_20") },
                        { v: "gt20", l: t("amt_gt20") },
                      ]}
                    />
                  </div>
                  <div>
                    <Lbl>{t("tob_duration")}</Lbl>
                    <Txt
                      value={s.tobacco_duration}
                      onChange={(v) => set("tobacco_duration", v)}
                      placeholder={t("tob_duration_ph")}
                    />
                  </div>
                  {s.tobacco_status === "former" && (
                    <div>
                      <Lbl>{t("tob_year_stopped")}</Lbl>
                      <Txt
                        value={s.tobacco_year_stopped}
                        onChange={(v) => set("tobacco_year_stopped", v)}
                        placeholder={t("tob_year_stopped_ph")}
                      />
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* ALCOHOL */}
            <Section title={t("s_alcohol")}>
              <Radios
                value={s.alcohol_frequency}
                onChange={(v) => set("alcohol_frequency", v)}
                options={[
                  { v: "never", l: t("alc_never") },
                  { v: "occasionally", l: t("alc_occ") },
                  { v: "weekly", l: t("alc_weekly") },
                  { v: "daily", l: t("alc_daily") },
                ]}
              />
              {showAlcoholExtra && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Lbl>{t("alc_drinks")}</Lbl>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={s.alcohol_drinks_per_week}
                      onChange={(e) => set("alcohol_drinks_per_week", e.target.value)}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm focus:border-[#5BB8A8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <Lbl>{t("alc_type")}</Lbl>
                    <Sel
                      value={s.alcohol_type}
                      onChange={(v) => set("alcohol_type", v)}
                      options={[
                        { v: "beer", l: t("alc_beer") },
                        { v: "wine", l: t("alc_wine") },
                        { v: "spirits", l: t("alc_spirits") },
                        { v: "mixed", l: t("alc_mixed") },
                      ]}
                    />
                  </div>
                </div>
              )}
            </Section>

            {/* HEIGHT & WEIGHT */}
            <Section title={t("s_hw")}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Lbl>{t("height")}</Lbl>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={s.height_cm}
                    onChange={(e) => set("height_cm", e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm focus:border-[#5BB8A8] focus:outline-none"
                  />
                </div>
                <div>
                  <Lbl>{t("weight")}</Lbl>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={s.weight_kg}
                    onChange={(e) => set("weight_kg", e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm focus:border-[#5BB8A8] focus:outline-none"
                  />
                </div>
              </div>
              {bmi != null && bmiInfo && (
                <div
                  className="mt-3 rounded-xl p-4"
                  style={{ backgroundColor: bmiInfo.bg }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-[#0D1B2A]/70">{t("bmi")}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: bmiInfo.color }}
                    >
                      {bmiInfo.label}
                    </span>
                  </div>
                  <div
                    className="mt-1 text-3xl font-bold"
                    style={{ color: bmiInfo.color }}
                  >
                    {bmi.toFixed(1)}
                  </div>
                </div>
              )}
            </Section>

            {/* EXERCISE */}
            <Section title={t("s_ex")}>
              <Lbl>{t("ex_freq")}</Lbl>
              <Sel
                value={s.exercise_frequency}
                onChange={(v) => set("exercise_frequency", v)}
                options={[
                  { v: "never", l: t("ex_never") },
                  { v: "1_2", l: t("ex_1_2") },
                  { v: "3_4", l: t("ex_3_4") },
                  { v: "5p", l: t("ex_5p") },
                ]}
              />
              {showExerciseExtra && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Lbl>{t("ex_types")}</Lbl>
                    <Chips
                      values={s.exercise_types}
                      onToggle={(v) => toggleArr("exercise_types", v)}
                      options={[
                        { v: "cardio", l: t("ex_cardio") },
                        { v: "strength", l: t("ex_strength") },
                        { v: "swim", l: t("ex_swim") },
                        { v: "yoga", l: t("ex_yoga") },
                        { v: "climb", l: t("ex_climb") },
                        { v: "cycle", l: t("ex_cycle") },
                        { v: "team", l: t("ex_team") },
                        { v: "walk", l: t("ex_walk") },
                        { v: "other", l: t("other") },
                      ]}
                    />
                    {s.exercise_types.includes("other") && (
                      <div className="mt-2">
                        <Txt
                          value={s.exercise_other}
                          onChange={(v) => set("exercise_other", v)}
                          placeholder={t("please_specify")}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Lbl>{t("ex_dur")}</Lbl>
                    <Sel
                      value={s.exercise_duration}
                      onChange={(v) => set("exercise_duration", v)}
                      options={[
                        { v: "lt30", l: t("dur_lt30") },
                        { v: "30_60", l: t("dur_30_60") },
                        { v: "gt60", l: t("dur_gt60") },
                      ]}
                    />
                  </div>
                </div>
              )}
            </Section>

            {/* DIET */}
            <Section title={t("s_diet")}>
              <Lbl>{t("diet_q")}</Lbl>
              <Chips
                values={s.diet_restrictions}
                onToggle={(v) => toggleArr("diet_restrictions", v)}
                options={[
                  { v: "none", l: t("diet_none") },
                  { v: "veg", l: t("diet_veg") },
                  { v: "vegan", l: t("diet_vegan") },
                  { v: "gf", l: t("diet_gf") },
                  { v: "lf", l: t("diet_lf") },
                  { v: "halal", l: t("diet_halal") },
                  { v: "kosher", l: t("diet_kosher") },
                  { v: "keto", l: t("diet_keto") },
                  { v: "other", l: t("other") },
                ]}
              />
              {s.diet_restrictions.includes("other") && (
                <div className="mt-2">
                  <Txt
                    value={s.diet_other}
                    onChange={(v) => set("diet_other", v)}
                    placeholder={t("please_describe")}
                  />
                </div>
              )}
            </Section>

            {/* SLEEP */}
            <Section title={t("s_sleep")}>
              <Radios
                value={s.sleep_status}
                onChange={(v) => set("sleep_status", v)}
                options={[
                  { v: "none", l: t("sleep_none") },
                  { v: "occasional", l: t("sleep_occ") },
                  { v: "significant", l: t("sleep_sig") },
                ]}
              />
              {showSleepIssues && (
                <div className="mt-3 space-y-2">
                  <CheckList
                    values={s.sleep_issues}
                    onToggle={(v) => toggleArr("sleep_issues", v)}
                    options={[
                      { v: "insomnia", l: t("sleep_insomnia") },
                      { v: "apnoea", l: t("sleep_apnoea") },
                      { v: "rls", l: t("sleep_rls") },
                      { v: "eds", l: t("sleep_eds") },
                      { v: "other", l: t("other") },
                    ]}
                  />
                  {s.sleep_issues.includes("apnoea") && (
                    <div className="rounded-xl bg-[#F8F9FA] p-3">
                      <YesNo
                        label={t("sleep_cpap")}
                        value={s.uses_cpap}
                        onChange={(v) => set("uses_cpap", v)}
                        yes={t("yes")}
                        no={t("no")}
                      />
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* MENTAL HEALTH */}
            <Section title={t("s_mh")}>
              <p className="mb-3 rounded-lg bg-[#F8F9FA] p-3 text-xs text-gray-600">{t("mh_note")}</p>
              <YesNo
                label={t("mh_q")}
                value={s.mental_health_treated}
                onChange={(v) => set("mental_health_treated", v)}
                yes={t("yes")}
                no={t("no")}
              />
              {s.mental_health_treated && (
                <div className="mt-3 space-y-3">
                  <CheckList
                    values={s.mental_health_conditions}
                    onToggle={(v) => toggleArr("mental_health_conditions", v)}
                    options={[
                      { v: "anxiety", l: t("mh_anx") },
                      { v: "depression", l: t("mh_dep") },
                      { v: "bipolar", l: t("mh_bp") },
                      { v: "ptsd", l: t("mh_ptsd") },
                      { v: "ocd", l: t("mh_ocd") },
                      { v: "eating", l: t("mh_ed") },
                      { v: "other", l: t("other") },
                    ]}
                  />
                  {s.mental_health_conditions.includes("other") && (
                    <Txt
                      value={s.mental_health_other}
                      onChange={(v) => set("mental_health_other", v)}
                      placeholder={t("please_specify")}
                    />
                  )}
                  <YesNo
                    label={t("mh_current")}
                    value={s.currently_in_treatment}
                    onChange={(v) => set("currently_in_treatment", v)}
                    yes={t("yes")}
                    no={t("no")}
                  />
                  {s.currently_in_treatment && (
                    <div>
                      <Lbl>{t("mh_tt")}</Lbl>
                      <Chips
                        values={s.treatment_type}
                        onToggle={(v) => toggleArr("treatment_type", v)}
                        options={[
                          { v: "medication", l: t("mh_med") },
                          { v: "therapy", l: t("mh_therapy") },
                          { v: "both", l: t("mh_both") },
                        ]}
                      />
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* SUBSTANCES */}
            <Section title={t("s_sub")}>
              <p className="mb-3 text-xs text-gray-600">{t("sub_q")}</p>
              <CheckList
                values={s.substances}
                onToggle={(v) => toggleArr("substances", v)}
                options={[
                  { v: "testosterone", l: t("sub_test") },
                  { v: "steroids", l: t("sub_steroids") },
                  { v: "cannabis", l: t("sub_cannabis") },
                  { v: "stimulants", l: t("sub_stim") },
                  { v: "other", l: t("other") },
                ]}
              />
              {s.substances.includes("other") && (
                <div className="mt-2">
                  <Txt
                    value={s.substances_other}
                    onChange={(v) => set("substances_other", v)}
                    placeholder={t("please_specify")}
                  />
                </div>
              )}
            </Section>
          </>
        )}
      </div>

      {/* Save button */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-100 bg-white p-4">
        <button
          type="button"
          onClick={saveAll}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold text-[#0D1B2A]">{title}</h2>
      {children}
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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm placeholder:text-gray-400 focus:border-[#5BB8A8] focus:outline-none"
    />
  );
}

function Sel({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm focus:border-[#5BB8A8] focus:outline-none"
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  );
}

function Radios({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => (
        <label
          key={o.v}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
            value === o.v
              ? "border-[#5BB8A8] bg-[#5BB8A8]/5"
              : "border-[#E5E7EB] bg-white hover:bg-[#F8F9FA]"
          }`}
        >
          <input
            type="radio"
            checked={value === o.v}
            onChange={() => onChange(o.v)}
            className="h-4 w-4 accent-[#5BB8A8]"
          />
          <span>{o.l}</span>
        </label>
      ))}
    </div>
  );
}

function Chips({
  values,
  onToggle,
  options,
}: {
  values: string[];
  onToggle: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = values.includes(o.v);
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onToggle(o.v)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              on
                ? "border-[#5BB8A8] bg-[#5BB8A8] text-white"
                : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:bg-[#F8F9FA]"
            }`}
          >
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

function CheckList({
  values,
  onToggle,
  options,
}: {
  values: string[];
  onToggle: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <label key={o.v} className="flex cursor-pointer items-center gap-3 text-sm text-[#0D1B2A]">
          <Checkbox
            checked={values.includes(o.v)}
            onCheckedChange={() => onToggle(o.v)}
          />
          {o.l}
        </label>
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
              ? "border-[#5BB8A8] bg-[#5BB8A8] text-white"
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
              ? "border-[#5BB8A8] bg-[#5BB8A8] text-white"
              : "border-[#E5E7EB] bg-white text-[#0D1B2A] hover:bg-[#F8F9FA]"
          }`}
        >
          {no}
        </button>
      </div>
    </div>
  );
}
