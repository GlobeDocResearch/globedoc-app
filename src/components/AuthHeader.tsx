import { Link } from "@tanstack/react-router";
import logo from "@/assets/globedoc-logo.svg";
import { Hexagon } from "@/components/Hexagon";
import { LanguageToggle } from "@/components/LanguageToggle";

export function AuthHeader() {
  return (
    <header className="w-full bg-brand-navy text-brand-navy-foreground">
      <div className="flex w-full items-center justify-between px-4 py-3">
        <Link to="/signin" className="flex items-center gap-2.5">
          <Hexagon style={{ height: "2.25rem", width: "2.25rem" }}>
            <img src={logo} alt="GlobeDoc" className="h-[1.65rem] w-[1.65rem]" />
          </Hexagon>
          <span className="text-lg font-semibold tracking-tight">GlobeDoc</span>
        </Link>
        <LanguageToggle className="text-white" />
      </div>
    </header>
  );
}
