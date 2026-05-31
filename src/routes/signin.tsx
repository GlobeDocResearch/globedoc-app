import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { z } from "zod";

import { BrandHeader } from "@/components/BrandHeader";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/signin")({
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
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

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

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email().max(255).safeParse(resetEmail);
    if (!parsed.success) {
      toast.error("Please enter a valid email address");
      return;
    }
    setResetSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResetSent(true);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <LanguageToggle className="absolute right-4 top-4" />

      <main className="flex w-full flex-1 flex-col items-center px-5 pb-10 pt-10">
        <BrandHeader tagline={false} />

        {mode === "login" ? (
          <form
            onSubmit={onSubmit}
            className="mt-8 w-full max-w-md rounded-2xl bg-card p-7 shadow-[var(--shadow-card)]"
          >
            <div className="space-y-5">
              <Field id="email" label={t("login.email")} icon={<Mail className="h-5 w-5" />}>
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

            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => { setResetEmail(email); setResetSent(false); setMode("forgot"); }}
                className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-full bg-[#2563EB] px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {t("login.submit")}
            </button>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              New to GlobeDoc?{" "}
              <Link to="/signup" className="font-semibold text-brand-blue hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        ) : (
          <div className="mt-8 w-full max-w-md rounded-2xl bg-card p-7 shadow-[var(--shadow-card)]">
            <h2 className="text-center text-2xl font-bold text-foreground">Reset your password</h2>

            {resetSent ? (
              <div className="mt-6 space-y-5 text-center">
                <p className="text-sm text-foreground">
                  Check your email — we've sent you a password reset link.
                </p>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Back to login
                </button>
              </div>
            ) : (
              <form onSubmit={onReset}>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Enter your email and we'll send you a reset link.
                </p>
                <div className="mt-6">
                  <Field id="reset-email" label={t("login.email")} icon={<Mail className="h-5 w-5" />}>
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-transparent pl-11 pr-3 py-3 text-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                  </Field>
                </div>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="mt-6 w-full rounded-full bg-[#2563EB] px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
                >
                  {resetSubmitting ? "Sending..." : "Send reset link"}
                </button>
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Back to login
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {mode === "login" && (
          <>
            {/* Divider */}
            <div className="mt-10 w-full max-w-md">
              <div className="h-px w-full bg-border" />
            </div>

            {/* Healthcare Professionals section */}
            <section className="mt-8 w-full max-w-md text-center">
              <h2 className="text-xl font-bold text-foreground">Healthcare Professionals</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter a patient's pairing code to access their GlobeDoc Health Passport
              </p>
              <Link
                to="/connect"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#2563EB] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
              >
                Connect with Pairing Code
              </Link>
              <Link
                to="/signin"
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-muted px-6 py-3.5 text-base font-semibold text-foreground shadow-sm transition-opacity hover:opacity-95"
              >
                Sign in
              </Link>
              <p className="mt-5 text-sm text-muted-foreground">
                <Link to="/signup-pro" className="font-semibold text-brand-blue hover:underline">
                  Or Create a Professional Account
                </Link>
              </p>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="px-5 pb-6 pt-4">
        <div className="mx-auto flex max-w-md flex-col items-center gap-1 text-center text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-x-2">
            <Link to="/legal" className="hover:text-foreground">Privacy Policy</Link>
            <span aria-hidden>·</span>
            <Link to="/legal" className="hover:text-foreground">Terms of Service</Link>
            <span aria-hidden>·</span>
            <a
              href="https://globedoc.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              globedoc.com
            </a>
          </div>
          <p>© 2026 GlobeDoc</p>
        </div>
      </footer>
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
