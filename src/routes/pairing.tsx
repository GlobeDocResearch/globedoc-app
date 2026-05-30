import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link as LinkIcon, Copy, Check, Home as HomeIcon, Globe, Plane, User, FileText } from "lucide-react";
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

function PairingPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : 0;
  const expired = code !== null && remainingMs <= 0;
  const mm = Math.floor(remainingMs / 60000);
  const ss = Math.floor((remainingMs % 60000) / 1000);
  const timer = `${mm}:${ss.toString().padStart(2, "0")}`;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      const newCode = generateCode();
      const exp = new Date(Date.now() + 10 * 60 * 1000);
      const { error } = await supabase.from("pairing_codes").insert({
        user_id: user.id,
        code: newCode,
        expires_at: exp.toISOString(),
      });
      if (error) throw error;
      setCode(newCode);
      setExpiresAt(exp.getTime());
      setCopied(false);
    } catch (e) {
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Top section */}
      <header className="flex items-center justify-between bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="GlobeDoc" className="h-11 w-11" />
          <span className="text-lg font-bold text-[#0D1B2A]">GlobeDoc</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-5">
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Pairing Code</h1>
        <p className="mt-1 text-sm text-gray-500">
          Share your Health Passport with a clinician
        </p>

        {/* Banner */}
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-gray-100 p-4 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
            <LinkIcon className="h-6 w-6 text-[#0D1B2A]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0D1B2A]">Share your GlobeDoc Health Passport</h2>
            <p className="text-xs text-gray-600">Valid for 10 minutes · One-time use</p>
          </div>
        </div>

        {/* Card */}
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          {!code || expired ? (
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <LinkIcon className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[#0D1B2A]">
                {expired ? "Code expired" : "No active code"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Generate a code when you are with a clinician
              </p>
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
                <div className="text-center text-4xl font-bold tracking-[0.5em] text-[#0D1B2A]">
                  {code}
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-gray-500">
                Expires in <span className="font-semibold text-[#0D1B2A]">{timer}</span>
              </p>
            </div>
          )}
        </div>

        {/* Action */}
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
      </main>

      {/* Bottom nav */}
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
