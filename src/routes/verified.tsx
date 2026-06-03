import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { BrandHeader } from "@/components/BrandHeader";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/verified")({
  head: () => ({
    meta: [
      { title: "Email verified — GlobeDoc" },
      { name: "description", content: "Your GlobeDoc account email has been verified." },
    ],
  }),
  component: VerifiedPage,
});

function VerifiedPage() {
  const { lang } = useI18n();
  const t = lang === "sv"
    ? {
        title: "E-post verifierad",
        body: "Ditt konto är bekräftat. Du kan nu logga in för att komma åt ditt Health Passport.",
        cta: "Fortsätt till inloggning",
      }
    : {
        title: "Email verified",
        body: "Your account is confirmed. You can now sign in to access your Health Passport.",
        cta: "Continue to sign in",
      };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex w-full flex-1 flex-col items-center px-5 py-10">
        <BrandHeader />
        <div className="mt-8 w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
          <Link
            to="/login"
            className="mt-6 inline-block w-full rounded-full bg-brand-blue px-4 py-3 text-base font-semibold text-brand-blue-foreground shadow-sm transition-opacity hover:opacity-95"
          >
            {t.cta}
          </Link>
        </div>
      </main>

      <footer className="w-full bg-brand-navy text-brand-navy-foreground">
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-1 px-4 py-5 text-center text-xs">
          <div className="flex flex-wrap items-center justify-center gap-x-2 text-white/80">
            <span>© 2026 GlobeDoc</span>
            <span aria-hidden>·</span>
            <Link to="/legal" className="hover:text-white">Privacy Policy</Link>
            <span aria-hidden>·</span>
            <Link to="/legal" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
