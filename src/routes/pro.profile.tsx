import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
};

function ProfileTab() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [institution, setInstitution] = useState("");
  const [cityCountry, setCityCountry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/signin" });
        return;
      }
      const meta = (user.user_metadata ?? {}) as ProMeta;
      setEmail(user.email ?? "");
      setFullName(meta.full_name ?? "");
      setTitle(meta.pro_title ?? "");
      setSpecialty(meta.specialty ?? "");
      setInstitution(meta.institution ?? "");
      setCityCountry(meta.city_country ?? "");
    })();
  }, [navigate]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        account_type: "professional",
        full_name: fullName,
        pro_title: title,
        specialty,
        institution,
        city_country: cityCountry,
      },
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved");
  };

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-6">
      <h1 className="text-2xl font-bold text-[#0D1B2A]">Profile</h1>

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
        <Field label="Full name" value={fullName} onChange={setFullName} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" value={title} onChange={setTitle} />
          <Field label="Specialty" value={specialty} onChange={setSpecialty} />
        </div>
        <Field label="Institution / Hospital" value={institution} onChange={setInstitution} />
        <Field label="City & Country" value={cityCountry} onChange={setCityCountry} />
        <Field label="Professional email" value={email} onChange={() => {}} disabled />

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </main>
  );
}

function Field({
  label, value, onChange, disabled,
}: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="text-sm font-semibold text-[#0D1B2A]">{label}</label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  );
}
