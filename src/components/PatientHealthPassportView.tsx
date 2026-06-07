import { useMemo } from "react";

type Passport = {
  patient?: {
    name?: string;
    date_of_birth?: string | null;
    biological_sex?: string | null;
    nationality?: string | null;
    blood_group?: string | null;
  };
  medical_history?: {
    summary?: { nothing_to_report?: boolean } | null;
    conditions?: Array<{ id: string; condition_name: string; year?: string | null; is_resolved?: boolean | null; icd11_code?: string | null }>;
    hospital_stays?: Array<{ id: string; event?: string | null; year?: string | null; institution?: string | null; city?: string | null; country?: string | null; diagnosis?: string | null; record_type?: string | null; notes?: string | null }>;
  };
  medications?: {
    prescription?: Array<{ id: string; drug_generic?: string | null; brand_name?: string | null; dose_form?: string | null; frequency?: string | null; prescriber?: string | null; indication?: string | null }>;
    otc?: Array<{ id: string; product?: string | null; dose?: string | null; frequency?: string | null; reason?: string | null }>;
    stopped?: Array<{ id: string; drug_generic?: string | null; dose?: string | null; period?: string | null; reason_stopped?: string | null }>;
    intolerances?: { intolerances_text?: string | null; nothing_to_report?: boolean | null } | null;
  };
  vaccinations?: {
    childhood?: Array<{ id: string; vaccine_name: string; status?: string | null; year_received?: string | null }>;
    travel?: Array<{ id: string; destination?: string | null; vaccine_name: string; date_received?: string | null }>;
    other?: Array<{ id: string; vaccine_name: string; date_received?: string | null }>;
    contraindications?: { contraindication_notes?: string | null; nothing_to_report?: boolean | null } | null;
  };
  lifestyle?: Record<string, any> | null;
  heredity?: {
    summary?: { nothing_to_report?: boolean } | null;
    parents?: Array<{ id: string; parent_type?: string | null; living_status?: string | null; current_age?: number | null; age_at_death?: number | null; cause_of_death?: string | null; known_conditions?: string | null; unknown?: boolean | null }>;
    conditions?: Array<{ id: string; condition_name: string; which_relative?: string | null; other_specify?: string | null }>;
    siblings?: { has_siblings?: boolean | null; sibling_count?: number | null; sibling_conditions?: string | null } | null;
    genetic_testing?: { tested?: boolean | null; findings?: string | null; under_counselling?: boolean | null; dna_tests?: string[] | null } | null;
  };
  allergies?: {
    summary?: { nothing_to_report?: boolean } | null;
    drug?: Array<{ id: string; drug_name: string; reaction?: string | null; severity?: string | null; carry_epipen?: boolean | null }>;
    food?: Array<{ id: string; food_item: string; reaction?: string | null; severity?: string | null; carry_epipen?: boolean | null }>;
    environmental?: Array<{ id: string; allergen: string; reaction?: string | null; severity?: string | null }>;
    contrast?: Array<{ id: string; agent: string; reaction?: string | null; severity?: string | null }>;
    drug_intolerances?: Array<{ id: string; drug_name: string; symptom?: string | null }>;
  };
};

const SECTION_COLORS = {
  history: "#1D3A6B",
  medications: "#0F8BE8",
  vaccinations: "#F5D33A",
  allergies: "#C93535",
  lifestyle: "#64C8F0",
  heredity: "#9E9E9E",
} as const;

const NAV = [
  { id: "history", label: "History", color: SECTION_COLORS.history },
  { id: "medications", label: "Medications", color: SECTION_COLORS.medications },
  { id: "vaccinations", label: "Vaccinations", color: SECTION_COLORS.vaccinations },
  { id: "allergies", label: "Allergies", color: SECTION_COLORS.allergies },
  { id: "lifestyle", label: "Lifestyle", color: SECTION_COLORS.lifestyle },
  { id: "heredity", label: "Heredity", color: SECTION_COLORS.heredity },
];

