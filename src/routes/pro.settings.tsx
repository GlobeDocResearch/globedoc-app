import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Lock, FileText, Shield, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LanguagePickerRow } from "@/components/LanguagePicker";
import { SaveButton } from "@/components/ui/save-button";

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

  const onChangePassword = async () => {
    if (newPw.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) throw new Error(error.message);
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
            <Globe className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-[#0D1B2A]">App Language</p>
              <p className="text-xs text-gray-500">Choose your interface language</p>
            </div>
          </div>
          <LanguagePickerRow />
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Bell className="h-5 w-5 shrink-0 text-gray-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0D1B2A]">Notifications</p>
              <p className="text-xs text-gray-500">Email and in-app alerts</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifications}
            onClick={() => setNotifications((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${notifications ? "bg-[#2563EB]" : "bg-gray-300"}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${notifications ? "translate-x-[22px]" : "translate-x-0.5"}`}
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
          <div className="space-y-3 bg-gray-50 px-5 py-4">
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password (min. 8 characters)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none"
            />
            <SaveButton
              onSave={onChangePassword}
              className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 flex items-center gap-2"
            >
              Update password
            </SaveButton>
          </div>
        )}
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

      <section className="mt-6 rounded-2xl bg-white shadow-sm">
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-sm font-bold text-[#0D1B2A]">Advanced Security & Privacy</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <ComingSoonRow icon="🔗" label="GlobeDoc Chain" subtitle="Decentralised audit trail powered by DAG-based blockchain technology" />
          <ComingSoonRow icon="🔐" label="Homomorphic Encryption" subtitle="Your data can be analysed without ever being decrypted" />
          <ComingSoonRow icon="🤖" label="Federated Learning" subtitle="AI that learns from your health data without it ever leaving your device" />
        </div>
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

function ComingSoonRow({ icon, label, subtitle }: { icon: string; label: string; subtitle?: string }) {
  return (
    <div aria-disabled className="flex items-center justify-between gap-3 px-5 py-4 opacity-50 cursor-not-allowed select-none">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-lg shrink-0" aria-hidden>{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        Coming Soon
      </span>
    </div>
  );
}

