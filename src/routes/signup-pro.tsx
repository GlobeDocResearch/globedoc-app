import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { BrandHeader } from "@/components/BrandHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup-pro")({
  head: () => ({
    meta: [
      { title: "Create Professional Account — GlobeDoc" },
      {
        name: "description",
        content: "Create a GlobeDoc Healthcare Professional account.",
      },
    ],
  }),
  component: ProSignupPage,
});

const TITLES = ["Dr", "Prof", "Nurse", "Physiotherapist", "Other"] as const;

const schema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(160),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  title: z.enum(TITLES, { errorMap: () => ({ message: "Please select a title" }) }),
  specialty: z.string().trim().min(1, "Specialty is required").max(160),
  institution: z.string().trim().min(1, "Institution is required").max(255),
  cityCountry: z.string().trim().min(1, "City & Country is required").max(255),
});

function ProSignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState<(typeof TITLES)[number] | "">("");
  const [specialty, setSpecialty] = useState("");
  const [institution, setInstitution] = useState("");
  const [cityCountry, setCityCountry] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm) {
      toast.error("Please confirm the professional declaration.");
      return;
    }
    const parsed = schema.safeParse({
      fullName,
      email,
      password,
      title,
      specialty,
      institution,
      cityCountry,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/verified-pro`,
        data: {
          account_type: "professional",
          full_name: parsed.data.fullName,
          pro_title: parsed.data.title,
          specialty: parsed.data.specialty,
          institution: parsed.data.institution,
          city_country: parsed.data.cityCountry,
          consent_pro_declaration_at: new Date().toISOString(),
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Check your email to confirm.");
    navigate({ to: "/confirm-email-pro" });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <main className="flex w-full flex-1 flex-col items-center px-5 pb-10 pt-10">
        <BrandHeader tagline={false} />

        <form
          onSubmit={onSubmit}
          className="mt-8 w-full max-w-md rounded-2xl bg-card p-7 shadow-[var(--shadow-card)]"
        >
          <h1 className="text-center text-2xl font-bold text-foreground">
            Create Professional Account
          </h1>

          <div className="mt-6 space-y-4">
            <FieldText id="fullName" label="Full name" value={fullName} onChange={setFullName} />
            <FieldText
              id="email"
              label="Professional email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
            />
            <FieldText
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
            />

            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-foreground">
                Title
              </label>
              <select
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value as (typeof TITLES)[number])}
                className="h-12 w-full rounded-full border border-input bg-card px-4 text-foreground outline-none focus:border-brand-blue"
              >
                <option value="">Select a title</option>
                {TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <FieldText
              id="specialty"
              label="Specialty"
              placeholder="E.g. Cardiology, General Practice"
              value={specialty}
              onChange={setSpecialty}
            />
            <FieldText
              id="institution"
              label="Institution / Hospital"
              placeholder="E.g. Karolinska University Hospital"
              value={institution}
              onChange={setInstitution}
            />
            <FieldText
              id="cityCountry"
              label="City & Country"
              value={cityCountry}
              onChange={setCityCountry}
            />
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-brand-blue"
              required
            />
            <span className="leading-relaxed">
              I confirm that I am a licensed healthcare professional and that I will only access
              patient data in the context of direct patient care, in accordance with applicable law
              and GDPR Article 9(2)(h).
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-[#16A34A] px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create Professional Account"}
          </button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/signin" className="font-semibold text-brand-blue hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

function FieldText({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-full border border-input bg-card px-4 text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-brand-blue"
      />
    </div>
  );
}
