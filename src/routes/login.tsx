import { createFileRoute, Link } from "@tanstack/react-router";

import { BrandHeader } from "@/components/BrandHeader";
import { LanguageToggle } from "@/components/LanguageToggle";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "GlobeDoc — Your Deep Health" },
      { name: "description", content: "GlobeDoc Health Passport — join or connect with a patient." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <LanguageToggle className="absolute right-4 top-4" />

      <main className="flex w-full flex-1 flex-col items-center px-5 pb-16 pt-10">
        <BrandHeader />

        {/* Primary CTA */}
        <div className="mt-12 flex w-full max-w-md flex-col items-center">
          <Link
            to="/signup"
            className="flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-4 text-lg font-semibold text-white shadow-[0_10px_30px_-10px_rgba(5,150,105,0.55)] transition-opacity hover:opacity-95"
          >
            Join
          </Link>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already a member?{" "}
            <Link to="/signin" className="font-semibold text-brand-blue hover:underline">
              Log in
            </Link>
          </p>
        </div>

        {/* Divider */}
        <div className="mt-12 w-full max-w-md">
          <div className="h-px w-full bg-border" />
        </div>

        {/* Connect section */}
        <section className="mt-10 w-full max-w-md text-center">
          <h2 className="text-xl font-bold text-foreground">Healthcare Professional?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a patient's pairing code to access their GlobeDoc Health Passport
          </p>
          <Link
            to="/connect"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
          >
            Connect with Patient
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-slate-300">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Company</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Mission</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Legal</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link to="/legal" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/legal" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/legal" className="hover:text-white">GDPR</Link></li>
              </ul>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-slate-400">
                © 2026 GlobeDoc · Built for every patient on Earth
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-5 text-center">
            <a
              href="https://globedoc.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 underline underline-offset-2 hover:text-white"
            >
              For full information visit globedoc.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
