import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type NavTo = "/home" | "/pairing" | "/health-pass" | "/profile" | "/travel" | "/records";
import { Bell, LogOut, Sparkles, Home as HomeIcon, Globe, Plane, Link as LinkIcon, User, FileText } from "lucide-react";

import logo from "@/assets/globedoc-logo.svg";
import { Hexagon } from "@/components/Hexagon";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import WorldMap, { type MapLocation } from "@/components/WorldMap";


export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [{ title: "Home — GlobeDoc" }],
  }),
  component: HomePage,
});

function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Top bar */}
      <header className="flex items-center justify-between bg-[#1D3F7C] px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Hexagon className="h-[50px] w-[50px]"><img src={logo} alt="GlobeDoc" className="h-9 w-9" /></Hexagon>
          <span className="text-lg font-bold text-white">GlobeDoc</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-6">
        {/* User section */}
        <section className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-100 shadow-sm ring-1 ring-gray-100">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <span className="absolute bottom-0 left-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1D438C]">
              {t("home.welcome").replace("{name}", displayName)}
            </h1>
            <p className="text-sm text-gray-500">{displayName}</p>
          </div>
        </section>

        {/* Health Passport card */}
        <section className="mt-6 rounded-2xl bg-[#EEF2FF] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB]">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#0D1B2A]">{t("home.passportTitle")}</h2>
              <p className="mt-1 text-sm text-[#0D1B2A]">{t("home.passportSubtitle")}</p>
            </div>
          </div>
          <Link
            to="/health-pass"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" />
            {t("home.passportCta")}
          </Link>
        </section>

        {/* World map of record locations */}
        <section className="mt-6 aspect-[800/380] w-full">
          <WorldMap locations={locations} />
        </section>
      </main>


      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#1D3F7C] bg-[#1D3F7C]">
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
    active ? "bg-white/15 text-white" : "text-white/75 hover:text-white"
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
