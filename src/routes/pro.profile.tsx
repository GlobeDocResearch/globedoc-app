import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, ShieldCheck, User as UserIcon, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BetaSurvey, BetaSurveyCard } from "@/components/BetaSurvey";
import { SaveButton } from "@/components/ui/save-button";

export const Route = createFileRoute("/pro/profile")({
  head: () => ({ meta: [{ title: "Profile — GlobeDoc Pro" }] }),
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

function ProfileTab() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [meta, setMeta] = useState<ProMeta>({});
  
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

  const update = <K extends keyof ProMeta>(k: K, v: ProMeta[K]) =>
    setMeta((m) => ({ ...m, [k]: v }));

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
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
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
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
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

  const onSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const { error } = await supabase.auth.updateUser({
      data: { ...meta, account_type: "professional" },
    });
    if (error) throw new Error(error.message);
    toast.success("Profile saved");
  };

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-6">
      <h1 className="text-2xl font-bold text-[#0D1B2A]">Profile</h1>

      {/* Avatar */}
      <div className="mt-4 flex flex-col items-center">
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={uploadingAvatar}
          aria-label="Change profile photo"
          className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-100 shadow-sm ring-2 ring-white"
        >
          {meta.avatar_url ? (
            <img src={meta.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="absolute inset-0 m-auto h-10 w-10 text-gray-400" />
          )}
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-white shadow ring-2 ring-white">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </button>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm opacity-70">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Verified Healthcare Professional</p>
          <p className="text-xs text-gray-400">Verification coming soon</p>
        </div>
      </div>

      <form onSubmit={onSave} className="mt-4 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <Field label="Full name" value={meta.full_name ?? ""} onChange={(v) => update("full_name", v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" value={meta.pro_title ?? ""} onChange={(v) => update("pro_title", v)} />
          <Field label="Specialty" value={meta.specialty ?? ""} onChange={(v) => update("specialty", v)} />
        </div>
        <Field label="Institution / Hospital" value={meta.institution ?? ""} onChange={(v) => update("institution", v)} />
        <Field label="City & Country" value={meta.city_country ?? ""} onChange={(v) => update("city_country", v)} />
        <Field label="Professional email" value={email} onChange={() => {}} disabled />
        <Field label="Phone number" value={meta.phone ?? ""} onChange={(v) => update("phone", v)} placeholder="+46 …" />
        <Field label="Clinic / practice address" value={meta.clinic_address ?? ""} onChange={(v) => update("clinic_address", v)} />
        <Field label="Clinic phone number" value={meta.clinic_phone ?? ""} onChange={(v) => update("clinic_phone", v)} />
        <Field
          label="Professional authorisation / licence number"
          value={meta.license_number ?? ""}
          onChange={(v) => update("license_number", v)}
          placeholder="E.g. SE-12345"
        />

        <div>
          <label className="text-sm font-semibold text-[#0D1B2A]">Upload licence document (optional)</label>
          <p className="text-xs text-gray-500">PDF or image</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              disabled={uploadingDoc}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-[#0D1B2A] hover:bg-gray-50 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {uploadingDoc ? "Uploading..." : meta.license_doc_url ? "Replace file" : "Choose file"}
            </button>
            {meta.license_doc_url && (
              <a href={meta.license_doc_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#2563EB] underline">
                <FileText className="h-3.5 w-3.5" /> {meta.license_doc_name ?? "View"}
              </a>
            )}
          </div>
          <input
            ref={docInputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={handleDocChange}
          />
        </div>

        <Field
          label="Civic registration number"
          value={meta.civic_registration_number ?? ""}
          onChange={(v) => update("civic_registration_number", v)}
          placeholder="Personal identity number"
        />

        <SaveButton
          type="submit"
          onSave={() => onSave()}
          className="w-full rounded-full bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 flex items-center justify-center gap-2"
        >
          Save changes
        </SaveButton>
      </form>

      <div className="mt-4">
        <BetaSurveyCard onOpen={() => setSurveyOpen(true)} />
      </div>

      <BetaSurvey open={surveyOpen} onClose={() => setSurveyOpen(false)} userId={userId} role="pro" />
    </main>
  );
}

function Field({
  label, value, onChange, disabled, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-semibold text-[#0D1B2A]">{label}</label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  );
}
