import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { z } from "zod";

import { BrandHeader } from "@/components/BrandHeader";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — GlobeDoc" },
      { name: "description", content: "Sign in to your GlobeDoc Health Passport account." },
    ],
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/home" });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start bg-background px-5 py-10">
      <LanguageToggle className="absolute right-4 top-4" />

      <BrandHeader />

      <form
        onSubmit={onSubmit}
        className="mt-8 w-full max-w-md rounded-2xl bg-card p-7 shadow-[var(--shadow-card)]"
      >
        <h2 className="text-center text-2xl font-bold text-foreground">{t("login.welcome")}</h2>

        <div className="mt-6 space-y-5">
          <Field
            id="email"
            label={t("login.email")}
            icon={<Mail className="h-5 w-5" />}
          >
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent pl-11 pr-3 py-3 text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </Field>

          <Field id="password" label={t("login.password")} icon={<Lock className="h-5 w-5" />}>
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent pl-11 pr-11 py-3 text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </Field>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-7 w-full rounded-full bg-brand-blue px-4 py-3.5 text-base font-semibold text-brand-blue-foreground shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {t("login.submit")}
        </button>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {t("login.new")}{" "}
          <Link to="/signup" className="font-semibold text-brand-blue hover:underline">
            {t("login.create")}
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link to="/legal" className="text-sm text-muted-foreground underline underline-offset-2">
            {t("login.legal")}
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="relative flex items-center rounded-full border border-input bg-card transition-colors focus-within:border-brand-blue">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}
