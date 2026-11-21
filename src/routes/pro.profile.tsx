import { Button } from "@/components/ui/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Pencil, ShieldCheck, User as UserIcon, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BetaSurvey, BetaSurveyCard } from "@/components/BetaSurvey";
import { SaveButton } from "@/components/ui/save-button";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";

export const Route = createFileRoute("/pro/profile")({
  head: () => ({ meta: [{ title: "Profile — GlobeDoc Pro" }, { name: "description", content: "Manage your GlobeDoc healthcare professional profile." }, { property: "og:title", content: "Profile — GlobeDoc Pro" }, { property: "og:description", content: "Manage your GlobeDoc healthcare professional profile." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ProfileTab,
});

type ProMeta = {
  full_name?: string;
  pro_title?: string;
  specialty?: string;
  institution?: string;
  city_country?: string;
  avatar_url?: string;
  phone?: string;
  clinic_address?: string;
  clinic_phone?: string;
  license_number?: string;
  license_doc_url?: string;
  license_doc_name?: string;
  civic_registration_number?: string;
};

const input = "w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#253F78]";

function ProfileTab() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [meta, setMeta] = useState<ProMeta>({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProMeta | null>(null);
  const signedAvatarUrl = useAvatarUrl(meta.avatar_url);
  const signedLicenseUrl = useAvatarUrl(meta.license_doc_url);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/signin" }); return; }
      setUserId(user.id);
      setEmail(user.email ?? "");
      setMeta((user.user_metadata ?? {}) as ProMeta);
    })();
  }, [navigate]);

  // Avatar and licence file are persisted the moment they are chosen, so reflect
  // them in the saved values and in the open edit form.
  const update = <K extends keyof ProMeta>(k: K, v: ProMeta[K]) => {
    setMeta((m) => ({ ...m, [k]: v }));
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  };

  const updateDraft = <K extends keyof ProMeta>(k: K, v: ProMeta[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const startEdit = () => { setDraft(meta); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setDraft(null); };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/pro-avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const url = path;
      const { error } = await supabase.auth.updateUser({ data: { ...meta, account_type: "professional", avatar_url: url } });
      if (error) throw error;
      update("avatar_url", url);
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
    setUploadingDoc(true);
    try {
      const ext = file.name.split(".").pop() || "pdf";
      const path = `${userId}/license-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const url = path;
      const { error } = await supabase.auth.updateUser({
        data: { ...meta, account_type: "professional", license_doc_url: url, license_doc_name: file.name },
      });
      if (error) throw error;
      update("license_doc_url", url);
      update("license_doc_name", file.name);
      toast.success("Licence uploaded");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  const onSave = async () => {
    const payload = draft ?? meta;
    const { error } = await supabase.auth.updateUser({
      data: { ...payload, account_type: "professional" },
    });
    if (error) throw new Error(error.message);
    setMeta(payload);
    setEditing(false);
    setDraft(null);
    toast.success("Profile saved");
    return true;
  };

  const view: ProMeta = (editing ? draft : meta) ?? meta;
  const displayName = meta.full_name?.trim() || (email ? email.split("@")[0] : "");
  const displayRole = [meta.pro_title, meta.specialty].filter((s) => (s ?? "").trim()).join(" · ");

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-6">
      <h1 className="workspace-heading text-2xl font-bold text-[#0D1B2A]">Profile</h1>

      {/* Avatar + name (left-aligned) */}
      <div className="mt-4 flex items-center gap-4">
        <Button variant="plain"
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={uploadingAvatar}
          aria-label="Change profile photo"
          className="relative h-24 w-24 shrink-0 rounded-full p-0"
        >
          <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-100 shadow-sm ring-1 ring-gray-100">
            {signedAvatarUrl ? (
              <img src={signedAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-10 w-10 text-gray-400" />
            )}
          </span>
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-hub-navy text-hub-on-navy shadow ring-2 ring-white">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </Button>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-[#0D1B2A]">{displayName}</p>
          {displayRole && <p className="truncate text-sm text-gray-500">{displayRole}</p>}
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-card p-4 opacity-70 workspace-card">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Verified Healthcare Professional</p>
          <p className="text-xs text-gray-400">Verification coming soon</p>
        </div>
      </div>

      {/* Profile details */}
      <section className="mt-4 rounded-2xl bg-card p-5 workspace-card">
        <div className="flex items-start justify-between">
          <h2 className="workspace-heading text-base">Profile details</h2>
          {!editing ? (
            <button onClick={startEdit} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={cancelEdit} className="rounded-md border border-[#253F78] px-3 py-1 text-xs text-[#253F78]">Cancel</button>
              <SaveButton onSave={onSave} className="flex items-center gap-1 rounded-full bg-hub-navy px-3 py-1 text-xs font-semibold text-hub-on-navy">Save</SaveButton>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldRow label="Full name" editing={editing} value={view.full_name}
              edit={<input className={input} value={view.full_name ?? ""} onChange={(e) => updateDraft("full_name", e.target.value)} />} />
          </div>
          <FieldRow label="Title" editing={editing} value={view.pro_title}
            edit={<input className={input} value={view.pro_title ?? ""} onChange={(e) => updateDraft("pro_title", e.target.value)} />} />
          <FieldRow label="Specialty" editing={editing} value={view.specialty}
            edit={<input className={input} value={view.specialty ?? ""} onChange={(e) => updateDraft("specialty", e.target.value)} />} />
          <FieldRow label="Institution / Hospital" editing={editing} value={view.institution}
            edit={<input className={input} value={view.institution ?? ""} onChange={(e) => updateDraft("institution", e.target.value)} />} />
          <FieldRow label="City & Country" editing={editing} value={view.city_country}
            edit={<input className={input} value={view.city_country ?? ""} onChange={(e) => updateDraft("city_country", e.target.value)} />} />
          <FieldRow label="Professional email" editing={editing} value={email}
            edit={<input className={input} value={email} disabled />} />
          <FieldRow label="Phone number" editing={editing} value={view.phone}
            edit={<input className={input} placeholder="+46 …" value={view.phone ?? ""} onChange={(e) => updateDraft("phone", e.target.value)} />} />
          <FieldRow label="Clinic / practice address" editing={editing} value={view.clinic_address}
            edit={<input className={input} value={view.clinic_address ?? ""} onChange={(e) => updateDraft("clinic_address", e.target.value)} />} />
          <FieldRow label="Clinic phone number" editing={editing} value={view.clinic_phone}
            edit={<input className={input} value={view.clinic_phone ?? ""} onChange={(e) => updateDraft("clinic_phone", e.target.value)} />} />
          <FieldRow label="Professional authorisation / licence number" editing={editing} value={view.license_number}
            edit={<input className={input} placeholder="E.g. SE-12345" value={view.license_number ?? ""} onChange={(e) => updateDraft("license_number", e.target.value)} />} />

          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-medium text-gray-500">Upload licence document (optional)</p>
            {editing ? (
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  disabled={uploadingDoc}
                  className="inline-flex items-center gap-2 rounded-full border border-[#253F78] px-4 py-2 text-xs font-semibold text-[#253F78] hover:bg-gray-50 disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingDoc ? "Uploading..." : meta.license_doc_url ? "Replace file" : "Choose file"}
                </button>
                <p className="text-xs text-gray-500">PDF or image</p>
              </div>
            ) : meta.license_doc_url && signedLicenseUrl ? (
              <a href={signedLicenseUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-hub-navy underline">
                <FileText className="h-3.5 w-3.5" /> {meta.license_doc_name ?? "View"}
              </a>
            ) : (
              <p className="text-sm text-[#0D1B2A]">{meta.license_doc_name || "—"}</p>
            )}
            <input
              ref={docInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleDocChange}
            />
          </div>

          <FieldRow label="Civic registration number" editing={editing} value={view.civic_registration_number}
            edit={<input className={input} placeholder="Personal identity number" value={view.civic_registration_number ?? ""} onChange={(e) => updateDraft("civic_registration_number", e.target.value)} />} />
        </div>
      </section>

      <div className="mt-4">
        <BetaSurveyCard onOpen={() => setSurveyOpen(true)} />
      </div>

      <BetaSurvey open={surveyOpen} onClose={() => setSurveyOpen(false)} userId={userId} role="pro" />
    </main>
  );
}

function FieldRow({ label, value, editing, edit }: { label: string; value?: string | null; editing: boolean; edit: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      {editing ? edit : <p className="text-sm text-[#0D1B2A]">{value || "—"}</p>}
    </div>
  );
}
