import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LogOut, Home as HomeIcon, Globe, FileText, Link as LinkIcon, User, ChevronRight, Check } from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";
import { supabase } from "@/integrations/supabase/client";
import { PassportSetupModal } from "@/components/PassportSetupModal";

export const Route = createFileRoute("/passport/")({
  head: () => ({ meta: [{ title: "Health Passport — GlobeDoc" }] }),
  component: PassportPage,
});

type SectionKey =
  | "medical-history"
  | "medications"
  | "allergies"
  | "vaccinations"
  | "heredity"
  | "lifestyle";

const SECTIONS: {
  key: SectionKey;
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
}[] = [
  { key: "medical-history", emoji: "🏥", title: "Medical History", subtitle: "Diagnoses, hospitalisations & operations", color: "#6B9FD4" },
  { key: "medications", emoji: "💊", title: "Medications", subtitle: "All current medications & supplements", color: "#6BBF8E" },
  { key: "allergies", emoji: "⚠️", title: "Allergies", subtitle: "Drug, food, environment & contrast reactions", color: "#E07B6B" },
  { key: "vaccinations", emoji: "💉", title: "Vaccinations", subtitle: "Complete immunisation record", color: "#9B7FD4" },
  { key: "heredity", emoji: "🧬", title: "Heredity", subtitle: "Family medical history & genetic conditions", color: "#E0A066" },
  { key: "lifestyle", emoji: "🏃", title: "Lifestyle & Risk", subtitle: "Habits that matter clinically", color: "#5BB8A8" },
];

function PassportPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [showSetup, setShowSetup] = useState(false);
  const [setupInitial, setSetupInitial] = useState<any>({});
  const [done, setDone] = useState<Record<SectionKey, boolean>>({
    "medical-history": false,
    "medications": false,
    "allergies": false,
    "vaccinations": false,
    "heredity": false,
    "lifestyle": false,
  });
  const completed = Object.values(done).filter(Boolean).length;
  const total = SECTIONS.length;
  const percent = Math.round((completed / total) * 100);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(user.id);
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (prof && !(prof as any).date_of_birth && !(prof as any).setup_dismissed_at) {
        setSetupInitial(prof);
        setShowSetup(true);
      }
      const sb = supabase as any;
      const [mc, hs, pm, ot, sm, di, vr, sv, tv, vc] = await Promise.all([
        supabase.from("medical_conditions").select("conditions_text, nothing_to_report").eq("user_id", user.id).maybeSingle(),
        supabase.from("hospital_stays").select("id").eq("user_id", user.id).limit(1),
        supabase.from("prescription_medications").select("id").eq("user_id", user.id).limit(1),
        supabase.from("otc_supplements").select("id").eq("user_id", user.id).limit(1),
        supabase.from("stopped_medications").select("id").eq("user_id", user.id).limit(1),
        supabase.from("drug_intolerances").select("intolerances_text, nothing_to_report").eq("user_id", user.id).maybeSingle(),
        sb.from("vaccination_records").select("id").eq("user_id", user.id).limit(1),
        sb.from("standard_vaccines").select("id").eq("user_id", user.id).eq("received", true).limit(1),
        sb.from("travel_vaccines").select("id").eq("user_id", user.id).limit(1),
        sb.from("vaccination_certificates").select("ihr_card, contraindication_notes, nothing_to_report").eq("user_id", user.id).maybeSingle(),
      ]);
      const mhDone =
        !!mc.data?.nothing_to_report ||
        !!(mc.data?.conditions_text && mc.data.conditions_text.trim().length > 0) ||
        !!(hs.data && hs.data.length > 0);
      const medsDone =
        !!di.data?.nothing_to_report ||
        !!(di.data?.intolerances_text && di.data.intolerances_text.trim().length > 0) ||
        !!(pm.data && pm.data.length > 0) ||
        !!(ot.data && ot.data.length > 0) ||
        !!(sm.data && sm.data.length > 0);
      const vaxDone =
        !!vc.data?.nothing_to_report ||
        !!(vr.data && vr.data.length > 0) ||
        !!(sv.data && sv.data.length > 0) ||
        !!(tv.data && tv.data.length > 0) ||
        !!vc.data?.ihr_card ||
        !!(vc.data?.contraindication_notes && vc.data.contraindication_notes.trim().length > 0);
      setDone((d) => ({ ...d, "medical-history": mhDone, medications: medsDone, vaccinations: vaxDone }));
    })();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const goSection = (key: SectionKey) => navigate({ to: "/passport/$section", params: { section: key } });


  return (
    <div className="min-h-screen bg-[#0D1B2A] pb-24">
      {/* Top bar */}
      <header className="flex items-center justify-between bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="GlobeDoc" className="h-11 w-11" />
          <span className="text-lg font-bold text-[#0D1B2A]">GlobeDoc</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
            <Bell className="h-5 w-5" />
          </button>
          <button type="button" onClick={handleLogout} aria-label="Log out" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Section 1 — Progress */}
      <section className="px-5 pt-6">
        <h1 className="text-2xl font-bold text-white">Health Passport</h1>
        <p className="mt-1 text-sm text-gray-400">My Passport · {completed}/{total} sections</p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#1A2B3C]">
          <div className="h-full rounded-full bg-[#3B82F6] transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-xs text-gray-500">{percent}% complete</p>
      </section>

      {/* Section 2 — Hexagon map (tight pointy-top honeycomb) */}
      <section className="mt-6 px-4">
        <div className="relative mx-auto" style={{ width: 300, height: 289 }}>
          {/* Center */}
          <Hex style={{ left: 100, top: 86 }} bg="#1A2B3C" onClick={() => {}}>
            <img src={logo} alt="" className="h-7 w-7" />
            <span className="mt-1 text-[9px] font-bold leading-tight text-white text-center">GlobeDoc<br/>Health Passport</span>
            <span className="text-[11px] font-bold text-[#3B82F6]">{completed}/{total}</span>
          </Hex>
          {/* Top-left: Medical History */}
          <Hex style={{ left: 50, top: 0 }} bg={SECTIONS[0].color} onClick={() => goSection(SECTIONS[0].key)}>
            <span className="text-xl">{SECTIONS[0].emoji}</span>
            <span className="mt-1 text-[10px] font-bold leading-tight text-white text-center">Medical<br/>History</span>
            {done["medical-history"] && <Check className="mt-0.5 h-3.5 w-3.5 text-green-300" />}
          </Hex>

          {/* Top-right: Medications */}
          <Hex style={{ left: 150, top: 0 }} bg={SECTIONS[1].color} onClick={() => goSection(SECTIONS[1].key)}>
            <span className="text-xl">{SECTIONS[1].emoji}</span>
            <span className="mt-1 text-[11px] font-bold text-white">Medications</span>
            {done["medications"] && <Check className="mt-0.5 h-3.5 w-3.5 text-green-300" />}
          </Hex>
          {/* Left: Allergies */}
          <Hex style={{ left: 0, top: 86 }} bg={SECTIONS[2].color} onClick={() => goSection(SECTIONS[2].key)}>
            <span className="text-xl">{SECTIONS[2].emoji}</span>
            <span className="mt-1 text-[11px] font-bold text-white">Allergies</span>
          </Hex>
          {/* Right: Vaccinations */}
          <Hex style={{ left: 200, top: 86 }} bg={SECTIONS[3].color} onClick={() => goSection(SECTIONS[3].key)}>
            <span className="text-xl">{SECTIONS[3].emoji}</span>
            <span className="mt-1 text-[11px] font-bold text-white">Vaccinations</span>
            {done["vaccinations"] && <Check className="mt-0.5 h-3.5 w-3.5 text-green-300" />}
          </Hex>
          {/* Bottom-left: Heredity */}
          <Hex style={{ left: 50, top: 173 }} bg={SECTIONS[4].color} onClick={() => goSection(SECTIONS[4].key)}>
            <span className="text-xl">{SECTIONS[4].emoji}</span>
            <span className="mt-1 text-[11px] font-bold text-white">Heredity</span>
          </Hex>
          {/* Bottom-right: Lifestyle & Risk */}
          <Hex style={{ left: 150, top: 173 }} bg={SECTIONS[5].color} onClick={() => goSection(SECTIONS[5].key)}>
            <span className="text-xl">{SECTIONS[5].emoji}</span>
            <span className="mt-1 text-[10px] font-bold leading-tight text-white text-center">Lifestyle<br/>& Risk</span>
          </Hex>
        </div>
      </section>

      {/* Section 3 — List */}
      <section className="mt-6 space-y-3 px-5">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => goSection(s.key)}
            className="flex w-full items-center gap-4 rounded-2xl bg-[#1A2B3C] p-4 text-left transition-colors hover:bg-[#22364a]"
          >
            <span className="text-2xl">{s.emoji}</span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">{s.title}</h3>
              <p className="text-xs text-gray-400">{s.subtitle}</p>
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-600">
              {done[s.key] && <Check className="h-4 w-4 text-green-400" />}
            </span>

          </button>
        ))}

        <Link
          to="/pairing"
          className="mt-4 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#3B5BDB] to-[#0CA678] p-4 text-white shadow-sm hover:opacity-95"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <LinkIcon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-sm font-bold">Pairing Code</h3>
            <p className="text-xs text-white/80">Share your passport with a clinician</p>
          </div>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </section>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-100 bg-white">
        <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
          <NavTab to="/home" icon={<HomeIcon className="h-5 w-5" />} label="Home" />
          <NavTab to="/passport" icon={<Globe className="h-5 w-5" />} label="Passport" active />
          <NavTab icon={<FileText className="h-5 w-5" />} label="Records" />
          <NavTab to="/pairing" icon={<LinkIcon className="h-5 w-5" />} label="Pairing" />
          <NavTab to="/profile" icon={<User className="h-5 w-5" />} label="Profile" />
        </ul>
      </nav>

      {showSetup && userId && (
        <PassportSetupModal userId={userId} initial={setupInitial} onDone={async () => {
          setShowSetup(false);
          // Apply Sweden/birth-year pre-checks for standard vaccines
          const { data: p } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
          const prof: any = p;
          if (prof?.nationality === "Sweden" && prof?.date_of_birth) {
            const year = new Date(prof.date_of_birth).getFullYear();
            const toCheck: string[] = [];
            if (year < 1976) toCheck.push("BCG");
            if (year >= 1993) toCheck.push("DTP/DTaP", "Polio (IPV)", "MMR", "Hib");
            for (const v of toCheck) {
              await supabase.from("standard_vaccines").insert({ user_id: userId, vaccine_name: v, received: true } as any);
            }
          }
        }} />
      )}
    </div>
  );
}

function Hex({ children, bg, style, onClick }: { children: React.ReactNode; bg: string; style: React.CSSProperties; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute flex h-[116px] w-[100px] flex-col items-center justify-center p-2 text-center transition-transform duration-200 hover:scale-[1.06] active:scale-[1.06]"
      style={{
        ...style,
        background: bg,
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
      }}
    >
      {children}
    </button>
  );
}

function NavTab({ icon, label, active, to }: { icon: React.ReactNode; label: string; active?: boolean; to?: "/home" | "/passport" | "/pairing" | "/profile" }) {
  const className = `flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-medium ${
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
