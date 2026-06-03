import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { z } from "zod";

import { BrandHeader } from "@/components/BrandHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — GlobeDoc" },
      { name: "description", content: "Set a new password for your GlobeDoc account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash automatically and
    // emits a PASSWORD_RECOVERY event. Wait for it before allowing submit.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also check existing session in case the event already fired.
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().min(8).max(128).safeParse(password);
    if (!parsed.success) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/home" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex w-full flex-1 flex-col items-center px-5 py-10">
        <BrandHeader />

      <form
        onSubmit={onSubmit}
        className="mt-8 w-full max-w-md rounded-2xl bg-card p-7 shadow-[var(--shadow-card)]"
      >
        <h2 className="text-center text-2xl font-bold text-foreground">Set a new password</h2>

        {!ready ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Waiting for reset link to validate…
          </p>
        ) : (
          <>
            <div className="mt-6">
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-foreground">
                New password
              </label>
              <div className="relative flex items-center rounded-full border border-input bg-card focus-within:border-brand-blue">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="new-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
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
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-brand-blue px-4 py-3.5 text-base font-semibold text-brand-blue-foreground shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? "Updating..." : "Update password"}
            </button>
          </>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-muted-foreground underline underline-offset-2">
            Back to login
          </Link>
        </div>
      </form>
      </main>

      <footer className="w-full py-5 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-x-2">
          <span>© 2026 GlobeDoc</span>
          <span aria-hidden>·</span>
          <Link to="/legal" className="hover:text-foreground">Privacy Policy</Link>
          <span aria-hidden>·</span>
          <Link to="/legal" className="hover:text-foreground">Terms of Service</Link>
          <span aria-hidden>·</span>
          <a href="https://globedoc.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">globedoc.com</a>
        </div>
      </footer>
    </div>
  );
}
