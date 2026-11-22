import { Button } from "@/components/ui/button";
import { WorkspaceBrand, WorkspaceBell } from "@/components/WorkspaceBrand";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type NavTo = "/home" | "/pairing" | "/health-pass" | "/profile" | "/travel" | "/records";
import { LogOut, IdCard, Home as HomeIcon, Globe, Plane, Link as LinkIcon, User, FileText } from "lucide-react";

import logo from "@/assets/globedoc-logo.svg";
import { Hexagon } from "@/components/Hexagon";
import { supabase } from "@/integrations/supabase/client";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { useI18n } from "@/lib/i18n";
import WorldMap, { type MapLocation } from "@/components/WorldMap";


export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [{ title: "Home — GlobeDoc" }, { name: "description", content: "Your GlobeDoc account and Health Passport overview." }, { property: "og:title", content: "Home — GlobeDoc" }, { property: "og:description", content: "Your GlobeDoc account and Health Passport overview." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }],
  }),
  component: HomePage,
});

function HomePage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const signedAvatarUrl = useAvatarUrl(avatarUrl);
  const [lastUpdated, setLastUpdated] = useState<string | null | undefined>(undefined);
  const [hasPassport, setHasPassport] = useState(false);
  const [locations, setLocations] = useState<MapLocation[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      if (!mounted) return;
      setEmail(user.email ?? "");
      const [{ data: profile }, hs, rl] = await Promise.all([
        supabase.from("profiles").select("first_name, avatar_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("hospital_stays").select("id, city, country, hospital_country").eq("user_id", user.id),
        (supabase as any).from("record_locations").select("id, city, country").eq("user_id", user.id),
      ]);
      if (!mounted) return;
      if (profile?.first_name) setFirstName(profile.first_name);
      if ((profile as any)?.avatar_url) setAvatarUrl((profile as any).avatar_url);
      const locs: MapLocation[] = [];
      for (const r of (hs.data ?? []) as any[]) {
        locs.push({ id: `hs-${r.id}`, city: r.city, country: r.country ?? r.hospital_country });
      }
      for (const r of (rl.data ?? []) as any[]) {
        locs.push({ id: `rl-${r.id}`, city: r.city, country: r.country });
      }
      setLocations(locs);
      const tables = ["record_entries", "record_locations", "hospital_stays", "allergies_summary", "allergy_drug_intolerances", "childhood_vaccines", "contrast_allergies", "drug_allergies", "drug_intolerances", "environmental_allergies", "food_allergies", "heredity_conditions", "heredity_genetic_testing", "heredity_parents", "heredity_siblings", "heredity_summary", "lifestyle_risk", "medical_conditions", "medical_conditions_summary", "obstetric_history", "otc_supplements", "other_vaccines", "prescription_medications", "stopped_medications", "travel_vaccines", "vaccination_contraindications"];
      const results = await Promise.all(tables.map((tb) =>
        (supabase as any).from(tb).select("updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1),
      ));
      if (!mounted) return;
      let latest: string | null = null;
      for (const r of results) {
        const v = r.data?.[0]?.updated_at as string | undefined;
        if (v && (!latest || v > latest)) latest = v;
      }
      setLastUpdated(latest);
      setHasPassport(results.some((r, i) => i >= 2 && (r.data?.length ?? 0) > 0));
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const displayName = firstName || (email ? email.split("@")[0] : "User");

  return (
    <div className="min-h-screen bg-hub-bg pb-24">
      {/* Top bar */}
      <header className="workspace-header grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-hub-navy px-5 py-3 sm:flex sm:justify-between">
        <WorkspaceBrand />
        <div className="flex shrink-0 items-center gap-2">
          <WorkspaceBell />
          <Button variant="plain"
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="workspace-header-control hidden items-center justify-center sm:inline-flex"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-6">
        {/* User section */}
        <section className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-100 shadow-sm ring-1 ring-gray-100">
              {signedAvatarUrl ? (
                <img src={signedAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <span className="absolute bottom-0 left-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div>
            <h1 className="workspace-heading text-xl font-bold text-[#1D438C]">
              {t("home.welcome").replace("{name}", displayName)}
            </h1>
            <p className="text-sm text-gray-500">
              {lastUpdated === undefined
                ? "\u00a0"
                : lastUpdated
                  ? t("home.lastUpdated").replace("{date}", new Date(lastUpdated).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { day: "numeric", month: "short", year: "numeric" }))
                  : t("home.getStarted")}
            </p>
          </div>
        </section>

        {/* Health Passport card */}
        <section className="mt-6 workspace-card bg-hub-highlight p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-hub-navy">
              <IdCard className="h-6 w-6 text-hub-on-navy" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg workspace-heading">{hasPassport ? t("home.passportTitleExisting") : t("home.passportTitle")}</h2>
              <p className="mt-1 text-sm text-[#0D1B2A]">{t("home.passportSubtitle")}</p>
              <Button asChild variant="plain" className="h-auto p-0 mt-4 rounded-full"><Link
                to="/health-pass"
                className="inline-flex items-center gap-2 rounded-full bg-hub-navy px-5 py-3 text-sm font-semibold text-hub-on-navy  hover:opacity-90"
              >
                {hasPassport ? t("home.passportCtaExisting") : t("home.passportCta")}
              </Link></Button>
            </div>
          </div>
        </section>

        {/* World map of record locations */}
        <p className="mt-6 text-sm font-medium text-gray-500">{t("home.mapCaption")}</p>
        <section className="mt-2 aspect-[800/380] w-full">
          <WorldMap locations={locations} />
        </section>
      </main>


      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 workspace-nav border-t border-hub-navy bg-hub-navy">
        <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
          <NavTab to="/home" icon={<HomeIcon className="h-5 w-5" />} label={t("nav.home")} active />
          <NavTab to="/health-pass" icon={<Globe className="h-5 w-5" />} label={t("nav.health")} />
          <NavTab to="/travel" icon={<Plane className="h-5 w-5" />} label={t("nav.travel")} />
          <NavTab to="/records" icon={<FileText className="h-5 w-5" />} label={t("nav.records")} />
          <NavTab to="/pairing" icon={<LinkIcon className="h-5 w-5" />} label={t("nav.pairing")} />
          <NavTab to="/profile" icon={<User className="h-5 w-5" />} label={t("nav.profile")} />
        </ul>
      </nav>
    </div>
  );
}

function NavTab({ icon, label, active, to }: { icon: React.ReactNode; label: string; active?: boolean; to?: NavTo }) {
  const className = `flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${
    active ? "bg-hub-active text-hub-on-navy" : "text-hub-footer hover:text-hub-on-navy"
  }`;
  return (
    <li>
      {to ? (
        <Link to={to} className={className}>
          {icon}
          <span data-no-translate>{label}</span>
        </Link>
      ) : (
        <button type="button" className={className}>
          {icon}
          <span data-no-translate>{label}</span>
        </button>
      )}
    </li>
  );
}
