import { Link } from "@tanstack/react-router";

export function AuthFooter() {
  return (
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
  );
}
