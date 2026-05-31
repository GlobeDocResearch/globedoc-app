import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link as LinkIcon, ShieldCheck, FileText, X, Loader2 } from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addPairing } from "@/lib/proPairings";
import { ProBottomNav } from "./pro";

export const Route = createFileRoute("/connect")({
  head: () => ({ meta: [{ title: "Connect with Patient — GlobeDoc" }] }),
  component: ConnectPageWrapper,
});

function ConnectPageWrapper() {
  const [isPro, setIsPro] = useState(false);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsPro(user?.user_metadata?.account_type === "professional");
    })();
  }, []);
  return (
    <div className={isPro ? "pb-24" : ""}>
      <ConnectPage />
      {isPro && <ProBottomNav />}
    </div>
  );
}

const ACCESS_OPTIONS = [
  { value: "passport_records", label: "Full Passport + Records" },
  { value: "records_only", label: "Records only" },
  { value: "records_add", label: "Records + can add entries" },
  { value: "passport_suggest", label: "Passport read + can suggest edits" },
];

type PassportData = {
  session: { pro_name: string; pro_title: string | null; institution: string | null; access_level: string; expires_at: string };
  patient: { name: string; date_of_birth: string | null; biological_sex: string | null; nationality: string | null; blood_group: string | null };
  medical_history: any;
  medications: any;
  vaccinations: any;
  lifestyle: any;
  heredity: any;
  allergies: any;
  records: any[];
};

