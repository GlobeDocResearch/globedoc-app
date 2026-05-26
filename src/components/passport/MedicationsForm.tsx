import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X, Pencil, Trash2, Plus, Check, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useLeaveGuard, LeaveDialog, CardUnsavedBanner } from "./unsaved";

const ACCENT = "#6BBF8E";
const ACCENT_2 = "#4DA070";

type Rx = { id: string; drug_generic: string; brand_name: string; dose_form: string; frequency: string; prescriber: string; collapsed: boolean; persisted: boolean };
type Otc = { id: string; product: string; dose: string; frequency: string; reason: string; collapsed: boolean; persisted: boolean };
type Stopped = { id: string; drug_generic: string; dose: string; period: string; reason_stopped: string; collapsed: boolean; persisted: boolean };

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: "Medications",
    subtitle: "All current medications & supplements",
    nothing: "Nothing to report",
    s1: "Current prescription medications",
    s2: "Over-the-counter & supplements",
    s3: "Recently stopped medications",
    s4: "Known drug intolerances",
    add_rx: "Add medication",
    add_otc: "Add product",
    add_stopped: "Add stopped medication",
    f_drug: "Drug (generic name)",
    f_drug_ph: "E.g. Metformin",
    f_brand: "Brand name",
    f_brand_ph: "E.g. Glucophage",
    f_dose_form: "Dose & form",
    f_dose_form_ph: "E.g. 500mg tablet",
    f_freq: "Frequency",
    f_freq_ph: "E.g. Twice daily with food",
    f_prescriber: "Prescriber",
    f_prescriber_ph: "E.g. Dr. Andersson, GP",
    f_product: "Product",
    f_product_ph: "E.g. Vitamin D3",
    f_dose: "Dose",
    f_dose_ph: "E.g. 1000 IU",
    f_freq_otc_ph: "E.g. Daily",
    f_reason: "Reason",
    f_reason_ph: "E.g. Bone health",
    f_drug_stopped_ph: "E.g. Atorvastatin",
    f_dose_stopped_ph: "E.g. 20mg",
    f_period: "Period taken",
    f_period_ph: "E.g. 2019–2023",
    f_reason_stopped: "Reason for stopping",
    f_reason_stopped_ph: "E.g. Side effects — muscle pain",
    intolerances_ph: "E.g. NSAIDs → gastric ulcer, Morphine → nausea…",
    save: "Save",
    save_item: "Save",
    saved: "Saved",
    saveError: "Could not save",
    stopped_prefix: "Stopped",
  },
  sv: {
    title: "Mediciner",
    subtitle: "Alla nuvarande mediciner & kosttillskott",
    nothing: "Inget att rapportera",
    s1: "Nuvarande receptbelagda mediciner",
    s2: "Receptfritt & kosttillskott",
    s3: "Nyligen avslutade mediciner",
    s4: "Kända läkemedelsintoleranser",
    add_rx: "Lägg till medicin",
    add_otc: "Lägg till produkt",
    add_stopped: "Lägg till avslutad medicin",
    f_drug: "Läkemedel (generiskt namn)",
    f_drug_ph: "T.ex. Metformin",
    f_brand: "Varumärke",
    f_brand_ph: "T.ex. Glucophage",
    f_dose_form: "Dos & form",
    f_dose_form_ph: "T.ex. 500mg tablett",
    f_freq: "Frekvens",
    f_freq_ph: "T.ex. Två gånger dagligen med mat",
    f_prescriber: "Förskrivare",
    f_prescriber_ph: "T.ex. Dr. Andersson, husläkare",
    f_product: "Produkt",
    f_product_ph: "T.ex. D-vitamin D3",
    f_dose: "Dos",
    f_dose_ph: "T.ex. 1000 IE",
    f_freq_otc_ph: "T.ex. Dagligen",
    f_reason: "Anledning",
    f_reason_ph: "T.ex. Benhälsa",
    f_drug_stopped_ph: "T.ex. Atorvastatin",
    f_dose_stopped_ph: "T.ex. 20mg",
    f_period: "Period",
    f_period_ph: "T.ex. 2019–2023",
    f_reason_stopped: "Anledning till att sluta",
    f_reason_stopped_ph: "T.ex. Biverkningar — muskelsmärta",
    intolerances_ph: "T.ex. NSAID → magsår, Morfin → illamående…",
    save: "Spara",
    save_item: "Spara",
    saved: "Sparat",
    saveError: "Kunde inte spara",
    stopped_prefix: "Avslutad",
  },
};

