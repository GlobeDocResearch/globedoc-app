import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { BrandHeader } from "@/components/BrandHeader";

export const Route = createFileRoute("/confirm-email-pro")({
  head: () => ({
    meta: [
      { title: "Confirm your email — GlobeDoc Pro" },
      { name: "description", content: "Confirm your email to activate your GlobeDoc Professional account." },
    ],
  }),
  component: ConfirmEmailProPage,
});

function ConfirmEmailProPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex w-full flex-1 flex-col items-center px-5 py-10">
        <BrandHeader />
        <div className="mt-8 w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-[#2563EB]">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Confirm your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We've sent you a confirmation link. Please check your inbox and click the link to activate
            your Professional account. After confirming, you'll be able to sign in and access your Pro
            dashboard.
          </p>
          <Link
            to="/signin-pro"
            className="mt-6 inline-block w-full rounded-full bg-[#2563EB] px-4 py-3 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
          >
            Go to Professional sign in
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
