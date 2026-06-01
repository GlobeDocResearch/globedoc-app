import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LogOut, Home as HomeIcon, Globe, Plane, FileText, Link as LinkIcon, User, Pencil, Shield, Download, FileJson, FileText as FileTextIcon, Eye, AlertTriangle, Camera } from "lucide-react";
import { useRef } from "react";
import logo from "@/assets/globedoc-logo.svg";
import { Hexagon } from "@/components/Hexagon";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { CountrySelect, profileInput as input } from "@/components/PassportSetupModal";
import { BLOOD_GROUPS } from "@/lib/countries";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { deleteMyAccount } from "@/lib/account.functions";
import { BetaSurvey, BetaSurveyCard } from "@/components/BetaSurvey";
import { LanguagePickerRow } from "@/components/LanguagePicker";
import { SaveButton } from "@/components/ui/save-button";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — GlobeDoc" }] }),
  component: ProfilePage,
});

type Profile = {
  first_name: string | null; last_name: string | null;
  date_of_birth: string | null; biological_sex: string | null;
  nationality: string | null; country_of_residence: string | null;
  phone: string | null; address: string | null; blood_group: string | null;
  language: string | null; avatar_url: string | null;
  civic_registration_number: string | null;
};

const T = {
  en: {
    title: "Profile", personal: "Personal Information",
    firstName: "First name", lastName: "Last name", dob: "Date of birth",
    sex: "Biological sex", male: "Male", female: "Female", other: "Other",
    nationality: "Nationality / country of origin", residence: "Country of residence",
    phone: "Phone number", address: "Address", blood: "Blood group", optional: "Optional",
    civic: "Civic registration number", civicPlaceholder: "Personal identity number",
    security: "Security",
    bankid: "Connect BankID", threeFactor: "Three-factor verification", biometric: "Biometric login",
    comingSoon: "Coming Soon",
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
    civic: "Personnummer", civicPlaceholder: "Personnummer",
    security: "Säkerhet",
    bankid: "Anslut BankID", threeFactor: "Trefaktorsautentisering", biometric: "Biometrisk inloggning",
    comingSoon: "Kommer snart",
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: url } as any).eq("user_id", userId);
      if (dbErr) throw dbErr;
      setProfile((p) => p ? { ...p, avatar_url: url } : p);
      toast.success(t.saved);
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
    if (!draft) return false;
    const payload: any = { ...draft };
    Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
    delete payload.language;
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", userId);
    if (error) throw new Error(error.message);
    await supabase.from("audit_log").insert({ user_id: userId, table_name: "profiles", action: "update" });
    setProfile(draft); setEditing(false); setDraft(null);
    toast.success(t.saved);
    return true;
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
    const tables = ["profiles","medical_conditions","hospital_stays","prescription_medications","otc_supplements","stopped_medications","drug_intolerances","childhood_vaccines","travel_vaccines","other_vaccines","vaccination_contraindications","consents"] as const;
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
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const PAGE_W = doc.internal.pageSize.getWidth();
    const PAGE_H = doc.internal.pageSize.getHeight();
    const MARGIN = 14;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const dateStr = new Date().toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
    let y = MARGIN;

    const ensureSpace = (needed: number) => {
      if (y + needed > PAGE_H - 22) { doc.addPage(); y = MARGIN; }
    };

    const drawHeader = () => {
      // Brand bar
      doc.setFillColor(29, 63, 124);
      doc.rect(0, 0, PAGE_W, 26, "F");
      // Hex mark
      doc.setFillColor(255, 255, 255);
      doc.circle(MARGIN + 6, 13, 6, "F");
      doc.setTextColor(29, 63, 124);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("G", MARGIN + 6, 15, { align: "center" });
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("GlobeDoc Health Passport", MARGIN + 16, 13);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(dateStr, MARGIN + 16, 19);
      doc.setTextColor(20, 20, 20);
      y = 34;
    };

    const drawFooters = () => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const fy = PAGE_H - 12;
        doc.setDrawColor(220);
        doc.line(MARGIN, fy - 2, PAGE_W - MARGIN, fy - 2);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(110);
        doc.text(`Generated by GlobeDoc · globedoc.com · ${dateStr}`, MARGIN, fy + 2);
        doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, fy + 2, { align: "right" });
        doc.setFontSize(7);
        doc.setTextColor(140);
        doc.text(
          lang === "sv"
            ? "Detta dokument är endast i informationssyfte och ersätter inte professionell medicinsk rådgivning."
            : "This document is for informational purposes only and does not replace professional medical advice.",
          PAGE_W / 2, fy + 6, { align: "center" }
        );
        doc.setTextColor(20, 20, 20);
      }
    };

    const sectionCard = (title: string, color: [number, number, number], rows: { label?: string; value: string }[]) => {
      if (!rows.length) return;
      const lineH = 5;
      const padX = 4;
      const titleH = 8;
      // Pre-measure card height
      let h = titleH + 4;
      const wrapped = rows.map((r) => {
        const txt = r.label ? `${r.label}: ${r.value}` : `• ${r.value}`;
        const lines = doc.splitTextToSize(txt, CONTENT_W - padX * 2 - 2);
        h += lines.length * lineH;
        return lines;
      });
      h += 3;
      ensureSpace(h);
      // Card border
      doc.setDrawColor(225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(MARGIN, y, CONTENT_W, h, 2, 2, "FD");
      // Colored header strip
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(MARGIN, y, CONTENT_W, titleH, 2, 2, "F");
      doc.rect(MARGIN, y + titleH - 2, CONTENT_W, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(title, MARGIN + padX, y + 5.5);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      let ly = y + titleH + 4;
      wrapped.forEach((lines) => {
        lines.forEach((line: string) => {
          doc.text(line, MARGIN + padX + 1, ly);
          ly += lineH;
        });
      });
      y += h + 4;
    };

    const twoColCard = (title: string, color: [number, number, number], pairs: [string, string][]) => {
      if (!pairs.length) return;
      const lineH = 5.5;
      const padX = 4;
      const titleH = 8;
      const colW = (CONTENT_W - padX * 3) / 2;
      const rows = Math.ceil(pairs.length / 2);
      const h = titleH + 4 + rows * lineH + 3;
      ensureSpace(h);
      doc.setDrawColor(225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(MARGIN, y, CONTENT_W, h, 2, 2, "FD");
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(MARGIN, y, CONTENT_W, titleH, 2, 2, "F");
      doc.rect(MARGIN, y + titleH - 2, CONTENT_W, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(title, MARGIN + padX, y + 5.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      let ly = y + titleH + 4;
      pairs.forEach((p, i) => {
        const col = i % 2;
        const x = MARGIN + padX + col * (colW + padX);
        doc.setTextColor(120);
        doc.text(p[0], x, ly);
        doc.setTextColor(20);
        const valLines = doc.splitTextToSize(p[1], colW);
        doc.setFont("helvetica", "bold");
        doc.text(valLines[0], x + 32, ly);
        doc.setFont("helvetica", "normal");
        if (col === 1 || i === pairs.length - 1) ly += lineH;
      });
      y += h + 4;
    };

    drawHeader();

    // Personal info — two column
    const personal: [string, string][] = [];
    const nm = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
    if (nm) personal.push(["Name", nm]);
    if (profile?.date_of_birth) personal.push(["Date of birth", profile.date_of_birth]);
    if (profile?.biological_sex) personal.push(["Sex", profile.biological_sex]);
    if (profile?.blood_group) personal.push(["Blood group", profile.blood_group]);
    if (profile?.nationality) personal.push(["Nationality", profile.nationality]);
    if (profile?.country_of_residence) personal.push(["Residence", profile.country_of_residence]);
    if (profile?.phone) personal.push(["Phone", profile.phone]);
    if (email) personal.push(["Email", email]);
    if (profile?.address) personal.push(["Address", profile.address]);
    if (profile?.civic_registration_number) personal.push(["Civic ID", profile.civic_registration_number]);
    twoColCard("Personal Information", [29, 63, 124], personal);

    const fetchAll = async (tbl: string) => (await supabase.from(tbl as any).select("*").eq("user_id", userId)).data ?? [];
    const [mc, hs, pm, ot, sm, di, cv, tv, ov, vco, da, fa, ea, lr, hc] = await Promise.all([
      fetchAll("medical_conditions"), fetchAll("hospital_stays"),
      fetchAll("prescription_medications"), fetchAll("otc_supplements"), fetchAll("stopped_medications"),
      fetchAll("drug_intolerances"),
      fetchAll("childhood_vaccines"), fetchAll("travel_vaccines"), fetchAll("other_vaccines"), fetchAll("vaccination_contraindications"),
      fetchAll("drug_allergies"), fetchAll("food_allergies"), fetchAll("environmental_allergies"),
      fetchAll("lifestyle_risk"), fetchAll("heredity_conditions"),
    ]);

    // Dedup helper by normalized lowercase name
    const dedup = <T,>(items: T[], key: (x: T) => string): T[] => {
      const seen = new Map<string, T>();
      items.forEach((it) => {
        const k = key(it).trim().toLowerCase();
        if (!k) return;
        if (!seen.has(k)) seen.set(k, it);
      });
      return Array.from(seen.values());
    };
    const nonEmpty = (s?: string | null) => (s ?? "").trim().length > 0;
    const row = (value: string) => ({ value });

    // Medical History (navy)
    const mhRows: { value: string }[] = [];
    dedup(mc, (r: any) => r.condition_name ?? "").forEach((r: any) => {
      if (!nonEmpty(r.condition_name)) return;
      const tag = r.is_resolved ? " (resolved)" : "";
      mhRows.push(row(`${r.condition_name}${r.year ? ` · ${r.year}` : ""}${tag}`));
    });
    hs.forEach((r: any) => {
      const parts = [r.year, r.event, r.institution, r.hospital_country].filter(nonEmpty);
      if (parts.length) mhRows.push(row(parts.join(" · ")));
    });
    sectionCard("Medical History", [29, 58, 107], mhRows);

    // Medications (blue)
    const medRows: { value: string }[] = [];
    pm.forEach((r: any) => {
      const parts = [r.drug_generic, r.dose_form, r.frequency].filter(nonEmpty);
      if (parts.length) medRows.push(row(parts.join(" · ")));
    });
    ot.forEach((r: any) => {
      const parts = [r.product, r.dose, r.frequency].filter(nonEmpty);
      if (parts.length) medRows.push(row(`${parts.join(" · ")} (OTC)`));
    });
    sm.forEach((r: any) => {
      const parts = [r.drug_generic, r.period, r.reason_stopped].filter(nonEmpty);
      if (parts.length) medRows.push(row(`${parts.join(" · ")} (stopped)`));
    });
    dedup(di.filter((r: any) => nonEmpty(r.intolerances_text)), (r: any) => r.intolerances_text)
      .forEach((r: any) => medRows.push(row(`Intolerance: ${r.intolerances_text}`)));
    sectionCard("Medications", [15, 139, 232], medRows);

    // Vaccinations (gold)
    const vaxRows: { value: string }[] = [];
    dedup(cv.filter((r: any) => r.status === "likely_received"), (r: any) => r.vaccine_name ?? "")
      .forEach((r: any) => vaxRows.push(row(`${r.vaccine_name}${r.year_received ? ` · ${r.year_received}` : ""}`)));
    tv.forEach((r: any) => {
      const parts = [r.destination, r.vaccine_name, r.date_received].filter(nonEmpty);
      if (parts.length) vaxRows.push(row(`Travel: ${parts.join(" · ")}`));
    });
    ov.forEach((r: any) => {
      const parts = [r.vaccine_name, r.date_received].filter(nonEmpty);
      if (parts.length) vaxRows.push(row(parts.join(" · ")));
    });
    vco.filter((r: any) => nonEmpty(r.contraindication_notes))
      .forEach((r: any) => vaxRows.push(row(`Contraindication: ${r.contraindication_notes}`)));
    sectionCard("Vaccinations", [201, 158, 30], vaxRows);

    // Allergies (red)
    const allergyRows: { value: string }[] = [];
    dedup(da, (r: any) => r.allergen ?? r.drug ?? "").forEach((r: any) => {
      const name = r.allergen ?? r.drug;
      if (nonEmpty(name)) allergyRows.push(row(`Drug: ${name}${r.reaction ? ` — ${r.reaction}` : ""}`));
    });
    dedup(fa, (r: any) => r.allergen ?? r.food ?? "").forEach((r: any) => {
      const name = r.allergen ?? r.food;
      if (nonEmpty(name)) allergyRows.push(row(`Food: ${name}${r.reaction ? ` — ${r.reaction}` : ""}`));
    });
    dedup(ea, (r: any) => r.allergen ?? "").forEach((r: any) => {
      if (nonEmpty(r.allergen)) allergyRows.push(row(`Environmental: ${r.allergen}${r.reaction ? ` — ${r.reaction}` : ""}`));
    });
    sectionCard("Allergies", [201, 53, 53], allergyRows);

    // Lifestyle (light blue)
    const lifestyleRows: { value: string }[] = [];
    const l = lr[0];
    if (l) {
      if (nonEmpty(l.tobacco_status)) lifestyleRows.push(row(`Tobacco: ${l.tobacco_status}`));
      if (nonEmpty(l.alcohol_frequency)) lifestyleRows.push(row(`Alcohol: ${l.alcohol_frequency}`));
      if (l.height_cm) lifestyleRows.push(row(`Height: ${l.height_cm} cm`));
      if (l.weight_kg) lifestyleRows.push(row(`Weight: ${l.weight_kg} kg`));
      if (nonEmpty(l.exercise_frequency)) lifestyleRows.push(row(`Exercise: ${l.exercise_frequency}`));
      if (Array.isArray(l.diet_restrictions) && l.diet_restrictions.length) lifestyleRows.push(row(`Diet: ${l.diet_restrictions.join(", ")}`));
      if (nonEmpty(l.sleep_status)) lifestyleRows.push(row(`Sleep: ${l.sleep_status}`));
    }
    sectionCard("Lifestyle & Risks", [100, 200, 240], lifestyleRows);

    // Heredity (grey)
    const heredityRows: { value: string }[] = [];
    dedup(hc, (r: any) => r.condition_name ?? "").forEach((r: any) => {
      if (!nonEmpty(r.condition_name)) return;
      const rels = Array.isArray(r.relatives) ? r.relatives.join(", ") : "";
      heredityRows.push(row(`${r.condition_name}${rels ? ` — ${rels}` : ""}`));
    });
    sectionCard("Heredity", [120, 120, 130], heredityRows);

    drawFooters();
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
      <header className="flex items-center justify-between bg-[#1D3F7C] px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Hexagon className="h-[50px] w-[50px]"><img src={logo} alt="GlobeDoc" className="h-9 w-9" /></Hexagon>
          <span className="text-lg font-bold text-white">GlobeDoc</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <Bell className="h-5 w-5" />
          </button>
          <button type="button" onClick={handleSignOut} aria-label="Log out" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
        <h1 className="text-2xl font-bold text-[#0D1B2A]">{t.title}</h1>

        {/* Avatar + name (left-aligned) */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={uploadingAvatar}
            aria-label="Change profile photo"
            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100 shadow-sm ring-2 ring-white"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="absolute inset-0 m-auto h-10 w-10 text-gray-400" />
            )}
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-white shadow ring-2 ring-white">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </button>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-[#0D1B2A]">
              {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || (email ? email.split("@")[0] : "")}
            </p>
            {email && <p className="truncate text-sm text-gray-500">{email}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>



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
                <SaveButton onSave={save} className="rounded-md bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white flex items-center gap-1">{t.save}</SaveButton>
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
            <FieldRow label={t.civic} editing={editing} value={view?.civic_registration_number}
              edit={<input className={input} placeholder={t.civicPlaceholder} value={view?.civic_registration_number ?? ""} onChange={(e) => updateDraft("civic_registration_number", e.target.value)} />} />
          </div>
        </Card>

        {/* Security */}
        <Card>
          <h2 className="text-base font-bold text-[#0D1B2A]">{t.security}</h2>
          <div className="mt-3 divide-y divide-gray-100">
            <ComingSoonRow icon="🏦" label={t.bankid} badge={t.comingSoon} />
            <ComingSoonRow icon="🔐" label={t.threeFactor} badge={t.comingSoon} />
            <ComingSoonRow icon="👁" label={t.biometric} badge={t.comingSoon} />
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

        <BetaSurveyCard onOpen={() => setSurveyOpen(true)} />

        {/* Settings */}
        <Card>
          <h2 className="text-base font-bold text-[#0D1B2A]">{t.settings}</h2>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-[#0D1B2A]">{t.appLang}</p>
            <LanguagePickerRow />
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

        {/* Advanced Security & Privacy */}
        <Card>
          <h2 className="text-base font-bold text-[#0D1B2A]">Advanced Security & Privacy</h2>
          <div className="mt-3 divide-y divide-gray-100">
            <ComingSoonRow icon="🔗" label="GlobeDoc Chain" badge="Coming Soon" subtitle="Decentralised audit trail powered by DAG-based blockchain technology" />
            <ComingSoonRow icon="🔐" label="Homomorphic Encryption" badge="Coming Soon" subtitle="Your data can be analysed without ever being decrypted" />
            <ComingSoonRow icon="🤖" label="Federated Learning" badge="Coming Soon" subtitle="AI that learns from your health data without it ever leaving your device" />
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

      <BetaSurvey open={surveyOpen} onClose={() => setSurveyOpen(false)} userId={userId} role="patient" />

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

function ComingSoonRow({ icon, label, badge, subtitle }: { icon: string; label: string; badge: string; subtitle?: string }) {
  return (
    <div aria-disabled className="flex items-center justify-between gap-3 py-3 opacity-50 cursor-not-allowed select-none">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-lg shrink-0" aria-hidden>{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {badge}
      </span>
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
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#1D3F7C] bg-[#1D3F7C]">
      <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
        <NavTab to="/home" icon={<HomeIcon className="h-5 w-5" />} label="Home" />
        <NavTab to="/passport" icon={<Globe className="h-5 w-5" />} label="Passport" />
        <NavTab to="/travel" icon={<Plane className="h-5 w-5" />} label="Travel" />
        <NavTab to="/records" icon={<FileText className="h-5 w-5" />} label="Records" />
        <NavTab to="/pairing" icon={<LinkIcon className="h-5 w-5" />} label="Pairing" />
        <NavTab to="/profile" icon={<User className="h-5 w-5" />} label="Profile" active />
      </ul>
    </nav>
  );
}
function NavTab({ icon, label, active, to }: { icon: React.ReactNode; label: string; active?: boolean; to?: "/home" | "/passport" | "/travel" | "/records" | "/pairing" | "/profile" }) {
  const className = `flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${active ? "bg-white/15 text-white" : "text-white/75 hover:text-white"}`;
  return (
    <li>
      {to ? <Link to={to} className={className}>{icon}<span>{label}</span></Link>
          : <button type="button" className={className}>{icon}<span>{label}</span></button>}
    </li>
  );
}