export default function MedicationsForm() {
  const { lang } = useI18n();
  const t = (k: keyof typeof T["en"]) => T[lang][k] ?? T.en[k];
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [nothing, setNothing] = useState(false);
  const [rx, setRx] = useState<Rx[]>([]);
  const [otc, setOtc] = useState<Otc[]>([]);
  const [stopped, setStopped] = useState<Stopped[]>([]);
  const [intolerances, setIntolerances] = useState("");

  const [otcOpen, setOtcOpen] = useState(false);
  const [stoppedOpen, setStoppedOpen] = useState(false);

  const [dirty, setDirty] = useState(false);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const markDirty = (id: string) => setDirtyIds((s) => { const n = new Set(s); n.add(id); return n; });
  const clearDirty = (id: string) => setDirtyIds((s) => { const n = new Set(s); n.delete(id); return n; });
  const anyDirty = dirty || dirtyIds.size > 0;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(user.id);

      const [pm, ot, sm, di] = await Promise.all([
        supabase.from("prescription_medications").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("otc_supplements").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("stopped_medications").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("drug_intolerances").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (pm.data) setRx(pm.data.map((r: any) => ({
        id: r.id, drug_generic: r.drug_generic ?? "", brand_name: r.brand_name ?? "",
        dose_form: r.dose_form ?? "", frequency: r.frequency ?? "", prescriber: r.prescriber ?? "",
        collapsed: true, persisted: true,
      })));
      if (ot.data) setOtc(ot.data.map((r: any) => ({
        id: r.id, product: r.product ?? "", dose: r.dose ?? "", frequency: r.frequency ?? "",
        reason: r.reason ?? "", collapsed: true, persisted: true,
      })));
      if (sm.data) setStopped(sm.data.map((r: any) => ({
        id: r.id, drug_generic: r.drug_generic ?? "", dose: r.dose ?? "", period: r.period ?? "",
        reason_stopped: r.reason_stopped ?? "", collapsed: true, persisted: true,
      })));
      if (di.data) {
        setIntolerances(di.data.intolerances_text ?? "");
        setNothing(di.data.nothing_to_report ?? false);
      }
      setLoading(false);
    })();
  }, [navigate]);

  const audit = (table: string, action: string) => {
    if (!userId) return;
    supabase.from("audit_log").insert({ user_id: userId, table_name: table, action });
  };

  const saveIntolerances = async () => {
    if (!userId) return;
    await supabase.from("drug_intolerances").upsert(
      { user_id: userId, intolerances_text: intolerances, nothing_to_report: nothing },
      { onConflict: "user_id" },
    );
    audit("drug_intolerances", "upsert");
  };

  // Generic helpers per list
  const addRx = () => setRx((s) => [...s, { id: crypto.randomUUID(), drug_generic: "", brand_name: "", dose_form: "", frequency: "", prescriber: "", collapsed: false, persisted: false }]);
  const updateRx = (id: string, p: Partial<Rx>) => setRx((s) => s.map((x) => x.id === id ? { ...x, ...p } : x));
  const saveRx = async (item: Rx) => {
    if (!userId) return;
    const payload = { drug_generic: item.drug_generic, brand_name: item.brand_name, dose_form: item.dose_form, frequency: item.frequency, prescriber: item.prescriber };
    if (item.persisted) {
      await supabase.from("prescription_medications").update(payload).eq("id", item.id);
      audit("prescription_medications", "update");
      updateRx(item.id, { collapsed: true });
    } else {
      const { data } = await supabase.from("prescription_medications").insert({ user_id: userId, ...payload }).select().single();
      audit("prescription_medications", "insert");
      if (data) updateRx(item.id, { id: data.id, persisted: true, collapsed: true });
    }
  };
  const deleteRx = async (item: Rx) => {
    if (item.persisted) { await supabase.from("prescription_medications").delete().eq("id", item.id); audit("prescription_medications", "delete"); }
    setRx((s) => s.filter((x) => x.id !== item.id));
  };

  const addOtc = () => setOtc((s) => [...s, { id: crypto.randomUUID(), product: "", dose: "", frequency: "", reason: "", collapsed: false, persisted: false }]);
  const updateOtc = (id: string, p: Partial<Otc>) => setOtc((s) => s.map((x) => x.id === id ? { ...x, ...p } : x));
  const saveOtc = async (item: Otc) => {
    if (!userId) return;
    const payload = { product: item.product, dose: item.dose, frequency: item.frequency, reason: item.reason };
    if (item.persisted) {
      await supabase.from("otc_supplements").update(payload).eq("id", item.id);
      audit("otc_supplements", "update");
      updateOtc(item.id, { collapsed: true });
    } else {
      const { data } = await supabase.from("otc_supplements").insert({ user_id: userId, ...payload }).select().single();
      audit("otc_supplements", "insert");
      if (data) updateOtc(item.id, { id: data.id, persisted: true, collapsed: true });
    }
  };
  const deleteOtc = async (item: Otc) => {
    if (item.persisted) { await supabase.from("otc_supplements").delete().eq("id", item.id); audit("otc_supplements", "delete"); }
    setOtc((s) => s.filter((x) => x.id !== item.id));
  };

  const addStopped = () => setStopped((s) => [...s, { id: crypto.randomUUID(), drug_generic: "", dose: "", period: "", reason_stopped: "", collapsed: false, persisted: false }]);
  const updateStopped = (id: string, p: Partial<Stopped>) => setStopped((s) => s.map((x) => x.id === id ? { ...x, ...p } : x));
  const saveStopped = async (item: Stopped) => {
    if (!userId) return;
    const payload = { drug_generic: item.drug_generic, dose: item.dose, period: item.period, reason_stopped: item.reason_stopped };
    if (item.persisted) {
      await supabase.from("stopped_medications").update(payload).eq("id", item.id);
      audit("stopped_medications", "update");
      updateStopped(item.id, { collapsed: true });
    } else {
      const { data } = await supabase.from("stopped_medications").insert({ user_id: userId, ...payload }).select().single();
      audit("stopped_medications", "insert");
      if (data) updateStopped(item.id, { id: data.id, persisted: true, collapsed: true });
    }
  };
  const deleteStopped = async (item: Stopped) => {
    if (item.persisted) { await supabase.from("stopped_medications").delete().eq("id", item.id); audit("stopped_medications", "delete"); }
    setStopped((s) => s.filter((x) => x.id !== item.id));
  };

  const saveAll = async () => {
    if (!userId) return;
    try {
      await saveIntolerances();
      audit("medications", "save_all");
      toast.success(t("saved"));
      navigate({ to: "/passport" });
    } catch { toast.error(t("saveError")); }
  };

  if (loading) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white pb-28 text-[#0D1B2A]">
      <header className="px-5 pt-6 pb-7" style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_2} 100%)` }}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">💊</span>
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
              if (userId) {
                supabase.from("drug_intolerances").upsert(
                  { user_id: userId, intolerances_text: intolerances, nothing_to_report: v },
                  { onConflict: "user_id" },
                ).then(() => audit("drug_intolerances", "toggle_nothing"));
              }
            }}
          />
        </div>

        {!nothing && (
          <>
            {/* Section 1 — prescription */}
            <section>
              <h2 className="mb-2 text-sm font-bold text-[#0D1B2A]">{t("s1")}</h2>
              <div className="space-y-3">
                {rx.map((item) => item.collapsed ? (
                  <SummaryRow key={item.id} text={[item.drug_generic, item.dose_form, item.frequency].filter(Boolean).join(" · ")} onEdit={() => updateRx(item.id, { collapsed: false })} onDelete={() => deleteRx(item)} />
                ) : (
                  <div key={item.id} className="space-y-2 rounded-xl bg-[#F8F9FA] p-4">
                    <Field label={t("f_drug")} value={item.drug_generic} ph={t("f_drug_ph")} onChange={(v) => updateRx(item.id, { drug_generic: v })} />
                    <Field label={t("f_brand")} value={item.brand_name} ph={t("f_brand_ph")} onChange={(v) => updateRx(item.id, { brand_name: v })} />
                    <Field label={t("f_dose_form")} value={item.dose_form} ph={t("f_dose_form_ph")} onChange={(v) => updateRx(item.id, { dose_form: v })} />
                    <Field label={t("f_freq")} value={item.frequency} ph={t("f_freq_ph")} onChange={(v) => updateRx(item.id, { frequency: v })} />
                    <Field label={t("f_prescriber")} value={item.prescriber} ph={t("f_prescriber_ph")} onChange={(v) => updateRx(item.id, { prescriber: v })} />
                    <CardActions onSave={() => saveRx(item)} onDelete={() => deleteRx(item)} saveLabel={t("save_item")} />
                  </div>
                ))}
              </div>
              <AddBtn label={t("add_rx")} onClick={addRx} />
            </section>

            {/* Section 2 — OTC accordion */}
            <Accordion title={t("s2")} open={otcOpen} onToggle={() => setOtcOpen(!otcOpen)}>
              <div className="space-y-3">
                {otc.map((item) => item.collapsed ? (
                  <SummaryRow key={item.id} text={[item.product, item.dose, item.frequency].filter(Boolean).join(" · ")} onEdit={() => updateOtc(item.id, { collapsed: false })} onDelete={() => deleteOtc(item)} />
                ) : (
                  <div key={item.id} className="space-y-2 rounded-xl bg-[#F8F9FA] p-4">
                    <Field label={t("f_product")} value={item.product} ph={t("f_product_ph")} onChange={(v) => updateOtc(item.id, { product: v })} />
                    <Field label={t("f_dose")} value={item.dose} ph={t("f_dose_ph")} onChange={(v) => updateOtc(item.id, { dose: v })} />
                    <Field label={t("f_freq")} value={item.frequency} ph={t("f_freq_otc_ph")} onChange={(v) => updateOtc(item.id, { frequency: v })} />
                    <Field label={t("f_reason")} value={item.reason} ph={t("f_reason_ph")} onChange={(v) => updateOtc(item.id, { reason: v })} />
                    <CardActions onSave={() => saveOtc(item)} onDelete={() => deleteOtc(item)} saveLabel={t("save_item")} />
                  </div>
                ))}
              </div>
              <AddBtn label={t("add_otc")} onClick={addOtc} />
            </Accordion>

            {/* Section 3 — stopped accordion */}
            <Accordion title={t("s3")} open={stoppedOpen} onToggle={() => setStoppedOpen(!stoppedOpen)}>
              <div className="space-y-3">
                {stopped.map((item) => item.collapsed ? (
                  <SummaryRow
                    key={item.id}
                    text={[item.drug_generic, item.dose, item.period ? `${t("stopped_prefix")} ${item.period.split("–").pop()?.trim() ?? item.period}` : ""].filter(Boolean).join(" · ")}
                    onEdit={() => updateStopped(item.id, { collapsed: false })}
                    onDelete={() => deleteStopped(item)}
                  />
                ) : (
                  <div key={item.id} className="space-y-2 rounded-xl bg-[#F8F9FA] p-4">
                    <Field label={t("f_drug")} value={item.drug_generic} ph={t("f_drug_stopped_ph")} onChange={(v) => updateStopped(item.id, { drug_generic: v })} />
                    <Field label={t("f_dose")} value={item.dose} ph={t("f_dose_stopped_ph")} onChange={(v) => updateStopped(item.id, { dose: v })} />
                    <Field label={t("f_period")} value={item.period} ph={t("f_period_ph")} onChange={(v) => updateStopped(item.id, { period: v })} />
                    <Field label={t("f_reason_stopped")} value={item.reason_stopped} ph={t("f_reason_stopped_ph")} onChange={(v) => updateStopped(item.id, { reason_stopped: v })} />
                    <CardActions onSave={() => saveStopped(item)} onDelete={() => deleteStopped(item)} saveLabel={t("save_item")} />
                  </div>
                ))}
              </div>
              <AddBtn label={t("add_stopped")} onClick={addStopped} />
            </Accordion>

            {/* Section 4 — intolerances */}
            <section>
              <h2 className="mb-2 text-sm font-bold text-[#0D1B2A]">{t("s4")}</h2>
              <textarea
                value={intolerances}
                onChange={(e) => setIntolerances(e.target.value)}
                onBlur={saveIntolerances}
                placeholder={t("intolerances_ph")}
                rows={4}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#6BBF8E] focus:outline-none"
              />
            </section>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E5E7EB] bg-white p-4">
        <button
          type="button"
          onClick={saveAll}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6BBF8E] to-[#4DA070] px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
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
        className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#6BBF8E] focus:outline-none"
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
      <button type="button" onClick={onSave} className="rounded-md bg-[#4DA070] px-4 py-2 text-xs font-medium text-white hover:bg-[#3D8F60]">
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
