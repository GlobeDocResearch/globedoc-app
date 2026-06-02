import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LogOut, Home as HomeIcon, Globe, Plane, Link as LinkIcon, User, ChevronRight, FileText } from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";
import { Hexagon } from "@/components/Hexagon";
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
  { key: "medical-history", emoji: "🏥", title: "History", subtitle: "Diagnoses, hospitalisations & operations", color: "#1D3A6B" },
  { key: "medications", emoji: "💊", title: "Medications", subtitle: "All current medications & supplements", color: "#0F8BE8" },
  { key: "vaccinations", emoji: "💉", title: "Vaccinations", subtitle: "Complete immunisation record", color: "#F5D33A" },
  { key: "lifestyle", emoji: "🏃", title: "Lifestyle & Risks", subtitle: "Habits that matter clinically", color: "#64C8F0" },
  { key: "heredity", emoji: "🧬", title: "Heredity", subtitle: "Family medical history & genetic conditions", color: "#9E9E9E" },
  { key: "allergies", emoji: "⚠️", title: "Allergies", subtitle: "Drug, food, environment & contrast reactions", color: "#C93535" },
];

// Sections whose filled background needs dark text for legibility (light backgrounds)
const DARK_TEXT_ON_FILL: Record<string, boolean> = { vaccinations: true, lifestyle: true };
const DARK_TEXT = "#1B3A6B";

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
      if (prof && (!(prof as any).date_of_birth || !(prof as any).biological_sex || !(prof as any).nationality)) {
        setSetupInitial(prof);
        setShowSetup(true);
      }
      const sb = supabase as any;
      const [mc, mcs, hs, pm, ot, sm, di, cv, tv, ov, vco, lr, hsum, hp, hc, hsib, hgt, asum, da, fa, ea, adi] = await Promise.all([
        supabase.from("medical_conditions").select("id").eq("user_id", user.id).limit(1),
        supabase.from("medical_conditions_summary").select("nothing_to_report").eq("user_id", user.id).maybeSingle(),
        supabase.from("hospital_stays").select("id").eq("user_id", user.id).limit(1),
        supabase.from("prescription_medications").select("id").eq("user_id", user.id).limit(1),
        supabase.from("otc_supplements").select("id").eq("user_id", user.id).limit(1),
        supabase.from("stopped_medications").select("id").eq("user_id", user.id).limit(1),
        supabase.from("drug_intolerances").select("intolerances_text, nothing_to_report").eq("user_id", user.id).maybeSingle(),
        sb.from("childhood_vaccines").select("id, status").eq("user_id", user.id),
        sb.from("travel_vaccines").select("id").eq("user_id", user.id).limit(1),
        sb.from("other_vaccines").select("id").eq("user_id", user.id).limit(1),
        sb.from("vaccination_contraindications").select("contraindication_notes, nothing_to_report").eq("user_id", user.id).maybeSingle(),
        sb.from("lifestyle_risk").select("*").eq("user_id", user.id).maybeSingle(),
        sb.from("heredity_summary").select("nothing_to_report").eq("user_id", user.id).maybeSingle(),
        sb.from("heredity_parents").select("id").eq("user_id", user.id).limit(1),
        sb.from("heredity_conditions").select("id").eq("user_id", user.id).limit(1),
        sb.from("heredity_siblings").select("has_siblings").eq("user_id", user.id).maybeSingle(),
        sb.from("heredity_genetic_testing").select("tested").eq("user_id", user.id).maybeSingle(),
        sb.from("allergies_summary").select("nothing_to_report").eq("user_id", user.id).maybeSingle(),
        sb.from("drug_allergies").select("id").eq("user_id", user.id).limit(1),
        sb.from("food_allergies").select("id").eq("user_id", user.id).limit(1),
        sb.from("environmental_allergies").select("id").eq("user_id", user.id).limit(1),
        sb.from("allergy_drug_intolerances").select("id").eq("user_id", user.id).limit(1),
      ]);
      const mhDone =
        !!mcs.data?.nothing_to_report ||
        !!(mc.data && mc.data.length > 0) ||
        !!(hs.data && hs.data.length > 0);
      const medsDone =
        !!di.data?.nothing_to_report ||
        !!(di.data?.intolerances_text && di.data.intolerances_text.trim().length > 0) ||
        !!(pm.data && pm.data.length > 0) ||
        !!(ot.data && ot.data.length > 0) ||
        !!(sm.data && sm.data.length > 0);
      const vaxDone =
        !!vco.data?.nothing_to_report ||
        !!(cv.data && cv.data.length > 0) ||
        !!(tv.data && tv.data.length > 0) ||
        !!(ov.data && ov.data.length > 0) ||
        !!(vco.data?.contraindication_notes && vco.data.contraindication_notes.trim().length > 0);
      const lifestyleDone = (() => {
        const d = lr.data;
        if (!d) return false;
        if (d.nothing_to_report) return true;
        return !!(
          d.tobacco_status ||
          d.alcohol_frequency ||
          d.height_cm ||
          d.weight_kg ||
          d.exercise_frequency ||
          (d.diet_restrictions && d.diet_restrictions.length) ||
          d.sleep_status ||
          d.mental_health_treated != null ||
          (d.substances && d.substances.length)
        );
      })();
      const heredityDone =
        !!hsum.data?.nothing_to_report ||
        !!(hp.data && hp.data.length > 0) ||
        !!(hc.data && hc.data.length > 0) ||
        hsib.data?.has_siblings != null ||
        hgt.data?.tested != null;
      const allergiesDone =
        !!asum.data?.nothing_to_report ||
        !!(da.data && da.data.length > 0) ||
        !!(fa.data && fa.data.length > 0) ||
        !!(ea.data && ea.data.length > 0) ||
        !!(adi.data && adi.data.length > 0);
      setDone((d) => ({ ...d, "medical-history": mhDone, medications: medsDone, vaccinations: vaxDone, lifestyle: lifestyleDone, heredity: heredityDone, allergies: allergiesDone }));
    })();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const goSection = (key: SectionKey) => navigate({ to: "/passport/$section", params: { section: key } });


  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Top bar */}
      <header className="flex items-center justify-between bg-[#1D3F7C] px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Hexagon className="h-[50px] w-[50px]"><img src={logo} alt="GlobeDoc" className="h-9 w-9" /></Hexagon>
          <span className="text-lg font-bold text-white">GlobeDoc</span>
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

      {/* Section 1 — Progress */}
      <section className="px-5 pt-6">
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Health Passport</h1>
        <p className="mt-1 text-sm text-gray-500">My Passport · {completed}/{total} sections</p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-[#3B82F6] transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-xs text-gray-500">{percent}% complete</p>
      </section>

      {/* Section 2 — Hexagon map (tight pointy-top honeycomb) */}
      <section className="mt-6 px-4">
        <div className="relative mx-auto" style={{ width: 300, height: 289 }}>
          {/* Center */}
          <Hex style={{ left: 100, top: 86 }} color="#FFFFFF" filled pageBg="#F8F9FA">
            <div className="flex items-center justify-center">
              <img src={logo} alt="GlobeDoc" className="h-16 w-16" />
            </div>
          </Hex>
          {/* Top-left: History */}
          <Hex style={{ left: 50, top: 0 }} color={SECTIONS[0].color} filled={done["medical-history"]} pageBg="#F8F9FA" onClick={() => goSection(SECTIONS[0].key)}>
            <span className="text-xl">{SECTIONS[0].emoji}</span>
            <span className="mt-1 text-[11px] font-bold" style={{ color: done["medical-history"] ? "#FFFFFF" : SECTIONS[0].color }}>History</span>
          </Hex>
          {/* Top-right: Medications */}
          <Hex style={{ left: 150, top: 0 }} color={SECTIONS[1].color} filled={done["medications"]} pageBg="#F8F9FA" onClick={() => goSection(SECTIONS[1].key)}>
            <span className="text-xl">{SECTIONS[1].emoji}</span>
            <span className="mt-1 text-[11px] font-bold" style={{ color: done["medications"] ? "#FFFFFF" : SECTIONS[1].color }}>Medications</span>
          </Hex>
          {/* Right: Vaccinations */}
          <Hex style={{ left: 200, top: 86 }} color={SECTIONS[2].color} filled={done["vaccinations"]} pageBg="#F8F9FA" onClick={() => goSection(SECTIONS[2].key)}>
            <span className="text-xl">{SECTIONS[2].emoji}</span>
            <span className="mt-1 text-[11px] font-bold" style={{ color: done["vaccinations"] ? DARK_TEXT : SECTIONS[2].color }}>Vaccinations</span>
          </Hex>
          {/* Bottom-right: Lifestyle & Risks */}
          <Hex style={{ left: 150, top: 173 }} color={SECTIONS[3].color} filled={done["lifestyle"]} pageBg="#F8F9FA" onClick={() => goSection(SECTIONS[3].key)}>
            <span className="text-xl">{SECTIONS[3].emoji}</span>
            <span className="mt-1 text-[11px] font-bold" style={{ color: done["lifestyle"] ? DARK_TEXT : SECTIONS[3].color }}>Lifestyle</span>
          </Hex>
          {/* Bottom-left: Heredity */}
          <Hex style={{ left: 50, top: 173 }} color={SECTIONS[4].color} filled={done["heredity"]} pageBg="#F8F9FA" onClick={() => goSection(SECTIONS[4].key)}>
            <span className="text-xl">{SECTIONS[4].emoji}</span>
            <span className="mt-1 text-[11px] font-bold" style={{ color: done["heredity"] ? "#FFFFFF" : SECTIONS[4].color }}>Heredity</span>
          </Hex>
          {/* Left: Allergies */}
          <Hex style={{ left: 0, top: 86 }} color={SECTIONS[5].color} filled={done["allergies"]} pageBg="#F8F9FA" onClick={() => goSection(SECTIONS[5].key)}>
            <span className="text-xl">{SECTIONS[5].emoji}</span>
            <span className="mt-1 text-[11px] font-bold" style={{ color: done["allergies"] ? "#FFFFFF" : SECTIONS[5].color }}>Allergies</span>
          </Hex>
        </div>
      </section>

      {/* Section 3 — List */}
      <section className="mt-6 space-y-3 px-5">
        {SECTIONS.map((s) => {
          const isDone = done[s.key];
          const filledText = DARK_TEXT_ON_FILL[s.key] ? DARK_TEXT : "#FFFFFF";
          const filledSub = DARK_TEXT_ON_FILL[s.key] ? "rgba(27,58,107,0.75)" : "rgba(255,255,255,0.85)";
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => goSection(s.key)}
              className="flex w-full items-center gap-4 rounded-r-xl bg-white p-4 text-left shadow-sm transition-transform duration-200 hover:scale-[1.02]"
              style={{
                backgroundColor: isDone ? s.color : "#FFFFFF",
                borderLeft: `6px solid ${s.color}`,
              }}
            >
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1">
                <h3 className="text-sm font-bold" style={{ color: isDone ? filledText : s.color }}>{s.title}</h3>
                <p className="text-xs" style={{ color: isDone ? filledSub : "#4B5563" }}>{s.subtitle}</p>
              </div>
            </button>
          );
        })}

        <Link
          to="/pairing"
          className="mt-4 flex items-center gap-4 rounded-2xl bg-gray-100 p-4 text-[#0D1B2A] shadow-sm hover:bg-gray-200"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
            <LinkIcon className="h-5 w-5 text-[#0D1B2A]" />
          </span>
          <div className="flex-1">
            <h3 className="text-sm font-bold">Pairing Code</h3>
            <p className="text-xs text-gray-600">Share your passport with a clinician</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-500" />
        </Link>
      </section>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#1D3F7C] bg-[#1D3F7C]">
        <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
          <NavTab to="/home" icon={<HomeIcon className="h-5 w-5" />} label="Home" />
          <NavTab to="/passport" icon={<Globe className="h-5 w-5" />} label="Health Pass" active />
          <NavTab to="/travel" icon={<Plane className="h-5 w-5" />} label="Travel" />
          <NavTab to="/records" icon={<FileText className="h-5 w-5" />} label="Records" />
          <NavTab to="/pairing" icon={<LinkIcon className="h-5 w-5" />} label="Pairing" />
          <NavTab to="/profile" icon={<User className="h-5 w-5" />} label="Profile" />
        </ul>
      </nav>

      {showSetup && userId && (
        <PassportSetupModal userId={userId} initial={setupInitial} onDone={async () => {
          setShowSetup(false);
        }} />
      )}
    </div>
  );
}

function Hex({ children, color, filled = true, pageBg, style, onClick }: { children: React.ReactNode; color: string; filled?: boolean; pageBg: string; style: React.CSSProperties; onClick?: () => void }) {
  const hexClip = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute h-[116px] w-[100px] p-0 transition-transform duration-200 hover:scale-[1.06] active:scale-[1.06]"
      style={{ ...style, background: "transparent", border: "none" }}
    >
      <span
        className="absolute inset-0 block"
        style={{ background: color, clipPath: hexClip }}
      />
      {!filled && (
        <span
          className="absolute block"
          style={{ inset: 3, background: pageBg, clipPath: hexClip }}
        />
      )}
      <span className="relative flex h-full w-full flex-col items-center justify-center p-2 text-center">
        {children}
      </span>
    </button>
  );
}


function NavTab({ icon, label, active, to }: { icon: React.ReactNode; label: string; active?: boolean; to?: "/home" | "/passport" | "/travel" | "/records" | "/pairing" | "/profile" }) {
  const className = `flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${
    active ? "bg-white/15 text-white" : "text-white/75 hover:text-white"
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
