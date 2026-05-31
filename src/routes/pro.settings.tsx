import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Lock, FileText, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pro/settings")({
  head: () => ({ meta: [{ title: "Settings — GlobeDoc Pro" }] }),
  component: SettingsTab,
});

function SettingsTab() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    setNewPw("");
    setPwOpen(false);
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/signin" });
  };

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-6">
      <h1 className="text-2xl font-bold text-[#0D1B2A]">Settings</h1>

      <section className="mt-4 divide-y divide-gray-100 rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-[#0D1B2A]">Notifications</p>
              <p className="text-xs text-gray-500">Email and in-app alerts</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifications}
            onClick={() => setNotifications((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${notifications ? "bg-[#2563EB]" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifications ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPwOpen((v) => !v)}
          className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-gray-50"
        >
          <Lock className="h-5 w-5 text-gray-500" />
          <div>
            <p className="text-sm font-semibold text-[#0D1B2A]">Security / Change password</p>
            <p className="text-xs text-gray-500">Update your account password</p>
          </div>
        </button>

        {pwOpen && (
          <form onSubmit={onChangePassword} className="space-y-3 bg-gray-50 px-5 py-4">
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password (min. 8 characters)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none"
            />
            <button
              type="submit"
              disabled={pwSaving}
              className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {pwSaving ? "Saving..." : "Update password"}
            </button>
          </form>
        )}

        <ComingSoonRow icon="🏦" label="Connect BankID" />
        <ComingSoonRow icon="🔐" label="Three-factor verification" />
        <ComingSoonRow icon="👁" label="Biometric login" />

        <Link to="/legal" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50">
          <Shield className="h-5 w-5 text-gray-500" />
          <div>
            <p className="text-sm font-semibold text-[#0D1B2A]">GDPR & Privacy Policy</p>
            <p className="text-xs text-gray-500">How we handle your data</p>
          </div>
        </Link>

        <Link to="/legal" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50">
          <FileText className="h-5 w-5 text-gray-500" />
          <div>
            <p className="text-sm font-semibold text-[#0D1B2A]">Terms of Service</p>
            <p className="text-xs text-gray-500">Conditions of use</p>
          </div>
        </Link>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="mt-8 w-full rounded-full px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        Log out
      </button>
    </main>
  );
}

function ComingSoonRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div aria-disabled className="flex items-center justify-between px-5 py-4 opacity-50 cursor-not-allowed select-none">
      <div className="flex items-center gap-3">
        <span className="text-lg" aria-hidden>{icon}</span>
        <p className="text-sm font-semibold text-gray-500">{label}</p>
      </div>
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        Coming Soon
      </span>
    </div>
  );
}
