import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BriefcaseMedical, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { z } from "zod";

import { Hexagon } from "@/components/Hexagon";
import { LanguageGlobeButton } from "@/components/LanguagePicker";

import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import globeLogo from "@/assets/globedoc-globe.svg";
import headerLogo from "@/assets/globedoc-logo-clean.svg";
import { InstallAppSection } from "@/components/InstallAppSection";

const HUB_HEX_CLIP = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

function RoleHexagon({
  to,
  backgroundClass,
  icon,
  title,
  subtitle,
}: {
  to: string;
  backgroundClass: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link to={to} className="block">
      <div
        style={{ clipPath: HUB_HEX_CLIP, WebkitClipPath: HUB_HEX_CLIP }}
        className={`flex aspect-[0.866] w-36 flex-col items-center justify-center px-1 text-center drop-shadow-[var(--shadow-role)] transition-transform duration-200 motion-safe:hover:scale-105 sm:w-44 ${backgroundClass}`}
      >
        <span className="mb-1 flex h-7 w-7 items-center justify-center text-role-ink [&_svg]:h-7 [&_svg]:w-7 sm:h-9 sm:w-9 sm:[&_svg]:h-9 sm:[&_svg]:w-9">{icon}</span>
        <span className="h-5 whitespace-nowrap text-sm font-semibold leading-5 text-role-ink sm:text-base">{title}</span>
        <span className="mt-1 h-4 whitespace-nowrap text-[10px] leading-4 text-role-subtitle sm:text-[11px]">{subtitle}</span>
      </div>
    </Link>
  );
}


const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

