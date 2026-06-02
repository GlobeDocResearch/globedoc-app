import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Stethoscope, LinkIcon, User, Settings as SettingsIcon, FileText, Bell, LogOut } from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";
import { Hexagon } from "@/components/Hexagon";
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
  const navigate = useNavigate();
  const handleLogout = async () => { await supabase.auth.signOut(); navigate({ to: "/signin" }); };
  return (
    <header className="flex items-center justify-between bg-[#1D3F7C] px-5 py-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <Hexagon className="h-[50px] w-[50px]"><img src={logo} alt="GlobeDoc" className="h-9 w-9" /></Hexagon>
        <span className="text-lg font-bold text-white">GlobeDoc</span>
        <span className="ml-1 rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Pro
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
          <Bell className="h-5 w-5" />
        </button>
        <button type="button" onClick={handleLogout} aria-label="Log out" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

export function ProBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/pro" as const, icon: <Users className="h-5 w-5" />, label: "Patients", match: (p: string) => p === "/pro" || p === "/pro/" },
    { to: "/connect" as const, icon: <LinkIcon className="h-5 w-5" />, label: "Connect", match: (p: string) => p.startsWith("/connect") },
    { to: "/pro/records" as const, icon: <FileText className="h-5 w-5" />, label: "Records", match: (p: string) => p.startsWith("/pro/records") },
    { to: "/pro/profile" as const, icon: <User className="h-5 w-5" />, label: "Profile", match: (p: string) => p.startsWith("/pro/profile") },
    { to: "/pro/settings" as const, icon: <SettingsIcon className="h-5 w-5" />, label: "Settings", match: (p: string) => p.startsWith("/pro/settings") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#1D3F7C] bg-[#1D3F7C]">
      <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
        {tabs.map((t) => {
          const active = t.match(pathname);
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-white/15 text-white" : "text-white/75 hover:text-white"
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
