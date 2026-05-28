import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LogOut, Home as HomeIcon, Globe, FileText, Link as LinkIcon, User, ChevronRight } from "lucide-react";
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
  { key: "medical-history", emoji: "🏥", title: "Medical History", subtitle: "Diagnoses, hospitalisations & operations", color: "#EAF3FB" },
  { key: "medications", emoji: "💊", title: "Medications", subtitle: "All current medications & supplements", color: "#E6F6E8" },
  { key: "vaccinations", emoji: "💉", title: "Vaccinations", subtitle: "Complete immunisation record", color: "#EEEAF7" },
  { key: "lifestyle", emoji: "🏃", title: "Lifestyle & Risk", subtitle: "Habits that matter clinically", color: "#BFE6E2" },
  { key: "heredity", emoji: "🧬", title: "Heredity", subtitle: "Family medical history & genetic conditions", color: "#F2D6BC" },
  { key: "allergies", emoji: "⚠️", title: "Allergies", subtitle: "Drug, food, environment & contrast reactions", color: "#FADDD7" },
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
          <Hex style={{ left: 100, top: 86 }} color="#1A2B3C" filled pageBg="#F8F9FA">
            <img src={logo} alt="" className="h-7 w-7" />
            <span className="mt-1 text-[9px] font-bold leading-tight text-white text-center">GlobeDoc<br/>Health Passport</span>
            <span className="text-[11px] font-bold text-[#3B82F6]">{completed}/{total}</span>
          </Hex>
          {/* Top-left: Medical History */}
          <Hex style={{ left: 50, top: 0 }} color={SECTIONS[0].color} filled={done["medical-history"]} pageBg="#F8F9FA" onClick={() => goSection(SECTIONS[0].key)}>
            <span className="text-xl">{SECTIONS[0].emoji}</span>
            <span className="mt-1 text-[10px] font-bold leading-tight text-[#0D1B2A] text-center">Medical<br/>History</span>
          </Hex>
          {/* Top-right: Medications */}
          <Hex style={{ left: 150, top: 0 }} color={SECTIONS[1].color} filled={done["medications"]} pageBg="#F8F9FA" onClick={() => goSection(SECTIONS[1].key)}>
            <span className="text-xl">{SECTIONS[1].emoji}</span>
            <span className="mt-1 text-[11px] font-bold text-[#0D1B2A]">Medications</span>
          </Hex>
          {/* Right: Vaccinations */}
          <Hex style={{ left: 200, top: 86 }} color={SECTIONS[2].color} filled={done["vaccinations"]} pageBg="#F8F9FA" onClick={() => goSection(SECTIONS[2].key)}>
            <span className="text-xl">{SECTIONS[2].emoji}</span>
            <span className="mt-1 text-[11px] font-bold text-[#0D1B2A]">Vaccinations</span>
          </Hex>
          {/* Bottom-right: Lifestyle & Risk */}
          <Hex style={{ left: 150, top: 173 }} color={SECTIONS[3].color} filled={done["lifestyle"]} pageBg="#F8F9FA" onClick={() => goSection(SECTIONS[3].key)}>
            <span className="text-xl">{SECTIONS[3].emoji}</span>
            <span className="mt-1 text-[10px] font-bold leading-tight text-[#0D1B2A] text-center">Lifestyle<br/>& Risk</span>
          </Hex>
          {/* Bottom-left: Heredity */}
          <Hex style={{ left: 50, top: 173 }} color={SECTIONS[4].color} filled={done["heredity"]} pageBg="#F8F9FA" onClick={() => goSection(SECTIONS[4].key)}>
            <span className="text-xl">{SECTIONS[4].emoji}</span>
            <span className="mt-1 text-[11px] font-bold text-[#0D1B2A]">Heredity</span>
          </Hex>
          {/* Left: Allergies */}
          <Hex style={{ left: 0, top: 86 }} color={SECTIONS[5].color} filled={done["allergies"]} pageBg="#F8F9FA" onClick={() => goSection(SECTIONS[5].key)}>
            <span className="text-xl">{SECTIONS[5].emoji}</span>
            <span className="mt-1 text-[11px] font-bold text-[#0D1B2A]">Allergies</span>
          </Hex>
        </div>
      </section>

      {/* Section 3 — List */}
      <section className="mt-6 space-y-3 px-5">
        {SECTIONS.map((s) => {
          const isDone = done[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => goSection(s.key)}
              className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-transform duration-200 hover:scale-[1.02]"
              style={{
                backgroundColor: isDone ? s.color : "transparent",
                border: `2px solid ${s.color}`,
              }}
            >
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#0D1B2A]">{s.title}</h3>
                <p className="text-xs text-gray-600">{s.subtitle}</p>
              </div>
            </button>
          );
        })}

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
          <NavTab to="/passport" icon={<Globe className="h-5 w-5" />} label="Health Pass" active />
          <NavTab icon={<FileText className="h-5 w-5" />} label="Records" />
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