export function LoginEntryPage({ audience = "combined" }: { audience?: "combined" | "patient" | "professional" | "chooser" }) {
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
  const [wrongArea, setWrongArea] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    setWrongArea(false);
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const isPro = (data.user?.user_metadata as { account_type?: string } | null)?.account_type === "professional";
    if ((audience === "patient" && isPro) || (audience === "professional" && !isPro)) {
      await supabase.auth.signOut();
      setWrongArea(true);
      return;
    }
    navigate({ to: isPro ? "/connect" : "/home" });
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
    <div className="entry-page relative flex min-h-screen flex-col bg-background">
      {/* Site header (matches globedoc.com) */}
      <header className="m-0 w-full rounded-none border-0 bg-auth-header px-0 text-auth-header-foreground">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <a href="https://globedoc.com" aria-label="GlobeDoc website" className="flex items-center gap-3">
          <span className="entry-logo flex h-12 w-12 shrink-0 items-center justify-center bg-card">
            <img src={headerLogo} alt="" className="h-8 w-8" />
          </span>
          <span className="entry-brand text-xl sm:text-2xl"><strong className="font-bold">GlobeDoc</strong>{" "}<span className="font-normal text-auth-header-foreground/80">Research Hub</span></span>
          </a>
          <LanguageGlobeButton appearance="header" />
        </div>
      </header>

      <main className="relative flex w-full flex-1 flex-col items-center px-5 pb-12 pt-12 sm:pt-14">
        {audience === "chooser" && <div className="text-center">
          <h1 className="text-3xl font-semibold text-auth-title">Sign in to GlobeDoc</h1>
          <p className="mt-3 text-base text-muted-foreground">Choose how you want to sign in.</p>
        </div>}

        {audience === "chooser" && (
          <div className="mt-10 flex justify-center gap-[6px]">
            <RoleHexagon
              to="/patient"
              backgroundClass="bg-role-patient"
              icon={<User strokeWidth={1.5} />}
              title="Patient login"
              subtitle="Co-own your health record"
            />
            <RoleHexagon
              to="/pro"
              backgroundClass="bg-role-professional"
              icon={<BriefcaseMedical strokeWidth={1.5} />}
              title="Professional login"
              subtitle="Access with patient consent"
            />
          </div>
        )}

        {audience === "patient" && mode === "login" && (
          <h1 className="text-center text-3xl font-semibold text-auth-title">Patient sign-in</h1>
        )}
        {audience === "professional" && mode === "login" && (
          <h1 className="text-center text-3xl font-semibold text-auth-title">Healthcare professional sign-in</h1>
        )}

        {audience !== "chooser" && (mode === "login" ? (
          <form
            onSubmit={onSubmit}
            className="mt-7 w-full max-w-md rounded-lg border border-border bg-card p-6 sm:p-7"
          >
            <div className="space-y-5">
              <Field id="email" label={audience === "professional" ? "Email address" : t("login.email")} icon={<Mail className="h-5 w-5" />}>
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
                <Button variant="plain"
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 h-auto -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground [&_svg]:size-5"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </Field>
            </div>

            <div className="mt-3 text-right">
              <Button variant="plain"
                type="button"
                onClick={() => { setResetEmail(email); setResetSent(false); setMode("forgot"); }}
                className="h-auto p-0 text-base text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Button>
            </div>

            <Button variant="plain"
              type="submit"
              disabled={submitting}
              className="mt-4 h-auto w-full rounded-full bg-auth-action px-4 py-3.5 text-base font-semibold text-auth-header-foreground shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {t("login.submit")}
            </Button>

            {wrongArea && (
              <p className="mt-4 rounded-lg border border-input bg-background p-3 text-center text-sm text-foreground">
                {audience === "professional" ? "This is a patient account. Please use the " : "This is a healthcare professional account. Please use the "}
                <Link to={audience === "professional" ? "/patient" : "/pro"} className="font-semibold text-auth-register hover:opacity-90">
                  {audience === "professional" ? "patient sign-in" : "professional sign-in"}
                </Link>{" "}
                instead.
              </p>
            )}

            {audience === "professional" && (
              <>
                <div className="my-5 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button asChild variant="outline" className="h-auto w-full whitespace-normal rounded-full border-auth-header bg-card px-4 py-3.5 text-base font-semibold text-auth-header">
                  <Link to="/connect" className="text-center">Connect with a patient’s pairing code</Link>
                </Button>
              </>
            )}

            <p className="mt-5 text-center">
              <Link to={audience === "professional" ? "/signup-pro" : "/signup"} className="text-base font-semibold text-auth-register hover:opacity-90">
                {audience === "professional" ? "Create a professional account" : "Create an account"}
              </Link>
            </p>
            {audience === "patient" && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Not a patient?{" "}
                <Link to="/pro" className="font-semibold text-auth-register hover:opacity-90">
                  Sign in as a healthcare professional
                </Link>
              </p>
            )}
            {audience === "professional" && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Not a healthcare professional?{" "}
                <Link to="/patient" className="font-semibold text-auth-register hover:opacity-90">
                  Sign in as a patient
                </Link>
              </p>
            )}
          </form>
        ) : (
          <div className="mt-7 w-full max-w-md rounded-lg border border-border bg-card p-6 sm:p-7">
            <h2 className="text-center text-2xl font-bold text-foreground">Reset your password</h2>

            {resetSent ? (
              <div className="mt-6 space-y-5 text-center">
                <p className="text-sm text-foreground">
                  Check your email — we've sent you a password reset link.
                </p>
                <Button variant="plain"
                  type="button"
                  onClick={() => setMode("login")}
                  className="h-auto p-0 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Back to login
                </Button>
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
                <Button variant="plain"
                  type="submit"
                  disabled={resetSubmitting}
                  className="mt-6 h-auto w-full rounded-full bg-auth-title px-4 py-3.5 text-base font-semibold text-auth-header-foreground shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
                >
                  {resetSubmitting ? "Sending..." : "Send reset link"}
                </Button>
                <div className="mt-4 text-center">
                  <Button variant="plain"
                    type="button"
                    onClick={() => setMode("login")}
                    className="h-auto p-0 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Back to login
                  </Button>
                </div>
              </form>
            )}
          </div>
        ))}

        {audience === "combined" && mode === "login" && (
          <>
            {/* Divider */}
            {audience === "combined" && (
              <div className="mt-10 w-full max-w-md">
                <div className="h-px w-full bg-border" />
              </div>
            )}

            {/* Healthcare Professionals section */}
            <section className="mt-8 w-full max-w-md text-center">
              <h2 className="text-xl font-bold text-foreground">
                Healthcare Professionals
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your patient’s pairing code to connect to their GlobeDoc
              </p>
              <Button asChild variant="plain" className="mt-5 h-auto w-full rounded-full p-0"><Link
                to="/connect"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-auth-action px-6 py-3.5 text-base font-semibold text-auth-header-foreground shadow-sm transition-opacity hover:opacity-95"
              >
                Connect with Pairing Code
              </Link></Button>
              <Button asChild variant="plain" className="mt-3 h-auto w-full rounded-full p-0"><Link
                to="/signin-pro"
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-auth-title px-6 py-3.5 text-base font-semibold text-auth-header-foreground shadow-sm transition-opacity hover:opacity-95"
              >
                Sign in
              </Link></Button>
              <p className="mt-5 text-center">
                <Link to="/signup-pro" className="text-base font-semibold text-auth-register hover:opacity-90">
                  Create a Professional Account
                </Link>
              </p>
            </section>
          </>
        )}
        <InstallAppSection />
      </main>

      <footer className="w-full bg-auth-header text-auth-header-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-5 py-7 text-center text-sm">
          <div className="flex flex-wrap items-center justify-center gap-x-2 text-auth-header-foreground/80">
            <span className="w-full">© 2026 GlobeDoc Research Hub (non-profit, in formation)</span>
            <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <a href="https://globedoc.com/privacy" className="hover:text-auth-header-foreground">Privacy Policy</a>
              <span aria-hidden>·</span>
              <a href="https://globedoc.com/terms" className="hover:text-auth-header-foreground">Terms of Service</a>
              <span aria-hidden>·</span>
              <a href="https://globedoc.com/about" className="hover:text-auth-header-foreground">About</a>
              <span aria-hidden>·</span>
              <a href="https://globedoc.com/contact" className="hover:text-auth-header-foreground">Contact</a>
            </span>
          </div>
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
