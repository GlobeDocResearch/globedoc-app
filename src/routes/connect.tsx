import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link as LinkIcon, CheckCircle2, Loader2 } from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";
import { Hexagon } from "@/components/Hexagon";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addPairing, loadPairings, getActiveSessionsFromSupabase, getPastSessionsFromSupabase, type ActiveSession, type PastSession } from "@/lib/proPairings";
import { ProBottomNav, ProHeader } from "./pro";

export const Route = createFileRoute("/connect")({
  head: () => ({ meta: [{ title: "Connect with Patient — GlobeDoc" }] }),
  component: ConnectPageWrapper,
});

function ConnectPageWrapper() {
  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setMeta(user.user_metadata || {});
        setIsAuthed(true);
      }
      setChecked(true);
    })();
  }, []);

  if (!checked) return <div className="min-h-screen bg-[#F8F9FA]" />;

  return (
    <div className={isAuthed ? "min-h-screen bg-[#F8F9FA] pb-24" : ""}>
      {isAuthed && <ProHeader />}
      <ConnectPage isAuthed={isAuthed} userId={userId} proMeta={meta} />
      {isAuthed && <ProBottomNav />}
    </div>
  );
}

type LastConnection = {
  id: string;
  patient_name: string;
  expires_at: string;
};

type DuplicateInfo = {
  code: string;
  pro_name: string;
  pro_title: string | null;
  institution: string | null;
  existing_pro_name: string;
  current_expires_at: string;
};

const EXTEND_OPTIONS = [
  { value: 10, label: "10 minutes" },
  { value: 60, label: "1 hour" },
  { value: 60 * 24, label: "24 hours" },
  { value: 60 * 24 * 7, label: "7 days" },
];

