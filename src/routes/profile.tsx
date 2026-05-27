import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LogOut, Home as HomeIcon, Globe, FileText, Link as LinkIcon, User, Pencil, Shield, Download, FileJson, FileText as FileTextIcon, Eye, AlertTriangle } from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { CountrySelect, profileInput as input } from "@/components/PassportSetupModal";
import { BLOOD_GROUPS } from "@/lib/countries";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — GlobeDoc" }] }),
  component: ProfilePage,
});

type Profile = {
  first_name: string | null; last_name: string | null;
  date_of_birth: string | null; biological_sex: string | null;
  nationality: string | null; country_of_residence: string | null;
  phone: string | null; address: string | null; blood_group: string | null;
  language: string | null;
};

const T = {
  en: {
    title: "Profile", personal: "Personal Information",
    firstName: "First name", lastName: "Last name", dob: "Date of birth",
    sex: "Biological sex", male: "Male", female: "Female", other: "Other",
    nationality: "Nationality / country of origin", residence: "Country of residence",
    phone: "Phone number", address: "Address", blood: "Blood group", optional: "Optional",
    save: "Save", cancel: "Cancel", saved: "Profile saved",
    account: "Account", email: "Email address", changePwd: "Change password", changePwdBtn: "Send reset email", resetSent: "Reset email sent",
    settings: "Settings", appLang: "App Language",
    privacy: "Privacy & Data", privacySub: "GDPR — your rights over your health data",
    exportTitle: "Export my data", exportSub: "Download a complete copy of your health passport",
    consentTitle: "My consent record", consentSub: "See what you consented to and when", view: "View",
    legalTitle: "Legal & Privacy Policy", legalSub: "Terms of Service, GDPR policy, Data Security", open: "Open",
    deleteTitle: "Delete my account", deleteSub: "Permanently erase all your data (GDPR Art. 17)", del: "Delete",
    signOut: "Sign out",
    deleteConfirm: "This will permanently delete your account and all health data. This cannot be undone.",
    consentRecord: "Consent record", close: "Close",
    termsAccepted: "Terms of Service accepted", healthAccepted: "Health data processing accepted",
    notRecorded: "Accepted during account creation — exact time not recorded",
    select: "Select…",
  },
  sv: {
    title: "Profil", personal: "Personlig information",
    firstName: "Förnamn", lastName: "Efternamn", dob: "Födelsedatum",
    sex: "Biologiskt kön", male: "Man", female: "Kvinna", other: "Annat",
    nationality: "Nationalitet / ursprungsland", residence: "Bosättningsland",
    phone: "Telefonnummer", address: "Adress", blood: "Blodgrupp", optional: "Valfritt",
    save: "Spara", cancel: "Avbryt", saved: "Profil sparad",
    account: "Konto", email: "E-postadress", changePwd: "Ändra lösenord", changePwdBtn: "Skicka återställning", resetSent: "Återställningsmejl skickat",
    settings: "Inställningar", appLang: "Språk",
    privacy: "Integritet & data", privacySub: "GDPR — dina rättigheter över dina hälsodata",
    exportTitle: "Exportera mina data", exportSub: "Ladda ner en komplett kopia av ditt hälsopass",
    consentTitle: "Mitt samtycke", consentSub: "Se vad du har samtyckt till och när", view: "Visa",
    legalTitle: "Juridik & integritetspolicy", legalSub: "Användarvillkor, GDPR, datasäkerhet", open: "Öppna",
    deleteTitle: "Radera mitt konto", deleteSub: "Radera alla data permanent (GDPR Art. 17)", del: "Radera",
    signOut: "Logga ut",
    deleteConfirm: "Detta raderar permanent ditt konto och alla hälsodata. Det går inte att ångra.",
    consentRecord: "Samtycke", close: "Stäng",
    termsAccepted: "Användarvillkor accepterade", healthAccepted: "Hälsodatabehandling accepterad",
    notRecorded: "Accepterat vid kontoregistrering — exakt tid ej registrerad",
    select: "Välj…",
  },
};

