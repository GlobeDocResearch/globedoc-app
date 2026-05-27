import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { COUNTRIES, BLOOD_GROUPS } from "@/lib/countries";
import { toast } from "sonner";
import logo from "@/assets/globedoc-logo.svg";

type Profile = {
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  biological_sex: string | null;
  nationality: string | null;
  country_of_residence: string | null;
  blood_group: string | null;
};

const T = {
  en: {
    title: "Set up your Health Passport",
    subtitle: "This helps us personalise your passport experience",
    firstName: "First name", lastName: "Last name",
    dob: "Date of birth", sex: "Biological sex",
    male: "Male", female: "Female", other: "Other",
    origin: "Country of origin", residence: "Country of residence",
    blood: "Blood group", optional: "Optional",
    step: "Step 1 of 1",
    submit: "Get started", skip: "Skip for now",
    select: "Select…",
    saved: "Profile saved",
  },
  sv: {
    title: "Konfigurera ditt Health Passport",
    subtitle: "Detta hjälper oss att anpassa din passupplevelse",
    firstName: "Förnamn", lastName: "Efternamn",
    dob: "Födelsedatum", sex: "Biologiskt kön",
    male: "Man", female: "Kvinna", other: "Annat",
    origin: "Ursprungsland", residence: "Bosättningsland",
    blood: "Blodgrupp", optional: "Valfritt",
    step: "Steg 1 av 1",
    submit: "Kom igång", skip: "Hoppa över",
    select: "Välj…",
    saved: "Profil sparad",
  },
};

export function PassportSetupModal({
  userId, initial, onDone,
}: {
  userId: string;
  initial: Partial<Profile>;
  onDone: () => void;
}) {
  const { lang } = useI18n();
  const t = T[lang];
  const [f, setF] = useState<Profile>({
    first_name: initial.first_name ?? "",
    last_name: initial.last_name ?? "",
    date_of_birth: initial.date_of_birth ?? "",
    biological_sex: initial.biological_sex ?? "",
    nationality: initial.nationality ?? "",
    country_of_residence: initial.country_of_residence ?? "",
    blood_group: initial.blood_group ?? "",
  });
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof Profile>(k: K, v: Profile[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload: any = { ...f };
    if (!payload.date_of_birth) payload.date_of_birth = null;
    Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", userId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await supabase.from("audit_log").insert({ user_id: userId, table_name: "profiles", action: "setup" });
    toast.success(t.saved);
    onDone();
  };

  const skip = () => { onDone(); };

  const canSubmit = !!f.date_of_birth && !!f.biological_sex && !!f.nationality && !saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-[#0D1B2A] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="h-10 w-10" />
            <div>
              <h2 className="text-lg font-bold">{t.title}</h2>
              <p className="text-xs text-gray-300">{t.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.step}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.firstName}><input className={input} value={f.first_name ?? ""} onChange={(e) => update("first_name", e.target.value)} /></Field>
            <Field label={t.lastName}><input className={input} value={f.last_name ?? ""} onChange={(e) => update("last_name", e.target.value)} /></Field>
            <Field label={`${t.dob} *`}><input type="date" required className={input} value={f.date_of_birth ?? ""} onChange={(e) => update("date_of_birth", e.target.value)} /></Field>
            <Field label={`${t.sex} *`}>
              <select required className={input} value={f.biological_sex ?? ""} onChange={(e) => update("biological_sex", e.target.value)}>
                <option value="">{t.select}</option>
                <option value="male">{t.male}</option>
                <option value="female">{t.female}</option>
                <option value="other">{t.other}</option>
              </select>
            </Field>
            <Field label={t.origin}>
              <CountrySelect value={f.nationality ?? ""} onChange={(v) => update("nationality", v)} placeholder={t.select} />
            </Field>
            <Field label={t.residence}>
              <CountrySelect value={f.country_of_residence ?? ""} onChange={(v) => update("country_of_residence", v)} placeholder={t.select} />
            </Field>
            <Field label={`${t.blood} (${t.optional})`}>
              <select className={input} value={f.blood_group ?? ""} onChange={(e) => update("blood_group", e.target.value)}>
                <option value="">{t.select}</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex flex-col items-center gap-2 pt-2">
            <button onClick={save} disabled={!canSubmit} className="w-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50">
              {t.submit}
            </button>
            <button onClick={skip} className="text-xs text-gray-500 underline">{t.skip}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const input = "w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

export function CountrySelect({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

export const profileInput = input;
