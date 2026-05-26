import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X, Pencil, Trash2, Plus, Check, ChevronDown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const ACCENT = "#9B7FD4";
const ACCENT_2 = "#7B5FB4";

type VaxDef = { name: string; descEn: string; descSv: string };
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
  { name: "Influenza", descEn: "Seasonal flu", descSv: "Säsongsinfluensa" },
  { name: "Covid-19 primary series", descEn: "Initial COVID-19 vaccination", descSv: "Inledande covid-19-vaccination" },
  { name: "Covid-19 booster(s)", descEn: "Follow-up COVID-19 doses", descSv: "Uppföljande covid-19-doser" },
  { name: "Yellow fever", descEn: "Required for entry to some countries", descSv: "Krävs för inresa till vissa länder" },
  { name: "Typhoid", descEn: "Common in parts of Asia, Africa & Latin America", descSv: "Vanlig i delar av Asien, Afrika & Latinamerika" },
  { name: "Japanese encephalitis", descEn: "Mosquito-borne, risk in rural Asia", descSv: "Myggburen, risk på landsbygden i Asien" },
  { name: "Rabies (pre-exposure)", descEn: "For travellers to high-risk areas", descSv: "För resenärer till högriskområden" },
  { name: "Cholera (Dukoral)", descEn: "Also protects against traveller's diarrhoea", descSv: "Skyddar även mot turistdiarré" },
  { name: "TBE", descEn: "Tick-borne encephalitis", descSv: "Fästingburen hjärninflammation" },
  { name: "BCG", descEn: "Tuberculosis", descSv: "Tuberkulos" },
  { name: "Other", descEn: "specify in text field", descSv: "ange i textfältet" },
];

type Record_ = { id: string; vaccine: string; date: string; batch_number: string; provider: string; collapsed: boolean; persisted: boolean };
type Travel = { id: string; vaccine: string; date: string; destination: string; valid_until: string; collapsed: boolean; persisted: boolean };

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
    f_travel_vax_ph: "E.g. Yellow fever",
    f_travel_date_ph: "E.g. 2022-01-10",
    f_destination: "Destination",
    f_destination_ph: "E.g. Brazil",
    f_valid: "Valid until",
    f_valid_ph: "E.g. 2032-01-10",
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
    valid_until_prefix: "Valid until",
    other_ph: "Please specify…",
    autofilled: "Auto-filled from your profile",
    help_sweden: (y: string) => `Based on the Swedish vaccination programme for someone born in ${y}. Pre-checked vaccines reflect what was standard when you were born — adjust if needed.`,
    help_other: "Tick the vaccines you have received. We don't have pre-selections for your country of origin — please check your vaccination records.",
    help_none: "Complete your profile to get personalised vaccine suggestions.",
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
    f_travel_vax_ph: "T.ex. Gula febern",
    f_travel_date_ph: "T.ex. 2022-01-10",
    f_destination: "Destination",
    f_destination_ph: "T.ex. Brasilien",
    f_valid: "Giltigt till",
    f_valid_ph: "T.ex. 2032-01-10",
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
    valid_until_prefix: "Giltigt till",
    other_ph: "Vänligen specificera…",
    autofilled: "Automatiskt ifyllt från din profil",
    help_sweden: (y: string) => `Baserat på svenska vaccinationsprogrammet för någon född ${y}. Förkryssade vaccin speglar det som var standard när du föddes — justera vid behov.`,
    help_other: "Bocka i de vaccin du fått. Vi har inga förval för ditt ursprungsland — kontrollera dina vaccinationsuppgifter.",
    help_none: "Komplettera din profil för att få personliga vaccinförslag.",
  },
};

