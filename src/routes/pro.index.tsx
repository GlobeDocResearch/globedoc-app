import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pill, Send, FileSignature, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadPairings, type ProPairing } from "@/lib/proPairings";
import {
  loadRx, saveRx, type RxItem,
  loadReferrals, saveReferrals, type ReferralItem,
  loadLetters, saveLetters, type LetterItem, type LetterType,
} from "@/lib/proClinical";

export const Route = createFileRoute("/pro/")({
  head: () => ({ meta: [{ title: "Clinical — GlobeDoc Pro" }] }),
  component: ClinicalTab,
});

type Section = "rx" | "referrals" | "letters";

function ClinicalTab() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [pairings, setPairings] = useState<ProPairing[]>([]);
  const [rx, setRx] = useState<RxItem[]>([]);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [section, setSection] = useState<Section>("rx");
  const [query, setQuery] = useState("");
  const [openForm, setOpenForm] = useState<Section | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/signin" }); return; }
      setUserId(user.id);
      setPairings(loadPairings(user.id));
      setRx(loadRx(user.id));
      setReferrals(loadReferrals(user.id));
      setLetters(loadLetters(user.id));
    })();
  }, [navigate]);

  useEffect(() => { setQuery(""); }, [section]);

  const matches = (patient: string, dateISO: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const d = new Date(dateISO).toLocaleDateString().toLowerCase();
    return patient.toLowerCase().includes(q) || d.includes(q);
  };

  const filteredRx = useMemo(
    () => rx.filter((r) => matches(r.patient_name, r.created_at)),
    [rx, query],
  );
  const filteredReferrals = useMemo(
    () => referrals.filter((r) => matches(r.patient_name, r.created_at)),
    [referrals, query],
  );
  const filteredLetters = useMemo(
    () => letters.filter((l) => matches(l.patient_name, l.date || l.created_at)),
    [letters, query],
  );

  const addRx = (item: RxItem) => { if (!userId) return; const next = [item, ...rx]; setRx(next); saveRx(userId, next); };
  const addReferral = (item: ReferralItem) => { if (!userId) return; const next = [item, ...referrals]; setReferrals(next); saveReferrals(userId, next); };
  const addLetter = (item: LetterItem) => { if (!userId) return; const next = [item, ...letters]; setLetters(next); saveLetters(userId, next); };

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-6">
      <h1 className="text-2xl font-bold text-[#0D1B2A]">Clinical</h1>
      <p className="mt-1 text-sm text-gray-500">Your professional workspace.</p>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        <SectionTab active={section === "rx"} onClick={() => setSection("rx")} icon={<Pill className="h-4 w-4" />} label="Rx — Prescriptions" />
        <SectionTab active={section === "referrals"} onClick={() => setSection("referrals")} icon={<Send className="h-4 w-4" />} label="Referrals" />
        <SectionTab active={section === "letters"} onClick={() => setSection("letters")} icon={<FileSignature className="h-4 w-4" />} label="Letters & Certificates" />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient name or date"
            className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-[#2563EB] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpenForm(section)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          {section === "rx" ? "New Prescription" : section === "referrals" ? "New Referral" : "New Letter"}
        </button>
      </div>

      <div className="mt-6">
        {section === "rx" && <RxList items={filteredRx} totalCount={rx.length} />}
        {section === "referrals" && <ReferralList items={filteredReferrals} totalCount={referrals.length} />}
        {section === "letters" && <LetterList items={filteredLetters} totalCount={letters.length} />}
      </div>

      {openForm === "rx" && <RxForm pairings={pairings} onClose={() => setOpenForm(null)} onSave={(i) => { addRx(i); setOpenForm(null); }} />}
      {openForm === "referrals" && <ReferralForm pairings={pairings} onClose={() => setOpenForm(null)} onSave={(i) => { addReferral(i); setOpenForm(null); }} />}
      {openForm === "letters" && <LetterForm pairings={pairings} onClose={() => setOpenForm(null)} onSave={(i) => { addLetter(i); setOpenForm(null); }} />}
    </main>
  );
}

function SectionTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
        active ? "bg-[#1D3F7C] text-white shadow-sm" : "bg-white text-[#0D1B2A] hover:bg-gray-50 border border-gray-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({ kindPlural }: { kindPlural: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
      No {kindPlural} yet — tap + to create one.
    </div>
  );
}

function NoMatch() {
  return <p className="text-center text-sm text-gray-500">No results match your search.</p>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <li className="rounded-2xl bg-white p-5 shadow-sm">{children}</li>;
}

function RxList({ items, totalCount }: { items: RxItem[]; totalCount: number }) {
  if (totalCount === 0) return <EmptyState kindPlural="prescriptions" />;
  if (items.length === 0) return <NoMatch />;
  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <Card key={r.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0D1B2A]">{r.patient_name}</h3>
              <p className="mt-0.5 text-sm text-gray-700">{r.drug} · {r.dose} · {r.frequency}</p>
              {r.duration && <p className="text-xs text-gray-500">Duration: {r.duration}</p>}
              {r.notes && <p className="mt-1 text-xs text-gray-500">{r.notes}</p>}
            </div>
            <div className="text-right text-xs">
              <span className={`inline-block rounded-full px-2 py-0.5 font-semibold ${
                r.status === "Active" ? "bg-green-100 text-green-700" :
                r.status === "Completed" ? "bg-gray-100 text-gray-700" : "bg-red-100 text-red-700"
              }`}>{r.status}</span>
              <p className="mt-1 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      ))}
    </ul>
  );
}

