import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link as LinkIcon, Copy, Check, Home as HomeIcon, Globe, Plane, User, FileText, Trash2, Clock } from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/pairing")({
  head: () => ({ meta: [{ title: "Pairing Code — GlobeDoc" }] }),
  component: PairingPage,
});

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const VALIDITY_OPTIONS = [
  { value: 10, label: "10 minutes" },
  { value: 60, label: "1 hour" },
  { value: 60 * 24, label: "24 hours" },
  { value: 60 * 24 * 7, label: "7 days" },
];

const ACCESS_LABELS: Record<string, string> = {
  passport_records: "Full Passport + Records",
  records_only: "Records only",
  records_add: "Records + can add entries",
  passport_suggest: "Passport read + can suggest edits",
};

type ProSession = {
  id: string;
  pro_name: string;
  pro_title: string | null;
  institution: string | null;
  access_level: string;
  paired_at: string;
  last_accessed_at: string | null;
  expires_at: string;
  revoked_at: string | null;
};

function PairingPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validity, setValidity] = useState(10);
  const [pros, setPros] = useState<ProSession[]>([]);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadPros = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any)
      .from("pro_sessions")
      .select("id, pro_name, pro_title, institution, access_level, paired_at, last_accessed_at, expires_at, revoked_at")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("paired_at", { ascending: false });
    setPros((data as ProSession[]) || []);
  };

  useEffect(() => {
    loadPros();
  }, []);

  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : 0;
  const expired = code !== null && remainingMs <= 0;
  const totalSec = Math.floor(remainingMs / 1000);
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  const timer = hh > 0
    ? `${hh}:${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`
    : `${mm}:${ss.toString().padStart(2, "0")}`;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      const newCode = generateCode();
      const exp = new Date(Date.now() + validity * 60 * 1000);
      const { error } = await supabase.from("pairing_codes").insert({
        user_id: user.id,
        code: newCode,
        expires_at: exp.toISOString(),
        validity_minutes: validity,
      } as any);
      if (error) throw error;
      setCode(newCode);
      setExpiresAt(exp.getTime());
      setCopied(false);
    } catch {
      toast.error("Could not generate code");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const confirmRevoke = async () => {
    if (!revokeId) return;
    const { error } = await (supabase as any)
      .from("pro_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", revokeId);
    if (error) toast.error("Could not revoke");
    else toast.success("Access revoked");
    setRevokeId(null);
    loadPros();
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString();
  const fmtDateTime = (s: string) => new Date(s).toLocaleString();

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <header className="flex items-center justify-between bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="GlobeDoc" className="h-11 w-11" />
          <span className="text-lg font-bold text-[#0D1B2A]">GlobeDoc</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-5">
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Pairing Code</h1>
        <p className="mt-1 text-sm text-gray-500">Share your Health Passport with a clinician</p>

        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-gray-100 p-4 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
            <LinkIcon className="h-6 w-6 text-[#0D1B2A]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0D1B2A]">Share your GlobeDoc Health Passport</h2>
            <p className="text-xs text-gray-600">One-time use · You choose validity</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          {!code || expired ? (
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <LinkIcon className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[#0D1B2A]">
                {expired ? "Code expired" : "No active code"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Generate a code when you are with a clinician</p>
            </div>
          ) : (
            <div>
              <div className="relative rounded-xl bg-gray-50 px-4 py-6">
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy code"
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm hover:text-[#0D1B2A]"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
                <div className="text-center text-4xl font-bold tracking-[0.5em] text-[#0D1B2A]">{code}</div>
              </div>
              <p className="mt-4 text-center text-sm text-gray-500">
                Expires in <span className="font-semibold text-[#0D1B2A]">{timer}</span>
              </p>
            </div>
          )}
        </div>

        {/* Validity selector */}
        {(!code || expired) && (
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#0D1B2A]">
              <Clock className="h-4 w-4" /> Code validity
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {VALIDITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValidity(opt.value)}
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                    validity === opt.value
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!code || expired ? (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
          >
            <LinkIcon className="h-4 w-4" />
            {loading ? "Generating..." : "Generate pairing code"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="mt-4 w-full text-center text-sm font-semibold text-[#2563EB] hover:underline"
          >
            Generate new code
          </button>
        )}

        {/* My paired professionals */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-[#0D1B2A]">My paired professionals</h2>
          {pros.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-white p-5 text-center shadow-sm">
              <p className="text-sm text-gray-500">
                No paired professionals yet — share your pairing code with a clinician to connect.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {pros.map((p) => (
                <li key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[#0D1B2A]">
                        {p.pro_name}
                        {p.pro_title ? <span className="font-normal text-gray-600"> · {p.pro_title}</span> : null}
                      </h3>
                      {p.institution && <p className="text-xs text-gray-600">{p.institution}</p>}
                      <p className="mt-2 text-xs text-gray-500">Paired since {fmtDate(p.paired_at)}</p>
                      <p className="text-xs text-gray-500">
                        Access: <span className="font-medium text-[#0D1B2A]">{ACCESS_LABELS[p.access_level] || p.access_level}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Last accessed: {p.last_accessed_at ? fmtDateTime(p.last_accessed_at) : "—"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRevokeId(p.id)}
                      className="flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Revoke
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Revoke confirmation */}
      {revokeId && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-[#0D1B2A]">Revoke access?</h3>
            <p className="mt-1 text-sm text-gray-600">
              This professional will immediately lose access to your Passport and Records.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevokeId(null)}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRevoke}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Revoke access
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-100 bg-white">
        <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
          <NavTab to="/home" icon={<HomeIcon className="h-5 w-5" />} label="Home" />
          <NavTab to="/passport" icon={<Globe className="h-5 w-5" />} label="Passport" />
          <NavTab to="/travel" icon={<Plane className="h-5 w-5" />} label="Travel" />
          <NavTab to="/records" icon={<FileText className="h-5 w-5" />} label="Records" />
          <NavTab to="/pairing" icon={<LinkIcon className="h-5 w-5" />} label="Pairing" active />
          <NavTab to="/profile" icon={<User className="h-5 w-5" />} label="Profile" />
        </ul>
      </nav>
    </div>
  );
}

function NavTab({ icon, label, active, to }: { icon: React.ReactNode; label: string; active?: boolean; to?: "/home" | "/passport" | "/travel" | "/records" | "/pairing" | "/profile" }) {
  const className = `flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${
    active ? "bg-blue-50 text-[#2563EB]" : "text-gray-500"
  }`;
  return (
    <li>
      {to ? (
        <Link to={to} className={className}>
          {icon}
          <span>{label}</span>
        </Link>
      ) : (
        <button type="button" className={className}>
          {icon}
          <span>{label}</span>
        </button>
      )}
    </li>
  );
}