export default function VaccinationsForm() {
  const { lang } = useI18n();
  const t = (k: keyof typeof T["en"]) => T[lang][k] ?? T.en[k];
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [nothing, setNothing] = useState(false);
  const [records, setRecords] = useState<Record_[]>([]);
  const [standard, setStandard] = useState<Record<string, boolean>>({});
  const [travel, setTravel] = useState<Travel[]>([]);
  const [ihr, setIhr] = useState<string>("");
  const [contra, setContra] = useState("");
  const [otherText, setOtherText] = useState("");

  const [travelOpen, setTravelOpen] = useState(false);
  const [certsOpen, setCertsOpen] = useState(false);

  const [nationality, setNationality] = useState<string | null>(null);
  const [birthYear, setBirthYear] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(user.id);
      const sb = supabase as any;
      const [vr, sv, tv, vc, prof] = await Promise.all([
        sb.from("vaccination_records").select("*").eq("user_id", user.id).order("created_at"),
        sb.from("standard_vaccines").select("*").eq("user_id", user.id),
        sb.from("travel_vaccines").select("*").eq("user_id", user.id).order("created_at"),
        sb.from("vaccination_certificates").select("*").eq("user_id", user.id).maybeSingle(),
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
      if (tv.data) setTravel(tv.data.map((r: any) => ({
        id: r.id, vaccine: r.vaccine ?? "", date: r.date ?? "", destination: r.destination ?? "",
        valid_until: r.valid_until ?? "", collapsed: true, persisted: true,
      })));
      if (vc.data) {
        setIhr(vc.data.ihr_card ?? "");
        setContra(vc.data.contraindication_notes ?? "");
        setNothing(!!vc.data.nothing_to_report);
        setOtherText(vc.data.other_vaccine_text ?? "");
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

  const upsertCert = async (patch: Partial<{ ihr_card: string; contraindication_notes: string; nothing_to_report: boolean; other_vaccine_text: string }>) => {
    if (!userId) return;
    await sb.from("vaccination_certificates").upsert(
      { user_id: userId, ihr_card: ihr, contraindication_notes: contra, nothing_to_report: nothing, other_vaccine_text: otherText, ...patch },
      { onConflict: "user_id" },
    );
    audit("vaccination_certificates", "upsert");
  };

  const toggleStandard = async (name: string, checked: boolean) => {
    setStandard((s) => ({ ...s, [name]: checked }));
    if (!userId) return;
    await sb.from("standard_vaccines").upsert(
      { user_id: userId, vaccine_name: name, received: checked },
      { onConflict: "user_id,vaccine_name" },
    );
    audit("standard_vaccines", "upsert");
  };

  const addRecord = () => setRecords((s) => [...s, { id: crypto.randomUUID(), vaccine: "", date: "", batch_number: "", provider: "", collapsed: false, persisted: false }]);
  const updateRecord = (id: string, p: Partial<Record_>) => setRecords((s) => s.map((x) => x.id === id ? { ...x, ...p } : x));
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
  };
  const deleteRecord = async (item: Record_) => {
    if (item.persisted) { await sb.from("vaccination_records").delete().eq("id", item.id); audit("vaccination_records", "delete"); }
    setRecords((s) => s.filter((x) => x.id !== item.id));
  };

  const addTravel = () => setTravel((s) => [...s, { id: crypto.randomUUID(), vaccine: "", date: "", destination: "", valid_until: "", collapsed: false, persisted: false }]);
  const updateTravel = (id: string, p: Partial<Travel>) => setTravel((s) => s.map((x) => x.id === id ? { ...x, ...p } : x));
  const saveTravel = async (item: Travel) => {
    if (!userId) return;
    const payload = { vaccine: item.vaccine, date: item.date, destination: item.destination, valid_until: item.valid_until };
    if (item.persisted) {
      await sb.from("travel_vaccines").update(payload).eq("id", item.id);
      audit("travel_vaccines", "update");
      updateTravel(item.id, { collapsed: true });
    } else {
      const { data } = await sb.from("travel_vaccines").insert({ user_id: userId, ...payload }).select().single();
      audit("travel_vaccines", "insert");
      if (data) updateTravel(item.id, { id: data.id, persisted: true, collapsed: true });
    }
  };
  const deleteTravel = async (item: Travel) => {
    if (item.persisted) { await sb.from("travel_vaccines").delete().eq("id", item.id); audit("travel_vaccines", "delete"); }
    setTravel((s) => s.filter((x) => x.id !== item.id));
  };

  const saveAll = async () => {
    try {
      await upsertCert({});
      audit("vaccinations", "save_all");
      toast.success(t("saved"));
      navigate({ to: "/passport" });
    } catch { toast.error(t("saveError")); }
  };

  const isSweden = (nationality ?? "").trim().toLowerCase() === "sweden" || (nationality ?? "").trim().toLowerCase() === "sverige";
  const helpText = useMemo(() => {
    if (!nationality && !birthYear) return T[lang].help_none as string;
    if (isSweden && birthYear) return (T[lang].help_sweden as (y: string) => string)(birthYear);
    return T[lang].help_other as string;
  }, [lang, nationality, birthYear, isSweden]);

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
                    <Field label={t("f_vaccine")} value={item.vaccine} ph={t("f_vaccine_ph")} onChange={(v) => updateRecord(item.id, { vaccine: v })} />
                    <Field label={t("f_date")} value={item.date} ph={t("f_date_ph")} onChange={(v) => updateRecord(item.id, { date: v })} />
                    <Field label={t("f_batch")} value={item.batch_number} ph={t("f_batch_ph")} onChange={(v) => updateRecord(item.id, { batch_number: v })} />
                    <Field label={t("f_provider")} value={item.provider} ph={t("f_provider_ph")} onChange={(v) => updateRecord(item.id, { provider: v })} />
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
                  const isOther = name === "Other";
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
                      {isOther && checked && (
                        <input
                          value={otherText}
                          onChange={(e) => setOtherText(e.target.value)}
                          onBlur={() => upsertCert({ other_vaccine_text: otherText })}
                          placeholder={t("other_ph")}
                          className="mt-2 ml-7 w-[calc(100%-1.75rem)] rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#9B7FD4] focus:outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 3 — Travel vaccines accordion */}
            <Accordion title={t("s3")} open={travelOpen} onToggle={() => setTravelOpen(!travelOpen)}>
              <div className="space-y-3">
                {travel.map((item) => item.collapsed ? (
                  <SummaryRow
                    key={item.id}
                    text={[item.vaccine, item.destination, item.valid_until ? `${t("valid_until_prefix")} ${item.valid_until.split("-")[0]}` : ""].filter(Boolean).join(" · ")}
                    onEdit={() => updateTravel(item.id, { collapsed: false })}
                    onDelete={() => deleteTravel(item)}
                  />
                ) : (
                  <div key={item.id} className="space-y-2 rounded-xl bg-[#F8F9FA] p-4">
                    <Field label={t("f_vaccine")} value={item.vaccine} ph={t("f_travel_vax_ph")} onChange={(v) => updateTravel(item.id, { vaccine: v })} />
                    <Field label={t("f_date")} value={item.date} ph={t("f_travel_date_ph")} onChange={(v) => updateTravel(item.id, { date: v })} />
                    <Field label={t("f_destination")} value={item.destination} ph={t("f_destination_ph")} onChange={(v) => updateTravel(item.id, { destination: v })} />
                    <Field label={t("f_valid")} value={item.valid_until} ph={t("f_valid_ph")} onChange={(v) => updateTravel(item.id, { valid_until: v })} />
                    <CardActions onSave={() => saveTravel(item)} onDelete={() => deleteTravel(item)} saveLabel={t("save_item")} />
                  </div>
                ))}
              </div>
              <AddBtn label={t("add_travel")} onClick={addTravel} />
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
