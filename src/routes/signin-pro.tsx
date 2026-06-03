import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { z } from "zod";

import { BrandHeader } from "@/components/BrandHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/signin-pro")({
  head: () => ({
    meta: [
      { title: "Professional Sign in — GlobeDoc" },
      { name: "description", content: "Sign in to your GlobeDoc Professional account." },
    ],
  }),
  component: ProSignInPage,
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

function ProSignInPage() {
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
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const isPro = (data.user?.user_metadata as { account_type?: string } | null)?.account_type === "professional";
    if (!isPro) {
      await supabase.auth.signOut();
      toast.error("This account is not a Professional account. Please use the patient login.");
      return;
    }
    navigate({ to: "/pro" });
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
      <main className="flex w-full flex-1 flex-col items-center px-5 pb-10 pt-10">
        <BrandHeader tagline={false} />

        {mode === "login" ? (
          <>
            <div className="mt-6 text-center">
              <h1 className="text-xl font-bold text-foreground">Healthcare Professional Sign in</h1>
            </div>

            <form
              onSubmit={onSubmit}
              className="mt-6 w-full max-w-md rounded-2xl bg-card p-7 shadow-[var(--shadow-card)]"
            >
              <div className="space-y-5">
                <Field id="email" label="Email" icon={<Mail className="h-5 w-5" />}>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent pl-11 pr-3 py-3 text-foreground outline-none placeholder:text-muted-foreground/60"
                  />
                </Field>

                <Field id="password" label="Password" icon={<Lock className="h-5 w-5" />}>
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
                  className="text-base text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full rounded-full bg-[#2563EB] px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>

              <p className="mt-5 text-center">
                <Link to="/signup-pro" className="text-base font-semibold text-[#00A550] hover:opacity-90">
                  Create a Professional Account
                </Link>
              </p>
              <p className="mt-3 text-center text-sm text-muted-foreground">
                <Link to="/signin" className="hover:underline">
                  Back to patient login
                </Link>
              </p>
            </form>
          </>
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
                  <Field id="reset-email" label="Email" icon={<Mail className="h-5 w-5" />}>
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
      </main>

      <footer className="w-full py-5 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-x-2">
          <span>© 2026 GlobeDoc</span>
          <span aria-hidden>·</span>
          <Link to="/legal" className="hover:text-foreground">Privacy Policy</Link>
          <span aria-hidden>·</span>
          <Link to="/legal" className="hover:text-foreground">Terms of Service</Link>
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