function ReferralList({ items, totalCount }: { items: ReferralItem[]; totalCount: number }) {
  if (totalCount === 0) return <EmptyState kindPlural="referrals" />;
  if (items.length === 0) return <NoMatch />;
  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <Card key={r.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0D1B2A]">{r.patient_name}</h3>
              <p className="mt-0.5 text-sm text-gray-700">→ {r.referred_to}</p>
              <p className="mt-1 text-xs text-gray-600">{r.reason}</p>
              {r.notes && <p className="mt-1 text-xs text-gray-500">{r.notes}</p>}
            </div>
            <div className="text-right text-xs">
              <span className={`inline-block rounded-full px-2 py-0.5 font-semibold capitalize ${
                r.urgency === "emergency" ? "bg-red-100 text-red-700" :
                r.urgency === "urgent" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
              }`}>{r.urgency}</span>
              <p className="mt-1 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      ))}
    </ul>
  );
}

function LetterList({ items, totalCount }: { items: LetterItem[]; totalCount: number }) {
  if (totalCount === 0) return <EmptyState kindPlural="letters" />;
  if (items.length === 0) return <NoMatch />;
  return (
    <ul className="space-y-3">
      {items.map((l) => (
        <Card key={l.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#0D1B2A]">{l.patient_name}</h3>
              <p className="mt-0.5 text-sm text-gray-700">{l.type}</p>
              {l.content && <p className="mt-1 line-clamp-3 text-xs text-gray-600 whitespace-pre-wrap">{l.content}</p>}
            </div>
            <p className="shrink-0 text-xs text-gray-500">{l.date || new Date(l.created_at).toLocaleDateString()}</p>
          </div>
        </Card>
      ))}
    </ul>
  );
}

// ===== Forms =====

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0D1B2A]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const fieldCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563EB] focus:outline-none";
const labelCls = "block text-xs font-semibold text-gray-700 mb-1";
const submitCls = "w-full rounded-full bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50";

function PatientSelect({ pairings, value, onChange }: { pairings: ProPairing[]; value: string; onChange: (v: string) => void }) {
  return (
    <select className={fieldCls} value={value} onChange={(e) => onChange(e.target.value)} required>
      <option value="">Select a patient…</option>
      {pairings.map((p) => <option key={p.id} value={p.patient_name}>{p.patient_name}</option>)}
    </select>
  );
}

function RxForm({ pairings, onClose, onSave }: { pairings: ProPairing[]; onClose: () => void; onSave: (i: RxItem) => void }) {
  const [patient, setPatient] = useState("");
  const [drug, setDrug] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      patient_name: patient, drug, dose, frequency, duration, notes,
      status: "Active",
    });
  };

  return (
    <Modal title="New Prescription" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div><label className={labelCls}>Patient</label><PatientSelect pairings={pairings} value={patient} onChange={setPatient} /></div>
        <div><label className={labelCls}>Drug</label><input className={fieldCls} value={drug} onChange={(e) => setDrug(e.target.value)} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Dose</label><input className={fieldCls} value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 500 mg" required /></div>
          <div><label className={labelCls}>Frequency</label><input className={fieldCls} value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. 3x/day" required /></div>
        </div>
        <div><label className={labelCls}>Duration</label><input className={fieldCls} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 7 days" /></div>
        <div><label className={labelCls}>Notes</label><textarea className={fieldCls} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <button type="submit" className={submitCls} disabled={!patient || !drug || !dose || !frequency}>Save Prescription</button>
      </form>
    </Modal>
  );
}

function ReferralForm({ pairings, onClose, onSave }: { pairings: ProPairing[]; onClose: () => void; onSave: (i: ReferralItem) => void }) {
  const [patient, setPatient] = useState("");
  const [referredTo, setReferredTo] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<ReferralItem["urgency"]>("routine");
  const [notes, setNotes] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      patient_name: patient, referred_to: referredTo, reason, urgency, notes,
    });
  };

  return (
    <Modal title="New Referral" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div><label className={labelCls}>Patient</label><PatientSelect pairings={pairings} value={patient} onChange={setPatient} /></div>
        <div><label className={labelCls}>Referred to</label><input className={fieldCls} value={referredTo} onChange={(e) => setReferredTo(e.target.value)} placeholder="Specialist or department" required /></div>
        <div><label className={labelCls}>Reason</label><textarea className={fieldCls} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} required /></div>
        <div>
          <label className={labelCls}>Urgency</label>
          <select className={fieldCls} value={urgency} onChange={(e) => setUrgency(e.target.value as ReferralItem["urgency"])}>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
        <div><label className={labelCls}>Notes</label><textarea className={fieldCls} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <button type="submit" className={submitCls} disabled={!patient || !referredTo || !reason}>Save Referral</button>
      </form>
    </Modal>
  );
}

function LetterForm({ pairings, onClose, onSave }: { pairings: ProPairing[]; onClose: () => void; onSave: (i: LetterItem) => void }) {
  const [patient, setPatient] = useState("");
  const [type, setType] = useState<LetterType>("Discharge summary");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      patient_name: patient, type, content, date,
    });
  };

  return (
    <Modal title="New Letter" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div><label className={labelCls}>Patient</label><PatientSelect pairings={pairings} value={patient} onChange={setPatient} /></div>
        <div>
          <label className={labelCls}>Type</label>
          <select className={fieldCls} value={type} onChange={(e) => setType(e.target.value as LetterType)}>
            <option>Discharge summary</option>
            <option>Sick note</option>
            <option>Medical certificate</option>
            <option>Other</option>
          </select>
        </div>
        <div><label className={labelCls}>Date</label><input type="date" className={fieldCls} value={date} onChange={(e) => setDate(e.target.value)} required /></div>
        <div><label className={labelCls}>Content</label><textarea className={fieldCls} rows={6} value={content} onChange={(e) => setContent(e.target.value)} required /></div>
        <button type="submit" className={submitCls} disabled={!patient || !content}>Save Letter</button>
      </form>
    </Modal>
  );
}
