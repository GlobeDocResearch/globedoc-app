import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ageFromDob, loadPairings, removePairing, type ProPairing } from "@/lib/proPairings";

export const Route = createFileRoute("/pro/")({
  head: () => ({ meta: [{ title: "Patients — GlobeDoc Pro" }] }),
  component: PatientsTab,
});

function PatientsTab() {
  const navigate = useNavigate();
  const [pairings, setPairings] = useState<ProPairing[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/signin" });
        return;
      }
      setPairings(loadPairings(user.id));
    })();
  }, [navigate]);

  const onRevoke = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    removePairing(user.id, id);
    setPairings(loadPairings(user.id));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pairings;
    return pairings.filter((p) => {
      const paired = new Date(p.paired_at).toLocaleString().toLowerCase();
      const last = new Date(p.last_activity_at).toLocaleString().toLowerCase();
      return (
        p.patient_name.toLowerCase().includes(q) ||
        paired.includes(q) ||
        last.includes(q)
      );
    });
  }, [pairings, query]);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-6">
      <h1 className="text-2xl font-bold text-[#0D1B2A]">Patients</h1>
      <p className="mt-1 text-sm text-gray-500">Patients you've paired with.</p>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, date paired, or last activity"
          className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-[#2563EB] focus:outline-none"
        />
      </div>

      {pairings.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
            <Users className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-gray-600">
            No paired patients yet.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-500">No patients match your search.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {pairings.map((p) => (
            <li key={p.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#0D1B2A]">
                    {p.patient_name} <span className="text-sm font-normal text-gray-500">· {ageFromDob(p.patient_dob)}</span>
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Paired since {new Date(p.paired_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last activity {new Date(p.last_activity_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/connect"
                  className="rounded-full bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                >
                  View Passport
                </Link>
                <Link
                  to="/connect"
                  className="rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
                >
                  Open Records
                </Link>
              </div>
              <button
                type="button"
                onClick={() => onRevoke(p.id)}
                className="mt-3 text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
              >
                Revoke access
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
