import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LogOut, Sparkles, Home as HomeIcon, Globe, FileText, Link as LinkIcon, User } from "lucide-react";

import logo from "@/assets/globedoc-logo.svg";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

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
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (mounted && profile?.first_name) setFirstName(profile.first_name);
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
      <header className="flex items-center justify-between bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="GlobeDoc" className="h-11 w-11" />
          <span className="text-lg font-bold text-[#0D1B2A]">GlobeDoc</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-6">
        {/* User section */}
        <section className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
              <img src={logo} alt="" className="h-[3.75rem] w-[3.75rem]" />
            </div>
            <span className="absolute bottom-0 left-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0D1B2A]">
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
              <p className="mt-1 text-sm text-[#2563EB]">{t("home.passportSubtitle")}</p>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" />
            {t("home.passportCta")}
          </button>
        </section>
      </main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-100 bg-white">
        <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
          <NavTab icon={<HomeIcon className="h-5 w-5" />} label={t("nav.home")} active />
          <NavTab icon={<Globe className="h-5 w-5" />} label={t("nav.passport")} />
          <NavTab icon={<FileText className="h-5 w-5" />} label={t("nav.records")} />
          <NavTab icon={<LinkIcon className="h-5 w-5" />} label={t("nav.pairing")} />
          <NavTab icon={<User className="h-5 w-5" />} label={t("nav.profile")} />
        </ul>
      </nav>
    </div>
  );
}

function NavTab({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <li>
      <button
        type="button"
        className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-medium ${
          active ? "bg-blue-50 text-[#2563EB]" : "text-gray-500"
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    </li>
  );
}
