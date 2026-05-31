import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, LinkIcon, User, Settings as SettingsIcon } from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pro")({
  head: () => ({ meta: [{ title: "GlobeDoc Pro" }] }),
  component: ProLayout,
});

function ProLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/signin" });
        return;
      }
      setReady(true);
    })();
  }, [navigate]);

  if (!ready) {
    return <div className="min-h-screen bg-[#F8F9FA]" />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <ProHeader />
      <Outlet />
      <ProBottomNav />
    </div>
  );
}

export function ProHeader() {
  return (
    <header className="flex items-center justify-between bg-white px-5 py-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <img src={logo} alt="GlobeDoc" className="h-11 w-11" />
        <span className="text-lg font-bold text-[#0D1B2A]">GlobeDoc</span>
        <span className="ml-1 rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Pro
        </span>
      </div>
    </header>
  );
}

export function ProBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/pro" as const, icon: <Users className="h-5 w-5" />, label: "Patients", match: (p: string) => p === "/pro" || p === "/pro/" },
    { to: "/connect" as const, icon: <LinkIcon className="h-5 w-5" />, label: "Connect", match: (p: string) => p.startsWith("/connect") },
    { to: "/pro/profile" as const, icon: <User className="h-5 w-5" />, label: "Profile", match: (p: string) => p.startsWith("/pro/profile") },
    { to: "/pro/settings" as const, icon: <SettingsIcon className="h-5 w-5" />, label: "Settings", match: (p: string) => p.startsWith("/pro/settings") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-100 bg-white">
      <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
        {tabs.map((t) => {
          const active = t.match(pathname);
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-blue-50 text-[#2563EB]" : "text-gray-500"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
