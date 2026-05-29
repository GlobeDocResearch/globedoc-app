import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, LogOut, Home as HomeIcon, Globe, Plane, Link as LinkIcon, User, X, MapPin, Check, Syringe, Download } from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/lib/countries";
import { recommendedFor, userHasVaccine, TRIP_LENGTHS, type TripLength, COUNTRY_VACCINE_DATA } from "@/lib/travelVaccines";

export const Route = createFileRoute("/travel")({
  head: () => ({ meta: [{ title: "Travel — GlobeDoc" }] }),
  component: TravelPage,
});

type VRow = { vaccine_name: string; year_received?: string | null; date_received?: string | null; status?: string | null };

function TravelPage() {
  const navigate = useNavigate();
  const [childhood, setChildhood] = useState<VRow[]>([]);
  const [travel, setTravel] = useState<VRow[]>([]);
  const [other, setOther] = useState<VRow[]>([]);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/login" }); return; }
      const sb = supabase as any;
      const [cv, tv, ov] = await Promise.all([
        sb.from("childhood_vaccines").select("vaccine_name, year_received, status").eq("user_id", user.id),
        sb.from("travel_vaccines").select("vaccine_name, date_received").eq("user_id", user.id),
        sb.from("other_vaccines").select("vaccine_name, date_received").eq("user_id", user.id),
      ]);
      setChildhood((cv.data ?? []).filter((r: any) => r.status !== "no"));
      setTravel(tv.data ?? []);
      setOther(ov.data ?? []);
    })();
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); };

  const userVaccineNames = useMemo(
    () => [...childhood, ...travel, ...other].map((v) => v.vaccine_name).filter(Boolean) as string[],
    [childhood, travel, other],
  );

  const filteredCountries = query
    ? COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const recs = country ? recommendedFor(country) : [];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
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

      <main className="mx-auto w-full max-w-3xl px-5 py-6 space-y-6">
        <section>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">Travel</h1>
          <p className="mt-1 text-sm text-gray-500">Plan trips and carry your vaccination card</p>
        </section>

        {/* A) Travel vaccine planner */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: "#EAF3FB" }}>
              <Plane className="h-5 w-5" style={{ color: "#4472B8" }} />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#0D1B2A]">Travel vaccine planner</h2>
              <p className="text-xs text-gray-500">Based on your vaccine history</p>
            </div>
          </div>

          <div className="relative mt-4">
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const match = filteredCountries[0];
                  if (match) { setCountry(match); setQuery(""); setOpen(false); }
                }
              }}
              placeholder="Search destination country..."
              className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#4472B8] focus:outline-none"
            />
            {open && filteredCountries.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-md">
                {filteredCountries.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setCountry(c); setQuery(""); setOpen(false); }}
                      className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {country && (
            <div className="mt-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "#EAF3FB", color: "#4472B8" }}
              >
                {country}
                <button type="button" onClick={() => setCountry("")} aria-label="Remove" className="rounded-full hover:bg-white/40">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          )}

          {country && (
            <ul className="mt-4 space-y-2">
              {recs.length === 0 && (
                <li className="text-xs text-gray-500">No specific travel vaccines required beyond your routine schedule.</li>
              )}
              {recs.map((v) => {
                const have = userHasVaccine(v, userVaccineNames);
                const status = have ? "have" : "missing";
                const dot = status === "have" ? "#3B6D11" : "#9B3A28";
                const badgeBg = status === "have" ? "#E6F6E8" : "#FADDD7";
                const badgeFg = status === "have" ? "#3B6D11" : "#9B3A28";
                const label = status === "have" ? "Already have" : "Missing";
                return (
                  <li key={v} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot }} />
                      <span className="truncate text-sm text-[#0D1B2A]">{v}</span>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: badgeBg, color: badgeFg }}>
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <a
            href="https://www.google.com/maps/search/vaccination+clinic+near+me"
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center gap-2 rounded-lg border border-gray-100 bg-[#F8F9FA] px-3 py-2.5 text-sm font-medium text-[#2563EB] hover:bg-gray-100"
          >
            <MapPin className="h-4 w-4" />
            Find vaccination clinics near you
          </a>
        </section>

        {/* B) Vaccination card */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: "#EEEAF7" }}>
              <Syringe className="h-5 w-5" style={{ color: "#6B4FB8" }} />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#0D1B2A]">Vaccination card</h2>
              <p className="text-xs text-gray-500">Your full immunisation record</p>
            </div>
          </div>

          <VaxGroup title="Childhood vaccines" rows={childhood.map((r) => ({ name: r.vaccine_name, year: r.year_received ?? "" }))} />
          <VaxGroup title="Travel vaccines" rows={travel.map((r) => ({ name: r.vaccine_name, year: yearOf(r.date_received) }))} />
          <VaxGroup title="Other vaccines" rows={other.map((r) => ({ name: r.vaccine_name, year: yearOf(r.date_received) }))} />

          <button
            type="button"
            onClick={() => window.print()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
            style={{ background: "#EEEAF7", color: "#4A357E" }}
          >
            <Download className="h-4 w-4" />
            Share or download card
          </button>
        </section>
      </main>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
}

function VaxGroup({ title, rows }: { title: string; rows: { name: string; year: string }[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-gray-400">No entries</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {rows.map((r, i) => (
            <li key={`${r.name}-${i}`} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <span className="text-sm text-[#0D1B2A]">
                {r.name}{r.year ? <span className="text-gray-500"> · {r.year}</span> : null}
              </span>
              <Check className="h-4 w-4" style={{ color: "#7AB648" }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function yearOf(s?: string | null): string {
  if (!s) return "";
  const m = s.match(/\d{4}/);
  return m ? m[0] : s;
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-100 bg-white">
      <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
        <NavTab to="/home" icon={<HomeIcon className="h-5 w-5" />} label="Home" />
        <NavTab to="/passport" icon={<Globe className="h-5 w-5" />} label="Health Pass" />
        <NavTab to="/travel" icon={<Plane className="h-5 w-5" />} label="Travel" active />
        <NavTab to="/pairing" icon={<LinkIcon className="h-5 w-5" />} label="Pairing" />
        <NavTab to="/profile" icon={<User className="h-5 w-5" />} label="Profile" />
      </ul>
    </nav>
  );
}

function NavTab({ icon, label, active, to }: { icon: React.ReactNode; label: string; active?: boolean; to: "/home" | "/passport" | "/travel" | "/pairing" | "/profile" }) {
  const className = `flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-medium ${active ? "bg-blue-50 text-[#2563EB]" : "text-gray-500"}`;
  return (
    <li>
      <Link to={to} className={className}>{icon}<span>{label}</span></Link>
    </li>
  );
}
