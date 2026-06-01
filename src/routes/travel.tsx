import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, LogOut, Home as HomeIcon, Globe, Plane, Link as LinkIcon, User, X, MapPin, Check, Syringe, Download, Info, FileText } from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/lib/countries";
import { recommendedFor, userHasVaccine, TRIP_LENGTHS, type TripLength } from "@/lib/travelVaccines";
import { computeBoosterStatus, type BoosterStatus } from "@/lib/boosterIntervals";

export const Route = createFileRoute("/travel")({
  head: () => ({ meta: [{ title: "Travel — GlobeDoc" }] }),
  component: TravelPage,
});

type VRow = { vaccine_name: string; year_received?: string | null; date_received?: string | null; status?: string | null; booster_dates?: string[] | null };

function TravelPage() {
  const navigate = useNavigate();
  const [childhood, setChildhood] = useState<VRow[]>([]);
  const [travel, setTravel] = useState<VRow[]>([]);
  const [other, setOther] = useState<VRow[]>([]);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string>("");
  const [trip, setTrip] = useState<TripLength>("short");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async (userId: string) => {
      const sb = supabase as any;
      const [cv, tv, ov] = await Promise.all([
        sb.from("childhood_vaccines").select("vaccine_name, year_received, status").eq("user_id", userId),
        sb.from("travel_vaccines").select("vaccine_name, date_received, booster_dates").eq("user_id", userId),
        sb.from("other_vaccines").select("vaccine_name, date_received, booster_dates").eq("user_id", userId),
      ]);
      if (cancelled) return;
      setChildhood((cv.data ?? []).filter((r: any) => r.status === "likely_received"));
      setTravel(tv.data ?? []);
      setOther(ov.data ?? []);
    };

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/login" }); return; }
      await load(user.id);

      channel = supabase
        .channel(`vax-card-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "childhood_vaccines", filter: `user_id=eq.${user.id}` }, () => load(user.id))
        .on("postgres_changes", { event: "*", schema: "public", table: "travel_vaccines", filter: `user_id=eq.${user.id}` }, () => load(user.id))
        .on("postgres_changes", { event: "*", schema: "public", table: "other_vaccines", filter: `user_id=eq.${user.id}` }, () => load(user.id))
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); };

  const userVaccineNames = useMemo(
    () => [...childhood, ...travel, ...other].map((v) => v.vaccine_name).filter(Boolean) as string[],
    [childhood, travel, other],
  );

  const filteredCountries = query
    ? COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const recs = country ? recommendedFor(country, trip) : [];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <header className="flex items-center justify-between bg-[#1D3A6B] px-5 py-3 shadow-sm">
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
            <div className="mt-2 flex flex-wrap gap-2">
              {TRIP_LENGTHS.map((t) => {
                const active = trip === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTrip(t.id)}
                    className="rounded-full px-3 py-1 text-xs font-semibold transition-opacity"
                    style={{
                      background: "#EAF3FB",
                      color: "#4472B8",
                      opacity: active ? 1 : 0.55,
                      outline: active ? "2px solid #4472B8" : "none",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

          {country && (
            <ul className="mt-4 space-y-2">
              {recs.length === 0 && (
                <li className="text-xs text-gray-500">No specific travel vaccines required beyond your routine schedule.</li>
              )}
              {recs.map((v) => {
                const have = userHasVaccine(v.label, userVaccineNames);
                const required = v.mark === "K";
                const status = required ? "required" : have ? "have" : "missing";
                const dot = status === "have" ? "#3B6D11" : status === "required" ? "#9B3A28" : "#9B3A28";
                const badgeBg = status === "have" ? "#E6F6E8" : "#FADDD7";
                const badgeFg = status === "have" ? "#3B6D11" : "#9B3A28";
                const label = status === "have" ? "Already have" : status === "required" ? "Required for entry" : "Missing";
                return (
                  <li key={v.key} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot }} />
                      <span className="truncate text-sm text-[#0D1B2A]">{v.label}</span>
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

          <VaxGroup title="Childhood vaccines" rows={childhood} />
          <VaxGroup title="Travel vaccines" rows={travel} />
          <VaxGroup title="Other vaccines" rows={other} />

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

function VaxGroup({ title, rows }: { title: string; rows: VRow[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-gray-400">No entries</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {rows.map((r, i) => {
            const primaryYearStr = yearOf(r.year_received ?? r.date_received);
            const boosterYearStrs = (r.booster_dates ?? []).map(yearOf).filter(Boolean);
            const allYears = [primaryYearStr, ...boosterYearStrs].filter(Boolean).map((y) => parseInt(y, 10)).filter((n) => !Number.isNaN(n));
            const lastYear = allYears.length ? Math.max(...allYears) : null;
            const status = computeBoosterStatus(r.vaccine_name, lastYear);
            const styles = statusStyles(status);
            return (
              <li key={`${r.vaccine_name}-${i}`} className="flex items-start justify-between gap-2 rounded-md bg-gray-50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-[#0D1B2A]">
                      {r.vaccine_name}
                      {primaryYearStr ? <span className="text-gray-500"> · {primaryYearStr}</span> : null}
                    </span>
                    {status.kind !== "no_data" && "note" in status && (
                      <span title={status.note} className="cursor-help text-gray-400" aria-label={status.note}>
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  {styles.line && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: styles.fg }}>
                      {styles.dot && <span className="h-2 w-2 rounded-full" style={{ background: styles.fg }} />}
                      {styles.check && <Check className="h-3.5 w-3.5" style={{ color: styles.fg }} />}
                      <span>{styles.line}</span>
                    </div>
                  )}
                </div>
                <span
                  className="mt-0.5 inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold"
                  style={{ background: styles.bg, color: styles.fg }}
                >
                  {styles.badge}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function statusStyles(s: BoosterStatus): { bg: string; fg: string; badge: string; line: string; dot: boolean; check: boolean } {
  switch (s.kind) {
    case "lifelong":
      return { bg: "#E6F6E8", fg: "#3B6D11", badge: "Up to date", line: "Lifelong protection", dot: false, check: true };
    case "ok":
      return { bg: "#E6F6E8", fg: "#3B6D11", badge: "Up to date", line: `Next booster ${s.nextYear}`, dot: false, check: true };
    case "due_soon":
      return { bg: "#F2D6BC", fg: "#8A5A1F", badge: "Due soon", line: `Booster due ${s.nextYear}`, dot: true, check: false };
    case "overdue":
      return { bg: "#FADDD7", fg: "#9B3A28", badge: "Overdue", line: `Booster overdue since ${s.nextYear}`, dot: true, check: false };
    case "unknown_year":
      return { bg: "#F1F1F1", fg: "#5C5C5C", badge: "Check", line: "Year unknown — check with your clinic", dot: true, check: false };
    case "no_data":
    default:
      return { bg: "#E6F6E8", fg: "#3B6D11", badge: "Saved", line: "", dot: false, check: true };
  }
}

function yearOf(s?: string | null): string {
  if (!s) return "";
  const m = s.match(/\d{4}/);
  return m ? m[0] : s;
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#1D438C] bg-[#1D438C]">
      <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
        <NavTab to="/home" icon={<HomeIcon className="h-5 w-5" />} label="Home" />
        <NavTab to="/passport" icon={<Globe className="h-5 w-5" />} label="Passport" />
        <NavTab to="/travel" icon={<Plane className="h-5 w-5" />} label="Travel" active />
        <NavTab to="/records" icon={<FileText className="h-5 w-5" />} label="Records" />
        <NavTab to="/pairing" icon={<LinkIcon className="h-5 w-5" />} label="Pairing" />
        <NavTab to="/profile" icon={<User className="h-5 w-5" />} label="Profile" />
      </ul>
    </nav>
  );
}

function NavTab({ icon, label, active, to }: { icon: React.ReactNode; label: string; active?: boolean; to: "/home" | "/passport" | "/travel" | "/records" | "/pairing" | "/profile" }) {
  const className = `flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${active ? "bg-white/15 text-white" : "text-white/75 hover:text-white"}`;
  return (
    <li>
      <Link to={to} className={className}>{icon}<span>{label}</span></Link>
    </li>
  );
}
