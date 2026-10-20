import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, FileText, Shield, Globe, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LanguagePickerRow } from "@/components/LanguagePicker";
import { SaveButton } from "@/components/ui/save-button";
import { deleteMyAccount } from "@/lib/account.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pro/settings")({
  head: () => ({ meta: [{ title: "Settings — GlobeDoc Pro" }, { name: "description", content: "Manage your GlobeDoc professional account settings." }, { property: "og:title", content: "Settings — GlobeDoc Pro" }, { property: "og:description", content: "Manage your GlobeDoc professional account settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SettingsTab,
});

function SettingsTab() {
  const navigate = useNavigate();
  
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteMyAccount();
      await supabase.auth.signOut();
      toast.success("Account deleted");
      navigate({ to: "/signin" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not delete account");
      setDeleting(false);
    }
  };

  

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
      <h1 className="workspace-heading text-2xl font-bold text-[#0D1B2A]">Settings</h1>

      <section className="mt-4 divide-y divide-gray-100 rounded-2xl bg-card  workspace-card">
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
              className="rounded-full bg-hub-navy px-4 py-2 text-sm font-semibold text-hub-on-navy hover:opacity-90 flex items-center gap-2"
            >
              Update password
            </SaveButton>
          </div>
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

      <section className="mt-6 rounded-2xl bg-card  workspace-card">
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-sm font-bold text-[#0D1B2A]">Advanced Security & Privacy</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <ComingSoonRow icon="🔗" label="GlobeDoc Chain" subtitle="Decentralised audit trail powered by DAG-based blockchain technology" />
          <ComingSoonRow icon="🔐" label="Homomorphic Encryption" subtitle="Your data can be analysed without ever being decrypted" />
          <ComingSoonRow icon="🤖" label="Federated Learning" subtitle="AI that learns from your health data without it ever leaving your device" />
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-card  workspace-card">
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-red-50"
        >
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-600">Delete my account</p>
            <p className="text-xs text-gray-500">Permanently erase all your data (GDPR Art. 17)</p>
          </div>
        </button>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="mt-8 w-full rounded-full px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        Log out
      </button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete my account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all associated data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={onDeleteAccount} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