function formatDob(dob?: string | null): string | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return dob;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return `${d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })} (${age}y)`;
}

function SectionCard({
  id,
  title,
  color,
  darkText,
  children,
  empty,
}: {
  id: string;
  title: string;
  color: string;
  darkText?: boolean;
  empty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl bg-white shadow-sm overflow-hidden">
      <header
        className="px-4 py-3"
        style={{ backgroundColor: color, color: darkText ? "#0D1B2A" : "#fff" }}
      >
        <h2 className="text-sm font-bold uppercase tracking-wide">{title}</h2>
      </header>
      <div className="p-4">
        {empty ? <p className="text-sm text-gray-400 italic">No data recorded.</p> : children}
      </div>
    </section>
  );
}

function Field({ label, value, emphasize }: { label: string; value?: React.ReactNode; emphasize?: boolean }) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <span className={`text-xs uppercase tracking-wide ${emphasize ? "font-bold text-[#C93535]" : "text-gray-500"}`}>
        {label}
      </span>
      <span className="text-sm text-[#0D1B2A]">{value}</span>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-gray-100 py-2 last:border-0">{children}</div>;
}

export function PatientHealthPassportView({ passport }: { passport: Passport }) {
  const p = passport.patient || {};
  const dob = formatDob(p.date_of_birth);

  const history = passport.medical_history;
  const meds = passport.medications;
  const vax = passport.vaccinations;
  const allergies = passport.allergies;
  const lifestyle = passport.lifestyle;
  const heredity = passport.heredity;

  const hasHistory = !!(history?.conditions?.length || history?.hospital_stays?.length);
  const hasMeds = !!(meds?.prescription?.length || meds?.otc?.length || meds?.stopped?.length || meds?.intolerances?.intolerances_text);
  const hasVax = !!(vax?.childhood?.length || vax?.travel?.length || vax?.other?.length || vax?.contraindications?.contraindication_notes);
  const hasAllergies = !!(
    allergies?.drug?.length || allergies?.food?.length || allergies?.environmental?.length ||
    allergies?.contrast?.length || allergies?.drug_intolerances?.length
  );
  const hasLifestyle = !!(lifestyle && Object.entries(lifestyle).some(([k, v]) =>
    !["id","user_id","created_at","updated_at","nothing_to_report"].includes(k) && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
  ));
  const hasHeredity = !!(heredity?.parents?.length || heredity?.conditions?.length ||
    heredity?.siblings?.has_siblings != null || heredity?.genetic_testing?.tested != null);

  const summaryFields = useMemo(() => ([
    { label: "Date of birth", value: dob },
    { label: "Biological sex", value: p.biological_sex },
    { label: "Nationality", value: p.nationality },
    { label: "Blood group", value: p.blood_group },
  ].filter(f => f.value)), [dob, p.biological_sex, p.nationality, p.blood_group]);

  const currentMeds = meds?.prescription || [];

  const lifestyleEntries: Array<[string, string]> = [];
  if (lifestyle) {
    const l = lifestyle as Record<string, any>;
    const push = (label: string, v: any) => {
      if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return;
      lifestyleEntries.push([label, Array.isArray(v) ? v.join(", ") : String(v)]);
    };
    push("Tobacco", l.tobacco_status);
    push("Tobacco products", l.tobacco_products);
    push("Tobacco amount", l.tobacco_amount);
    push("Tobacco duration", l.tobacco_duration);
    push("Stopped tobacco", l.tobacco_year_stopped);
    push("Alcohol", l.alcohol_frequency);
    push("Drinks / week", l.alcohol_drinks_per_week);
    push("Alcohol type", l.alcohol_type);
    push("Height (cm)", l.height_cm);
    push("Weight (kg)", l.weight_kg);
    push("Exercise", l.exercise_frequency);
    push("Exercise types", l.exercise_types);
    push("Diet", l.diet_restrictions);
    push("Sleep", l.sleep_status);
    push("Sleep issues", l.sleep_issues);
    push("Uses CPAP", l.uses_cpap === true ? "Yes" : l.uses_cpap === false ? "No" : null);
    push("Mental health treated", l.mental_health_treated === true ? "Yes" : l.mental_health_treated === false ? "No" : null);
    push("Mental health conditions", l.mental_health_conditions);
    push("In treatment", l.currently_in_treatment === true ? "Yes" : l.currently_in_treatment === false ? "No" : null);
    push("Treatment type", l.treatment_type);
    push("Substances", l.substances);
    push("Narcotics", l.narcotics_status);
  }

  return (
    <div className="space-y-4">
      {/* Patient summary */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-[#0D1B2A]">{p.name || "Patient"}</h2>
        {summaryFields.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400 italic">No demographic data recorded.</p>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-x-4">
            {summaryFields.map(f => (
              <Field key={f.label} label={f.label} value={f.value as string} />
            ))}
          </div>
        )}
      </div>

      {/* Sticky quick nav */}
      <nav className="sticky top-0 z-10 -mx-1 overflow-x-auto rounded-xl bg-white/95 px-1 py-2 shadow-sm backdrop-blur">
        <ul className="flex items-center gap-1 whitespace-nowrap">
          {NAV.map((n, i) => (
            <li key={n.id} className="flex items-center">
              <a
                href={`#${n.id}`}
                className="rounded-full px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                style={{ borderLeft: `3px solid ${n.color}` }}
              >
                {n.label}
              </a>
              {i < NAV.length - 1 && <span className="mx-0.5 text-gray-300">·</span>}
            </li>
          ))}
        </ul>
      </nav>

      {/* History */}
      <SectionCard id="history" title="History" color={SECTION_COLORS.history} empty={!hasHistory}>
        {history?.conditions && history.conditions.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Conditions</p>
            {history.conditions.map(c => (
              <Row key={c.id}>
                <p className="text-sm font-semibold text-[#0D1B2A]">
                  {c.condition_name}
                  {c.is_resolved && <span className="ml-2 text-xs font-normal text-gray-500">· Resolved</span>}
                </p>
                {(c.year || c.icd11_code) && (
                  <p className="text-xs text-gray-500">
                    {[c.year, c.icd11_code && `ICD-11 ${c.icd11_code}`].filter(Boolean).join(" · ")}
                  </p>
                )}
              </Row>
            ))}
          </div>
        )}
        {history?.hospital_stays && history.hospital_stays.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Hospital stays</p>
            {history.hospital_stays.map(h => (
              <Row key={h.id}>
                <p className="text-sm font-semibold text-[#0D1B2A]">{h.event || h.diagnosis || h.record_type || "Hospital stay"}</p>
                <p className="text-xs text-gray-500">
                  {[h.year, [h.institution, h.city, h.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                </p>
                {h.diagnosis && h.event && h.diagnosis !== h.event && (
                  <p className="mt-1 text-xs text-gray-600">Diagnosis: {h.diagnosis}</p>
                )}
                {h.notes && <p className="mt-1 text-xs text-gray-600">{h.notes}</p>}
              </Row>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Medications */}
      <SectionCard id="medications" title="Medications" color={SECTION_COLORS.medications} empty={!hasMeds}>
        {currentMeds.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#0F8BE8]">Current prescriptions</p>
            {currentMeds.map(m => (
              <Row key={m.id}>
                <p className="text-sm font-semibold text-[#0D1B2A]">
                  {m.drug_generic || m.brand_name}
                  {m.brand_name && m.drug_generic && <span className="ml-1 font-normal text-gray-500">({m.brand_name})</span>}
                </p>
                <p className="text-xs text-gray-600">
                  {[m.dose_form, m.frequency].filter(Boolean).join(" · ")}
                </p>
                {(m.indication || m.prescriber) && (
                  <p className="text-xs text-gray-500">
                    {[m.indication && `For ${m.indication}`, m.prescriber && `Rx: ${m.prescriber}`].filter(Boolean).join(" · ")}
                  </p>
                )}
              </Row>
            ))}
          </div>
        )}
        {meds?.otc && meds.otc.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">OTC & supplements</p>
            {meds.otc.map(o => (
              <Row key={o.id}>
                <p className="text-sm font-semibold text-[#0D1B2A]">{o.product}</p>
                <p className="text-xs text-gray-600">{[o.dose, o.frequency, o.reason].filter(Boolean).join(" · ")}</p>
              </Row>
            ))}
          </div>
        )}
        {meds?.stopped && meds.stopped.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Stopped medications</p>
            {meds.stopped.map(s => (
              <Row key={s.id}>
                <p className="text-sm font-semibold text-[#0D1B2A]">{s.drug_generic}</p>
                <p className="text-xs text-gray-600">{[s.dose, s.period, s.reason_stopped].filter(Boolean).join(" · ")}</p>
              </Row>
            ))}
          </div>
        )}
        {meds?.intolerances?.intolerances_text && (
          <Field label="Intolerances" value={meds.intolerances.intolerances_text} emphasize />
        )}
      </SectionCard>

      {/* Vaccinations */}
      <SectionCard id="vaccinations" title="Vaccinations" color={SECTION_COLORS.vaccinations} darkText empty={!hasVax}>
        {vax?.childhood && vax.childhood.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Childhood</p>
            {vax.childhood.map(v => (
              <Row key={v.id}>
                <p className="text-sm font-semibold text-[#0D1B2A]">{v.vaccine_name}</p>
                <p className="text-xs text-gray-500">{[v.status, v.year_received].filter(Boolean).join(" · ")}</p>
              </Row>
            ))}
          </div>
        )}
        {vax?.travel && vax.travel.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Travel</p>
            {vax.travel.map(v => (
              <Row key={v.id}>
                <p className="text-sm font-semibold text-[#0D1B2A]">{v.vaccine_name}</p>
                <p className="text-xs text-gray-500">{[v.destination, v.date_received].filter(Boolean).join(" · ")}</p>
              </Row>
            ))}
          </div>
        )}
        {vax?.other && vax.other.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Other</p>
            {vax.other.map(v => (
              <Row key={v.id}>
                <p className="text-sm font-semibold text-[#0D1B2A]">{v.vaccine_name}</p>
                {v.date_received && <p className="text-xs text-gray-500">{v.date_received}</p>}
              </Row>
            ))}
          </div>
        )}
        {vax?.contraindications?.contraindication_notes && (
          <Field label="Contraindications" value={vax.contraindications.contraindication_notes} emphasize />
        )}
      </SectionCard>

      {/* Allergies */}
      <SectionCard id="allergies" title="Allergies" color={SECTION_COLORS.allergies} empty={!hasAllergies}>
        {allergies?.drug && allergies.drug.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#C93535]">Drug allergies</p>
            {allergies.drug.map(a => (
              <Row key={a.id}>
                <p className="text-sm font-bold text-[#0D1B2A]">{a.drug_name}</p>
                <p className="text-xs text-gray-600">
                  {[a.reaction, a.severity && `Severity: ${a.severity}`, a.carry_epipen && "Carries EpiPen"].filter(Boolean).join(" · ")}
                </p>
              </Row>
            ))}
          </div>
        )}
        {allergies?.food && allergies.food.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#C93535]">Food allergies</p>
            {allergies.food.map(a => (
              <Row key={a.id}>
                <p className="text-sm font-bold text-[#0D1B2A]">{a.food_item}</p>
                <p className="text-xs text-gray-600">
                  {[a.reaction, a.severity && `Severity: ${a.severity}`, a.carry_epipen && "Carries EpiPen"].filter(Boolean).join(" · ")}
                </p>
              </Row>
            ))}
          </div>
        )}
        {allergies?.environmental && allergies.environmental.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Environmental</p>
            {allergies.environmental.map(a => (
              <Row key={a.id}>
                <p className="text-sm font-semibold text-[#0D1B2A]">{a.allergen}</p>
                <p className="text-xs text-gray-600">{[a.reaction, a.severity && `Severity: ${a.severity}`].filter(Boolean).join(" · ")}</p>
              </Row>
            ))}
          </div>
        )}
        {allergies?.contrast && allergies.contrast.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Contrast agents</p>
            {allergies.contrast.map(a => (
              <Row key={a.id}>
                <p className="text-sm font-semibold text-[#0D1B2A]">{a.agent}</p>
                <p className="text-xs text-gray-600">{[a.reaction, a.severity && `Severity: ${a.severity}`].filter(Boolean).join(" · ")}</p>
              </Row>
            ))}
          </div>
        )}
        {allergies?.drug_intolerances && allergies.drug_intolerances.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Drug intolerances</p>
            {allergies.drug_intolerances.map(a => (
              <Row key={a.id}>
                <p className="text-sm font-semibold text-[#0D1B2A]">{a.drug_name}</p>
                {a.symptom && <p className="text-xs text-gray-600">{a.symptom}</p>}
              </Row>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Lifestyle */}
      <SectionCard id="lifestyle" title="Lifestyle" color={SECTION_COLORS.lifestyle} darkText empty={!hasLifestyle}>
        <div className="grid grid-cols-2 gap-x-4">
          {lifestyleEntries.map(([label, value]) => (
            <Field key={label} label={label} value={value} />
          ))}
        </div>
      </SectionCard>

      {/* Heredity */}
      <SectionCard id="heredity" title="Heredity" color={SECTION_COLORS.heredity} empty={!hasHeredity}>
        {heredity?.parents && heredity.parents.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Parents</p>
            {heredity.parents.map(pa => (
              <Row key={pa.id}>
                <p className="text-sm font-semibold text-[#0D1B2A] capitalize">{pa.parent_type || "Parent"}</p>
                {pa.unknown ? (
                  <p className="text-xs text-gray-500">Unknown</p>
                ) : (
                  <>
                    <p className="text-xs text-gray-600">
                      {[
                        pa.living_status,
                        pa.current_age && `Age ${pa.current_age}`,
                        pa.age_at_death && `Died age ${pa.age_at_death}`,
                        pa.cause_of_death && `Cause: ${pa.cause_of_death}`,
                      ].filter(Boolean).join(" · ")}
                    </p>
                    {pa.known_conditions && <p className="text-xs text-gray-600">Conditions: {pa.known_conditions}</p>}
                  </>
                )}
              </Row>
            ))}
          </div>
        )}
        {heredity?.conditions && heredity.conditions.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Family conditions</p>
            {heredity.conditions.map(c => (
              <Row key={c.id}>
                <p className="text-sm font-semibold text-[#0D1B2A]">{c.condition_name}</p>
                <p className="text-xs text-gray-500">{[c.which_relative, c.other_specify].filter(Boolean).join(" · ")}</p>
              </Row>
            ))}
          </div>
        )}
        {heredity?.siblings?.has_siblings != null && (
          <Field
            label="Siblings"
            value={
              heredity.siblings.has_siblings
                ? `${heredity.siblings.sibling_count ?? "?"} sibling(s)${heredity.siblings.sibling_conditions ? ` · ${heredity.siblings.sibling_conditions}` : ""}`
                : "None"
            }
          />
        )}
        {heredity?.genetic_testing?.tested != null && (
          <Field
            label="Genetic testing"
            value={
              heredity.genetic_testing.tested
                ? [
                    "Tested",
                    heredity.genetic_testing.dna_tests?.length && heredity.genetic_testing.dna_tests.join(", "),
                    heredity.genetic_testing.findings && `Findings: ${heredity.genetic_testing.findings}`,
                    heredity.genetic_testing.under_counselling && "Under counselling",
                  ].filter(Boolean).join(" · ")
                : "Not tested"
            }
          />
        )}
      </SectionCard>
    </div>
  );
}
