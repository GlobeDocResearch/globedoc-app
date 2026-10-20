import { Button } from "@/components/ui/button";
import { WorkspaceBrand, WorkspaceBell } from "@/components/WorkspaceBrand";
import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LinkIcon, User, Settings as SettingsIcon, FileText, LogOut } from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";
import { Hexagon } from "@/components/Hexagon";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/pro")({
  head: () => ({ meta: [{ title: "GlobeDoc Pro" }, { name: "description", content: "GlobeDoc healthcare professional workspace." }, { property: "og:title", content: "GlobeDoc Pro" }, { property: "og:description", content: "GlobeDoc healthcare professional workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ProLayout,
});

function ProLayout() {
  const isEntry = useRouterState({ select: (s) => s.matches.some((match) => match.routeId === "/pro/") });
  return isEntry ? <Outlet /> : <AuthenticatedProLayout />;
}

function AuthenticatedProLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        navigate({ to: "/signin" });
        return;
      }
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  if (!ready) {
    return <div className="min-h-screen bg-hub-bg" />;
  }

  return (
    <div className="min-h-screen bg-hub-bg pb-24">
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
    <header className="workspace-header grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-hub-navy px-5 py-3 sm:flex sm:justify-between">
      <WorkspaceBrand professional />
      <div className="flex shrink-0 items-center gap-2">
        <WorkspaceBell />
        <Button variant="plain" type="button" onClick={handleLogout} aria-label="Log out" className="workspace-header-control hidden items-center justify-center sm:inline-flex">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

export function ProBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();
  const tabs = [
    { to: "/connect" as const, icon: <LinkIcon className="h-5 w-5" />, label: t("nav.connect"), match: (p: string) => p.startsWith("/connect") },
    { to: "/pro/patients" as const, icon: <FileText className="h-5 w-5" />, label: t("nav.patients"), match: (p: string) => p.startsWith("/pro/patients") },
    { to: "/pro/profile" as const, icon: <User className="h-5 w-5" />, label: t("nav.profile"), match: (p: string) => p.startsWith("/pro/profile") },
    { to: "/pro/settings" as const, icon: <SettingsIcon className="h-5 w-5" />, label: t("nav.settings"), match: (p: string) => p.startsWith("/pro/settings") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 workspace-nav border-t border-hub-navy bg-hub-navy">
      <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-hub-active text-hub-on-navy" : "text-hub-footer hover:text-hub-on-navy"
                }`}
              >
                {tab.icon}
                <span data-no-translate>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
