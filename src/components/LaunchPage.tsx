import { Link } from "@tanstack/react-router";

import logo from "@/assets/globedoc-logo.svg";
import { Hexagon } from "@/components/Hexagon";

export function LaunchPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
      {/* Header */}
      <header className="flex items-center bg-[#1D3F7C] px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Hexagon className="h-[50px] w-[50px]">
            <img src={logo} alt="GlobeDoc" className="h-9 w-9" />
          </Hexagon>
          <span className="text-lg font-bold text-white">GlobeDoc</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center">
        <Hexagon className="h-28 w-28">
          <img src={logo} alt="GlobeDoc" className="h-20 w-20" />
        </Hexagon>

        <p className="mt-6 text-base font-medium text-[#1D438C]">Your Deep Health</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0D1B2A] sm:text-4xl">
          Something big is coming.
        </h1>
        <p className="mt-4 max-w-md text-base text-muted-foreground">
          GlobeDoc is launching soon — a new way to own your health, wherever you are in the world.
        </p>
      </main>

      {/* Footer */}
      <footer className="bg-[#1D3F7C] px-5 py-10 text-white">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-sm">
          {/* Company */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/70">Company</h3>
            <ul className="space-y-2">
              <li><span className="text-white/90 hover:text-white">About</span></li>
              <li><span className="text-white/90 hover:text-white">Mission</span></li>
              <li>
                <a href="mailto:hello@globedoc.com" className="text-white/90 hover:text-white">
                  Careers
                </a>
              </li>
              <li><span className="text-white/90 hover:text-white">Press</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/70">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/legal" className="text-white/90 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal" className="text-white/90 hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/legal" className="text-white/90 hover:text-white">
                  GDPR
                </Link>
              </li>
              <li>
                <a href="mailto:hello@globedoc.com" className="text-white/90 hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mx-auto mt-10 max-w-4xl border-t border-white/20 pt-6 text-center text-xs text-white/60">
          <p>
            © 2026 GlobeDoc ·{" "}
            <Link to="/legal" className="hover:text-white">Privacy Policy</Link>
            {" · "}
            <Link to="/legal" className="hover:text-white">Terms of Service</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
