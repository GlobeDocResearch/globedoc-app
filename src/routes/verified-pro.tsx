import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { BrandHeader } from "@/components/BrandHeader";

export const Route = createFileRoute("/verified-pro")({
  head: () => ({
    meta: [
      { title: "Email verified — GlobeDoc Pro" },
      { name: "description", content: "Your GlobeDoc Professional account email has been verified." },
    ],
  }),
  component: VerifiedProPage,
});

function VerifiedProPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex w-full flex-1 flex-col items-center px-5 py-10">
        <BrandHeader />
        <div className="mt-8 w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Email verified</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Professional account is confirmed. You can now sign in to access your Pro dashboard.
          </p>
          <Link
            to="/signin-pro"
            className="mt-6 inline-block w-full rounded-full bg-[#2563EB] px-4 py-3 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
          >
            Continue to Professional sign in
          </Link>
        </div>
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