function ProfilePage() {
  const { lang, setLang } = useI18n();
  const t = T[lang];
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consent, setConsent] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/login" }); return; }
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setProfile(data as any);
    })();
  }, [navigate]);

  const startEdit = () => { setDraft(profile); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setDraft(null); };

  const save = async () => {
    if (!draft) return;
    const payload: any = { ...draft };
    Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
    delete payload.language;
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    await supabase.from("audit_log").insert({ user_id: userId, table_name: "profiles", action: "update" });
    setProfile(draft); setEditing(false); setDraft(null);
    toast.success(t.saved);
  };

  const updateDraft = <K extends keyof Profile>(k: K, v: Profile[K]) => setDraft((p) => p ? { ...p, [k]: v } : p);

  const sendReset = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) toast.error(error.message); else toast.success(t.resetSent);
  };

  const changeLang = async (l: "en" | "sv") => {
    setLang(l);
    if (userId) await supabase.from("profiles").update({ language: l }).eq("user_id", userId);
  };

  const openConsent = async () => {
    const { data } = await supabase.from("consents").select("*").eq("user_id", userId).maybeSingle();
    setConsent(data); setConsentOpen(true);
  };

  const exportJSON = async () => {
    const tables = ["profiles","medical_conditions","hospital_stays","prescription_medications","otc_supplements","stopped_medications","drug_intolerances","vaccination_records","standard_vaccines","travel_vaccines","vaccination_certificates","consents"] as const;
    const out: Record<string, any> = {};
    for (const tbl of tables) {
      const { data } = await supabase.from(tbl as any).select("*").eq("user_id", userId);
      out[tbl] = data ?? [];
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    downloadBlob(blob, `globedoc-passport-${Date.now()}.json`);
    await supabase.from("audit_log").insert({ user_id: userId, table_name: "profiles", action: "export_json" });
  };

  const exportPDF = async () => {
    const doc = new jsPDF();
    let y = 14;
    doc.setFontSize(16); doc.text("GlobeDoc Health Passport", 14, y); y += 8;
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y); y += 8;
    const add = (label: string, val?: string | null) => {
      doc.setFontSize(10); doc.text(`${label}: ${val ?? "—"}`, 14, y); y += 6;
      if (y > 280) { doc.addPage(); y = 14; }
    };
    const section = (s: string) => {
      y += 2; doc.setFontSize(12); doc.setFont(undefined as any, "bold"); doc.text(s, 14, y);
      doc.setFont(undefined as any, "normal"); y += 6;
      if (y > 280) { doc.addPage(); y = 14; }
    };
    section("Personal");
    add("Name", `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`);
    add("DOB", profile?.date_of_birth);
    add("Sex", profile?.biological_sex);
    add("Nationality", profile?.nationality);
    add("Residence", profile?.country_of_residence);
    add("Phone", profile?.phone);
    add("Address", profile?.address);
    add("Blood group", profile?.blood_group);

    const fetchAll = async (tbl: string) => (await supabase.from(tbl as any).select("*").eq("user_id", userId)).data ?? [];
    const [mc, hs, pm, ot, sm, di, vr, sv, tv, vc] = await Promise.all([
      fetchAll("medical_conditions"), fetchAll("hospital_stays"),
      fetchAll("prescription_medications"), fetchAll("otc_supplements"), fetchAll("stopped_medications"),
      fetchAll("drug_intolerances"),
      fetchAll("vaccination_records"), fetchAll("standard_vaccines"), fetchAll("travel_vaccines"), fetchAll("vaccination_certificates"),
    ]);
    section("Medical Conditions");
    mc.forEach((r: any) => add("•", r.conditions_text));
    section("Hospital Stays");
    hs.forEach((r: any) => add("•", `${r.year ?? ""} ${r.event ?? ""} ${r.hospital_country ?? ""}`));
    section("Prescription Medications");
    pm.forEach((r: any) => add("•", `${r.drug_generic ?? ""} ${r.dose_form ?? ""} ${r.frequency ?? ""}`));
    section("OTC / Supplements");
    ot.forEach((r: any) => add("•", `${r.product ?? ""} ${r.dose ?? ""} ${r.frequency ?? ""}`));
    section("Stopped Medications");
    sm.forEach((r: any) => add("•", `${r.drug_generic ?? ""} ${r.period ?? ""} ${r.reason_stopped ?? ""}`));
    section("Drug Intolerances");
    di.forEach((r: any) => add("•", r.intolerances_text));
    section("Vaccinations");
    vr.forEach((r: any) => add("•", `${r.vaccine ?? ""} ${r.date ?? ""}`));
    sv.filter((r: any) => r.received).forEach((r: any) => add("•", r.vaccine_name));
    tv.forEach((r: any) => add("Travel", `${r.vaccine ?? ""} → ${r.destination ?? ""} ${r.date ?? ""}`));
    vc.forEach((r: any) => add("IHR", r.ihr_card));

    doc.save(`globedoc-passport-${Date.now()}.pdf`);
    await supabase.from("audit_log").insert({ user_id: userId, table_name: "profiles", action: "export_pdf" });
  };

  const deleteAccount = async () => {
    try {
      await deleteMyAccount();
      await supabase.auth.signOut();
      navigate({ to: "/login" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not delete account");
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); };

  const view = editing ? draft : profile;
  const sexLabel = (s?: string | null) => s === "male" ? t.male : s === "female" ? t.female : s === "other" ? t.other : "—";

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <header className="flex items-center justify-between bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="GlobeDoc" className="h-11 w-11" />
          <span className="text-lg font-bold text-[#0D1B2A]">GlobeDoc</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
        <h1 className="text-center text-2xl font-bold text-[#0D1B2A]">{t.title}</h1>

        {/* Personal Information */}
        <Card>
          <div className="flex items-start justify-between">
            <h2 className="text-base font-bold text-[#0D1B2A]">{t.personal}</h2>
            {!editing ? (
              <button onClick={startEdit} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={cancelEdit} className="rounded-md border border-gray-200 px-3 py-1 text-xs">{t.cancel}</button>
                <button onClick={save} className="rounded-md bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white">{t.save}</button>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldRow label={t.firstName} editing={editing} value={view?.first_name}
              edit={<input className={input} value={view?.first_name ?? ""} onChange={(e) => updateDraft("first_name", e.target.value)} />} />
            <FieldRow label={t.lastName} editing={editing} value={view?.last_name}
              edit={<input className={input} value={view?.last_name ?? ""} onChange={(e) => updateDraft("last_name", e.target.value)} />} />
            <FieldRow label={t.dob} required editing={editing} value={view?.date_of_birth}
              edit={<input type="date" className={input} value={view?.date_of_birth ?? ""} onChange={(e) => updateDraft("date_of_birth", e.target.value)} />} />
            <FieldRow label={t.sex} required editing={editing} value={sexLabel(view?.biological_sex)}
              edit={
                <select className={input} value={view?.biological_sex ?? ""} onChange={(e) => updateDraft("biological_sex", e.target.value)}>
                  <option value="">{t.select}</option>
                  <option value="male">{t.male}</option>
                  <option value="female">{t.female}</option>
                  <option value="other">{t.other}</option>
                </select>
              } />
            <FieldRow label={t.nationality} required editing={editing} value={view?.nationality}
              edit={<CountrySelect value={view?.nationality ?? ""} onChange={(v) => updateDraft("nationality", v)} placeholder={t.select} />} />
            <FieldRow label={t.residence} editing={editing} value={view?.country_of_residence}
              edit={<CountrySelect value={view?.country_of_residence ?? ""} onChange={(v) => updateDraft("country_of_residence", v)} placeholder={t.select} />} />
            <FieldRow label={t.phone} editing={editing} value={view?.phone}
              edit={<input className={input} placeholder="+46 …" value={view?.phone ?? ""} onChange={(e) => updateDraft("phone", e.target.value)} />} />
            <FieldRow label={t.address} editing={editing} value={view?.address}
              edit={<input className={input} value={view?.address ?? ""} onChange={(e) => updateDraft("address", e.target.value)} />} />
            <FieldRow label={`${t.blood} (${t.optional})`} editing={editing} value={view?.blood_group}
              edit={
                <select className={input} value={view?.blood_group ?? ""} onChange={(e) => updateDraft("blood_group", e.target.value)}>
                  <option value="">{t.select}</option>
                  {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              } />
          </div>
        </Card>

        {/* Account */}
        <Card>
          <h2 className="text-base font-bold text-[#0D1B2A]">{t.account}</h2>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs text-gray-500">{t.email}</p>
              <p className="text-sm text-[#0D1B2A]">{email}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#0D1B2A]">{t.changePwd}</p>
              <button onClick={sendReset} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#2563EB]">{t.changePwdBtn}</button>
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card>
          <h2 className="text-base font-bold text-[#0D1B2A]">{t.settings}</h2>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-[#0D1B2A]">{t.appLang}</p>
            <div className="flex overflow-hidden rounded-full border border-gray-200">
              <button onClick={() => changeLang("en")} className={`px-3 py-1 text-xs ${lang === "en" ? "bg-[#2563EB] text-white" : "bg-white text-gray-600"}`}>English</button>
              <button onClick={() => changeLang("sv")} className={`px-3 py-1 text-xs ${lang === "sv" ? "bg-[#2563EB] text-white" : "bg-white text-gray-600"}`}>Svenska</button>
            </div>
          </div>
        </Card>

        {/* Privacy */}
        <Card>
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-[#2563EB]" />
            <div>
              <h2 className="text-base font-bold text-[#0D1B2A]">{t.privacy}</h2>
              <p className="text-xs text-gray-500">{t.privacySub}</p>
            </div>
          </div>
          <div className="mt-4 divide-y divide-gray-100">
            <PrivacyRow icon={<Download className="h-4 w-4" />} title={t.exportTitle} subtitle={t.exportSub}
              action={
                <div className="flex gap-2">
                  <button onClick={exportPDF} className="inline-flex items-center gap-1 rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white"><FileTextIcon className="h-3 w-3" /> PDF</button>
                  <button onClick={exportJSON} className="inline-flex items-center gap-1 rounded-md border border-[#2563EB] px-3 py-1.5 text-xs font-semibold text-[#2563EB]"><FileJson className="h-3 w-3" /> JSON</button>
                </div>
              } />
            <PrivacyRow icon={<Eye className="h-4 w-4" />} title={t.consentTitle} subtitle={t.consentSub}
              action={<button onClick={openConsent} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium">{t.view}</button>} />
            <PrivacyRow icon={<FileText className="h-4 w-4" />} title={t.legalTitle} subtitle={t.legalSub}
              action={<Link to="/legal" className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium">{t.open}</Link>} />
            <PrivacyRow icon={<AlertTriangle className="h-4 w-4 text-red-600" />} title={<span className="text-red-600">{t.deleteTitle}</span>} subtitle={t.deleteSub}
              action={<button onClick={() => setDeleteOpen(true)} className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">{t.del}</button>} />
          </div>
        </Card>

        <button onClick={handleSignOut} className="w-full rounded-full border border-red-500 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">
          <LogOut className="mr-2 inline h-4 w-4" />{t.signOut}
        </button>
      </main>

      {/* Consent modal */}
      {consentOpen && (
        <Modal onClose={() => setConsentOpen(false)} title={t.consentRecord} closeLabel={t.close}>
          <div className="space-y-2 text-sm">
            <p><b>{t.termsAccepted}:</b> {consent?.terms_accepted_at ? formatConsentDate(consent.terms_accepted_at, lang) : t.notRecorded}</p>
            <p><b>{t.healthAccepted}:</b> {consent?.health_data_accepted_at ? formatConsentDate(consent.health_data_accepted_at, lang) : t.notRecorded}</p>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteOpen && (
        <Modal onClose={() => setDeleteOpen(false)} title={t.deleteTitle} closeLabel={t.cancel}>
          <p className="text-sm text-gray-700">{t.deleteConfirm}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setDeleteOpen(false)} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs">{t.cancel}</button>
            <button onClick={deleteAccount} className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">{t.del}</button>
          </div>
        </Modal>
      )}

      <BottomNav />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl bg-white p-5 shadow-sm">{children}</section>;
}

function FieldRow({ label, value, editing, edit, required }: { label: string; value?: string | null; editing: boolean; edit: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-500">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </p>
      {editing ? edit : <p className="text-sm text-[#0D1B2A]">{value || "—"}</p>}
    </div>
  );
}

function PrivacyRow({ icon, title, subtitle, action }: { icon: React.ReactNode; title: React.ReactNode; subtitle: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-gray-500">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-[#0D1B2A]">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div>{action}</div>
    </div>
  );
}

function Modal({ children, onClose, title, closeLabel }: { children: React.ReactNode; onClose: () => void; title: string; closeLabel: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0D1B2A]">{title}</h3>
          <button onClick={onClose} className="text-xs text-gray-500">{closeLabel}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function formatConsentDate(iso: string, lang: "en" | "sv") {
  const d = new Date(iso);
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const date = d.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date}, ${time}`;
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-100 bg-white">
      <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
        <NavTab to="/home" icon={<HomeIcon className="h-5 w-5" />} label="Home" />
        <NavTab to="/passport" icon={<Globe className="h-5 w-5" />} label="Passport" />
        <NavTab icon={<FileText className="h-5 w-5" />} label="Records" />
        <NavTab to="/pairing" icon={<LinkIcon className="h-5 w-5" />} label="Pairing" />
        <NavTab to="/profile" icon={<User className="h-5 w-5" />} label="Profile" active />
      </ul>
    </nav>
  );
}
function NavTab({ icon, label, active, to }: { icon: React.ReactNode; label: string; active?: boolean; to?: "/home" | "/passport" | "/pairing" | "/profile" }) {
  const className = `flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-medium ${active ? "bg-blue-50 text-[#2563EB]" : "text-gray-500"}`;
  return (
    <li>
      {to ? <Link to={to} className={className}>{icon}<span>{label}</span></Link>
          : <button type="button" className={className}>{icon}<span>{label}</span></button>}
    </li>
  );
}