function ConnectPage() {
  const [code, setCode] = useState("");
  const [proName, setProName] = useState("");
  const [proTitle, setProTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [accessLevel, setAccessLevel] = useState("passport_records");
  const [gdpr, setGdpr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<PassportData | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  // restore session if user reloaded
  useEffect(() => {
    const t = sessionStorage.getItem("globedoc_pro_token");
    if (t) {
      setToken(t);
      loadPassport(t);
    }
  }, []);

  const loadPassport = async (t: string) => {
    try {
      const res = await fetch("/api/public/connect/passport", { headers: { "x-session-token": t } });
      const json = await res.json();
      if (!res.ok) {
        sessionStorage.removeItem("globedoc_pro_token");
        setToken(null);
        toast.error(json.error || "Session expired");
        return;
      }
      setData(json);
      // If the Pro is signed in, persist this pairing for their dashboard.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          addPairing(user.id, {
            id: t,
            patient_name: json.patient?.name ?? "Patient",
            patient_dob: json.patient?.date_of_birth ?? null,
            paired_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            expires_at: json.session?.expires_at ?? new Date().toISOString(),
          });
        }
      } catch {
        /* ignore */
      }
    } catch {
      toast.error("Could not load passport");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/connect/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          pro_name: proName,
          pro_title: proTitle,
          institution,
          access_level: accessLevel,
          gdpr_consent: gdpr,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Could not connect");
        return;
      }
      sessionStorage.setItem("globedoc_pro_token", json.session_token);
      setToken(json.session_token);
      await loadPassport(json.session_token);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!token || !noteText.trim()) return;
    setNoteSaving(true);
    try {
      const res = await fetch("/api/public/connect/note", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-token": token },
        body: JSON.stringify({ body: noteText, title: "Clinical note" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Could not save note");
        return;
      }
      toast.success("Note added to patient's Records");
      setNoteText("");
      setNoteOpen(false);
      loadPassport(token);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleEnd = () => {
    sessionStorage.removeItem("globedoc_pro_token");
    setToken(null);
    setData(null);
    setCode("");
    setProName("");
    setProTitle("");
    setInstitution("");
    setGdpr(false);
  };

  if (token && data) {
    return <PassportView data={data} onAddNote={() => setNoteOpen(true)} onEnd={handleEnd} noteOpen={noteOpen} noteText={noteText} setNoteText={setNoteText} onSaveNote={handleAddNote} onCloseNote={() => setNoteOpen(false)} noteSaving={noteSaving} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="flex items-center justify-between bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="GlobeDoc" className="h-11 w-11" />
          <span className="text-lg font-bold text-[#0D1B2A]">GlobeDoc</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl px-5 py-8">
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Connect with Patient</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter the 6-character pairing code shared by the patient.
        </p>

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

          <div>
            <label className="text-sm font-semibold text-[#0D1B2A]">Your full name</label>
            <input
              type="text"
              required
              value={proName}
              onChange={(e) => setProName(e.target.value)}
              placeholder="Dr. Eva Lindqvist"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#0D1B2A]">Title / specialty</label>
            <input
              type="text"
              value={proTitle}
              onChange={(e) => setProTitle(e.target.value)}
              placeholder="Nephrologist"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#0D1B2A]">Institution</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Karolinska University Hospital"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#0D1B2A]">Requested access level</label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none"
            >
              {ACCESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={gdpr} onChange={(e) => setGdpr(e.target.checked)} className="mt-0.5" />
            <span>
              I confirm I have a legitimate clinical reason for accessing this patient's records and will handle their data in accordance with GDPR and applicable medical confidentiality laws. All access is audit-logged.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !gdpr}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
            {submitting ? "Connecting..." : "Access patient passport"}
          </button>
        </form>
      </main>
    </div>
  );
}

function PassportView({
  data, onAddNote, onEnd, noteOpen, noteText, setNoteText, onSaveNote, onCloseNote, noteSaving,
}: {
  data: PassportData;
  onAddNote: () => void;
  onEnd: () => void;
  noteOpen: boolean;
  noteText: string;
  setNoteText: (v: string) => void;
  onSaveNote: () => void;
  onCloseNote: () => void;
  noteSaving: boolean;
}) {
  const expires = new Date(data.session.expires_at);
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="flex items-center justify-between bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="GlobeDoc" className="h-11 w-11" />
          <span className="text-lg font-bold text-[#0D1B2A]">GlobeDoc</span>
        </div>
        <button
          type="button"
          onClick={onEnd}
          className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          End session
        </button>
      </header>

      {/* Banner */}
      <div className="bg-amber-50 px-5 py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-[#0D1B2A]">
                You are viewing {data.patient.name}'s GlobeDoc Health Passport
              </p>
              <p className="text-xs text-amber-800">
                Read-only · Access expires {expires.toLocaleString()} · Audit-logged
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAddNote}
            className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#0D1B2A] px-4 py-2 text-xs font-semibold text-white hover:bg-black"
          >
            <FileText className="h-4 w-4" /> Add clinical note to Records
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl space-y-4 px-5 py-6">
        <Card title="Patient">
          <Row k="Name" v={data.patient.name} />
          <Row k="Date of birth" v={data.patient.date_of_birth} />
          <Row k="Biological sex" v={data.patient.biological_sex} />
          <Row k="Nationality" v={data.patient.nationality} />
          <Row k="Blood group" v={data.patient.blood_group} />
        </Card>

        <Card title="Medical history">
          {data.medical_history.summary?.nothing_to_report && <Empty text="Nothing to report" />}
          <List items={data.medical_history.conditions} render={(c: any) => `${c.condition_name}${c.year ? ` (${c.year})` : ""}${c.is_resolved ? " · resolved" : ""}`} emptyHidden={!!data.medical_history.summary?.nothing_to_report} label="Conditions" />
          <List items={data.medical_history.hospital_stays} render={(h: any) => `${h.event || "Hospital stay"}${h.year ? ` · ${h.year}` : ""}${h.hospital_country ? ` · ${h.hospital_country}` : ""}`} label="Hospital stays" />
        </Card>

        <Card title="Medications">
          <List items={data.medications.prescription} render={(m: any) => `${m.drug_generic || m.brand_name || "—"}${m.dose_form ? ` · ${m.dose_form}` : ""}${m.frequency ? ` · ${m.frequency}` : ""}${m.indication ? ` · for ${m.indication}` : ""}`} label="Prescription" />
          <List items={data.medications.otc} render={(m: any) => `${m.product || "—"}${m.dose ? ` · ${m.dose}` : ""}${m.frequency ? ` · ${m.frequency}` : ""}`} label="OTC & supplements" />
          <List items={data.medications.stopped} render={(m: any) => `${m.drug_generic || "—"}${m.period ? ` · ${m.period}` : ""}${m.reason_stopped ? ` · ${m.reason_stopped}` : ""}`} label="Stopped" />
          {data.medications.intolerances?.intolerances_text && (
            <Row k="Intolerances" v={data.medications.intolerances.intolerances_text} />
          )}
        </Card>

        <Card title="Vaccinations">
          <List items={(data.vaccinations.childhood || []).filter((c: any) => c.status === "received")} render={(c: any) => `${c.vaccine_name}${c.year_received ? ` · ${c.year_received}` : ""}`} label="Childhood" />
          <List items={data.vaccinations.travel} render={(v: any) => `${v.vaccine_name} · ${v.destination}`} label="Travel" />
          <List items={data.vaccinations.other} render={(v: any) => v.vaccine_name} label="Other" />
        </Card>

        <Card title="Allergies">
          {data.allergies.summary?.nothing_to_report && <Empty text="Nothing to report" />}
          <List items={data.allergies.drug} render={(a: any) => `${a.drug_name}${a.reaction ? ` · ${a.reaction}` : ""}${a.severity ? ` · ${a.severity}` : ""}`} label="Drug" />
          <List items={data.allergies.food} render={(a: any) => `${a.food_item}${a.reaction ? ` · ${a.reaction}` : ""}`} label="Food" />
          <List items={data.allergies.environmental} render={(a: any) => `${a.allergen}${a.reaction ? ` · ${a.reaction}` : ""}`} label="Environmental" />
          <List items={data.allergies.contrast} render={(a: any) => `${a.agent}${a.reaction ? ` · ${a.reaction}` : ""}`} label="Contrast / anaesthetic" />
        </Card>

        <Card title="Heredity">
          {data.heredity.summary?.nothing_to_report && <Empty text="Nothing to report" />}
          <List items={data.heredity.conditions} render={(c: any) => `${c.condition_name}${c.which_relative ? ` · ${c.which_relative}` : ""}`} label="Conditions" />
        </Card>

        <Card title="Lifestyle">
          {data.lifestyle ? (
            <div className="space-y-1 text-sm">
              {data.lifestyle.tobacco_status && <Row k="Tobacco" v={data.lifestyle.tobacco_status} />}
              {data.lifestyle.alcohol_frequency && <Row k="Alcohol" v={data.lifestyle.alcohol_frequency} />}
              {data.lifestyle.exercise_frequency && <Row k="Exercise" v={data.lifestyle.exercise_frequency} />}
              {data.lifestyle.sleep_status && <Row k="Sleep" v={data.lifestyle.sleep_status} />}
              {data.lifestyle.height_cm && <Row k="Height" v={`${data.lifestyle.height_cm} cm`} />}
              {data.lifestyle.weight_kg && <Row k="Weight" v={`${data.lifestyle.weight_kg} kg`} />}
            </div>
          ) : (
            <Empty text="No data" />
          )}
        </Card>

        <Card title={`Records (${data.records.length})`}>
          {data.records.length === 0 ? (
            <Empty text="No records" />
          ) : (
            <ul className="space-y-3">
              {data.records.map((r) => (
                <li key={r.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[#0D1B2A]">{r.title}</h4>
                    <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.author_name && (
                    <p className="text-xs text-gray-500">
                      {r.author_name}{r.author_role ? ` · ${r.author_role}` : ""}
                    </p>
                  )}
                  {r.body && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{r.body}</p>}
                  {r.file_name && <p className="mt-1 text-xs text-gray-500">📎 {r.file_name}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>

      {noteOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0D1B2A]">Add clinical note</h3>
              <button type="button" onClick={onCloseNote} aria-label="Close" className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">This note will appear in the patient's Records feed, attributed to you.</p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={6}
              placeholder="Write your clinical note..."
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={onCloseNote} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={onSaveNote}
                disabled={noteSaving || !noteText.trim()}
                className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {noteSaving ? "Saving..." : "Add note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-[#0D1B2A]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  if (!v) return null;
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-gray-500">{k}</span>
      <span className="text-right font-medium text-[#0D1B2A]">{v}</span>
    </div>
  );
}

function List({ items, render, label, emptyHidden }: { items: any[]; render: (i: any) => string; label?: string; emptyHidden?: boolean }) {
  if (!items || items.length === 0) {
    if (emptyHidden) return null;
    return label ? <p className="text-xs text-gray-400">{label}: —</p> : null;
  }
  return (
    <div className="mb-2">
      {label && <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>}
      <ul className="mt-1 space-y-1 text-sm text-[#0D1B2A]">
        {items.map((i, idx) => <li key={i.id || idx}>• {render(i)}</li>)}
      </ul>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-gray-400">{text}</p>;
}