function formatRemaining(ms: number) {
  if (ms <= 0) return "Expired";
  const totalMinutes = Math.ceil(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function formatDuration(pairedAt: string, expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - new Date(pairedAt).getTime();
  if (ms <= 0) return "—";
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

function formatActualDuration(pairedAt: string, expiresAt: string, revokedAt: string | null) {
  const end = revokedAt ? new Date(revokedAt).getTime() : new Date(expiresAt).getTime();
  const ms = Math.max(0, end - new Date(pairedAt).getTime());
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} minute${m === 1 ? "" : "s"}`;
  if (m === 0) return `${h} hour${h === 1 ? "" : "s"}`;
  return `${h} hour${h === 1 ? "" : "s"} ${m} minute${m === 1 ? "" : "s"}`;
}

function ConnectPage({ isAuthed, userId, proMeta }: { isAuthed: boolean; userId: string; proMeta: any }) {
  const navigate = useNavigate();
  const [pairings, setPairings] = useState<ActiveSession[]>([]);
  const [lastConnection, setLastConnection] = useState<LastConnection | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);
  const [extendMinutes, setExtendMinutes] = useState(60);
  const [extending, setExtending] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const [past, setPast] = useState<PastSession[]>([]);

  useEffect(() => {
    if (!isAuthed || !userId) return;
    let cancelled = false;
    (async () => {
      const [active, pastRows] = await Promise.all([
        getActiveSessionsFromSupabase(userId),
        getPastSessionsFromSupabase(userId),
      ]);
      if (cancelled) return;
      setPairings(active);
      setPast(pastRows);
    })();
    return () => { cancelled = true; };
  }, [isAuthed, userId, lastConnection]);

  const handlePaired = (result: { session_token: string; patient_name: string; expires_at: string }) => {
    if (userId) {
      addPairing(userId, {
        id: result.session_token,
        patient_name: result.patient_name,
        patient_dob: null,
        paired_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        expires_at: result.expires_at,
      });
    }
    setLastConnection({
      id: result.session_token,
      patient_name: result.patient_name,
      expires_at: result.expires_at,
    });
    toast.success(`Connected to ${result.patient_name}`);
  };

  const handleExtend = async () => {
    if (!duplicate) return;
    setExtending(true);
    try {
      const res = await fetch("/api/public/connect/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: duplicate.code,
          pro_name: duplicate.pro_name,
          institution: duplicate.institution,
          minutes: extendMinutes,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Could not extend"); return; }
      handlePaired({
        session_token: json.session_token,
        patient_name: json.patient_name || "Patient",
        expires_at: json.expires_at,
      });
      toast.success("Access extended");
      setDuplicate(null);
    } finally { setExtending(false); }
  };

  const removeConnection = async (id: string) => {
    if (!userId) return;
    try {
      const res = await fetch("/api/public/connect/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Could not revoke access");
        return;
      }
      const [active, pastRows] = await Promise.all([
        getActiveSessionsFromSupabase(userId),
        getPastSessionsFromSupabase(userId),
      ]);
      setPairings(active);
      setPast(pastRows);
      if (lastConnection?.id === id) setLastConnection(null);
      toast.success("Access revoked");
    } catch (e: any) {
      toast.error(e?.message || "Could not revoke access");
    }
  };

  return (
    <div className={isAuthed ? "" : "min-h-screen bg-[#F8F9FA]"}>
      {!isAuthed && (
        <header className="flex items-center justify-between bg-[#1D3F7C] px-5 py-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Hexagon className="h-[50px] w-[50px]"><img src={logo} alt="GlobeDoc" className="h-9 w-9" /></Hexagon>
            <span className="text-lg font-bold text-white">GlobeDoc</span>
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-xl px-5 py-8">
        <h1 className="text-2xl font-bold text-[#0D1B2A]">
          Connect with a pairing code to your patient's GlobeDoc
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter the 6-character pairing code shared by the patient.
        </p>

        {lastConnection && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#0D1B2A]">
                Connected to {lastConnection.patient_name}
              </p>
              <p className="text-xs text-green-800">
                Access expires {new Date(lastConnection.expires_at).toLocaleString()}
              </p>
              <Link
                to="/pro/records"
                className="mt-2 inline-block text-xs font-semibold text-[#1D3F7C] underline underline-offset-2"
              >
                View patient records →
              </Link>
            </div>
          </div>
        )}

        {isAuthed ? (
          <SignedInProForm proMeta={proMeta} proUserId={userId} onPaired={handlePaired} onDuplicate={setDuplicate} />
        ) : (
          <UnauthedConnectFlow onPaired={handlePaired} onDuplicate={setDuplicate} navigate={navigate} />
        )}

        {isAuthed && (
          <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#0D1B2A]">Active patient connections</h2>
            {pairings.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No active connections yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {pairings.map(p => {
                  const remaining = new Date(p.expires_at).getTime() - now;
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0D1B2A]">{p.patient_name}</p>
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(p.expires_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Time remaining: {formatRemaining(remaining)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeConnection(p.id)}
                        className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {isAuthed && past.length > 0 && (
          <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#0D1B2A]">Past connections</h2>
            <ul className="mt-3 space-y-2">
              {past.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-gray-100 p-3"
                >
                  <p className="truncate text-sm font-semibold text-[#0D1B2A]">{p.patient_name}</p>
                  <p className="text-xs text-gray-500">
                    Paired: {new Date(p.paired_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Duration granted: {formatDuration(p.paired_at, p.expires_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Active for: {formatActualDuration(p.paired_at, p.expires_at, p.revoked_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.revoked_at
                      ? "Access revoked"
                      : `Expired ${new Date(p.expires_at).toLocaleString()}`}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {duplicate && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-[#0D1B2A]">Active connection already exists</h3>
            <p className="mt-2 text-sm text-gray-600">
              You already have an active connection with{" "}
              <span className="font-semibold text-[#0D1B2A]">{duplicate.existing_pro_name}</span>.
              Would you like to extend their access instead?
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Current access expires {new Date(duplicate.current_expires_at).toLocaleString()}
            </p>

            <div className="mt-4">
              <p className="text-xs font-semibold text-[#0D1B2A]">Extend by</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {EXTEND_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExtendMinutes(opt.value)}
                    className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                      extendMinutes === opt.value
                        ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDuplicate(null)}
                disabled={extending}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExtend}
                disabled={extending}
                className="flex items-center gap-2 rounded-full bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {extending && <Loader2 className="h-4 w-4 animate-spin" />}
                Extend access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type PairResult = { session_token: string; patient_name: string; expires_at: string };

function SignedInProForm({ proMeta, onPaired, onDuplicate }: { proMeta: any; onPaired: (r: PairResult) => void; onDuplicate: (d: DuplicateInfo) => void }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) { toast.error("Enter the 6-character code"); return; }
    setSubmitting(true);
    try {
      const proName = proMeta?.full_name || "Healthcare Professional";
      const proTitle = proMeta?.pro_title || proMeta?.specialty || null;
      const inst = proMeta?.institution || null;
      const res = await fetch("/api/public/connect/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          pro_name: proName,
          pro_title: proTitle,
          institution: inst,
          access_level: "passport_records",
          gdpr_consent: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Could not connect"); return; }
      if (json.duplicate) {
        onDuplicate({
          code: json.code,
          pro_name: proName,
          pro_title: proTitle,
          institution: inst,
          existing_pro_name: json.pro_name,
          current_expires_at: json.current_expires_at,
        });
        return;
      }
      onPaired({
        session_token: json.session_token,
        patient_name: json.patient_name || "Patient",
        expires_at: json.expires_at,
      });
      setCode("");
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <label className="text-sm font-semibold text-[#0D1B2A]">Pairing code</label>
        <input
          type="text"
          required
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-center text-2xl font-bold tracking-[0.4em] uppercase text-[#0D1B2A] focus:border-[#2563EB] focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || code.trim().length !== 6}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
        {submitting ? "Connecting..." : "Connect to patient"}
      </button>
    </form>
  );
}

const TITLES = ["Dr", "Prof", "Nurse", "Physiotherapist", "Other"] as const;

function UnauthedConnectFlow({ onPaired, onDuplicate, navigate }: { onPaired: (r: PairResult) => void; onDuplicate: (d: DuplicateInfo) => void; navigate: ReturnType<typeof useNavigate> }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState<(typeof TITLES)[number] | "">("");
  const [institution, setInstitution] = useState("");
  const [gdpr, setGdpr] = useState(false);
  const [busy, setBusy] = useState(false);

  const pair = async (proName: string, proTitle: string | null, inst: string | null) => {
    const res = await fetch("/api/public/connect/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code.trim().toUpperCase(),
        pro_name: proName,
        pro_title: proTitle,
        institution: inst,
        access_level: "passport_records",
        gdpr_consent: true,
      }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || "Could not pair"); return false; }
    if (json.duplicate) {
      onDuplicate({
        code: json.code,
        pro_name: proName,
        pro_title: proTitle,
        institution: inst,
        existing_pro_name: json.pro_name,
        current_expires_at: json.current_expires_at,
      });
      return true;
    }
    onPaired({
      session_token: json.session_token,
      patient_name: json.patient_name || "Patient",
      expires_at: json.expires_at,
    });
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) { toast.error("Enter the 6-character code"); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { toast.error("Enter a valid email"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (mode === "signup") {
      if (!fullName.trim()) { toast.error("Full name is required"); return; }
      if (!title) { toast.error("Please select a title"); return; }
      if (!institution.trim()) { toast.error("Institution is required"); return; }
      if (!gdpr) { toast.error("Please confirm the professional declaration"); return; }
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) { toast.error(error.message); return; }
        const u = data.user;
        if (u?.user_metadata?.account_type !== "professional") {
          await supabase.auth.signOut();
          toast.error("This account is not a Professional account.");
          return;
        }
        const m = u.user_metadata || {};
        await pair(m.full_name || email.trim(), m.pro_title || m.specialty || null, m.institution || null);
      } else {
        const { error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/verified-pro`,
            data: {
              account_type: "professional",
              full_name: fullName.trim(),
              pro_title: title,
              institution: institution.trim(),
              consent_pro_declaration_at: new Date().toISOString(),
            },
          },
        });
        if (signUpErr) { toast.error(signUpErr.message); return; }
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInErr) {
          toast.success("Account created. Please confirm your email to finish connecting.");
          navigate({ to: "/confirm-email-pro" });
          return;
        }
        await pair(fullName.trim(), title || null, institution.trim());
      }
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <label className="text-sm font-semibold text-[#0D1B2A]">Pairing code</label>
        <input
          type="text"
          required
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-center text-2xl font-bold tracking-[0.4em] uppercase text-[#0D1B2A] focus:border-[#2563EB] focus:outline-none"
        />
      </div>

      {mode === "signup" && (
        <>
          <Field label="Full name">
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Title">
            <select value={title} onChange={(e) => setTitle(e.target.value as (typeof TITLES)[number])} className={inputCls} required>
              <option value="">Select a title</option>
              {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Institution / Hospital">
            <input type="text" required value={institution} onChange={(e) => setInstitution(e.target.value)} className={inputCls} />
          </Field>
        </>
      )}

      <Field label={mode === "signup" ? "Professional email" : "Email"}>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Password">
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
      </Field>

      {mode === "signup" && (
        <label className="flex items-start gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={gdpr} onChange={(e) => setGdpr(e.target.checked)} className="mt-0.5" />
          <span>
            I confirm I am a licensed healthcare professional and will handle patient data in accordance with GDPR. All access is audit-logged.
          </span>
        </label>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
        {busy ? "Connecting..." : mode === "signin" ? "Sign in & connect" : "Create account & connect"}
      </button>

      <p className="text-center text-xs text-gray-500">
        {mode === "signin" ? (
          <>Don't have a Pro account?{" "}
            <button type="button" onClick={() => setMode("signup")} className="font-semibold text-[#2563EB] hover:underline">
              Create one
            </button>
          </>
        ) : (
          <>Already have a Pro account?{" "}
            <button type="button" onClick={() => setMode("signin")} className="font-semibold text-[#2563EB] hover:underline">
              Sign in
            </button>
          </>
        )}
      </p>
    </form>
  );
}

const inputCls = "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold text-[#0D1B2A]">{label}</label>
      {children}
    </div>
  );
}
