import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { BrandHeader } from "@/components/BrandHeader";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Check your email — GlobeDoc" },
      { name: "description", content: "Confirm your GlobeDoc account email." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { lang } = useI18n();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setEmail(window.sessionStorage.getItem("pendingVerificationEmail") ?? "");
  }, []);

  const t = lang === "sv"
    ? {
        title: "Kolla din e-post",
        body: (e: string) => `Vi skickade en verifieringslänk till ${e || "din e-postadress"}. Klicka på länken i e-postmeddelandet för att bekräfta ditt konto.`,
        resend: "Skicka verifieringsmejl igen",
        sending: "Skickar…",
        didnt: "Fick du inget mejl?",
        spam: "eller kolla i skräpposten.",
        sent: "Verifieringsmejlet har skickats igen.",
        missing: "Ingen e-postadress sparad. Vänligen registrera dig igen.",
      }
    : {
        title: "Check your email",
        body: (e: string) => `We sent a verification link to ${e || "your email"}. Click the link in the email to confirm your account.`,
        resend: "Resend verification email",
        sending: "Sending…",
        didnt: "Didn't get an email?",
        spam: "or check your spam folder.",
        sent: "Verification email resent.",
        missing: "No email on file. Please sign up again.",
      };

  const onResend = async () => {
    if (!email) {
      toast.error(t.missing);
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/verified` },
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t.sent);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex w-full flex-1 flex-col items-center px-5 py-10">
        <BrandHeader />
        <div className="mt-8 w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.body(email)}</p>
          <button
            type="button"
            onClick={onResend}
            disabled={sending}
            className="mt-6 inline-block w-full rounded-full bg-brand-blue px-4 py-3 text-base font-semibold text-brand-blue-foreground shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {sending ? t.sending : t.resend}
          </button>
          <p className="mt-4 text-xs text-muted-foreground">
            {t.didnt}{" "}
            <button
              type="button"
              onClick={onResend}
              disabled={sending}
              className="font-semibold text-brand-blue hover:underline disabled:opacity-60"
            >
              {t.resend}
            </button>{" "}
            {t.spam}
          </p>
        </div>
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
