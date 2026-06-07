import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, X, StickyNote, FileUp, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getActiveSessionsFromSupabase, type ActiveSession } from "@/lib/proPairings";
import { toast } from "sonner";
import { SaveButton } from "@/components/ui/save-button";
import { PatientHealthPassportView } from "@/components/PatientHealthPassportView";

export const Route = createFileRoute("/pro/patients")({
  head: () => ({ meta: [{ title: "Patients — GlobeDoc Pro" }] }),
  component: ProPatientsTab,
});

type Entry = {
  id: string;
  entry_type: string;
  title: string;
  body: string | null;
  file_path: string | null;
  file_name: string | null;
  file_mime: string | null;
  author_name: string | null;
  author_role: string | null;
  created_at: string;
};

type ProEntryType = "clinical_note" | "document" | "suggestion";

function typeMeta(t: string) {
  switch (t) {
    case "clinical_note": return { label: "Clinical note", color: "text-green-700 bg-green-50", Icon: StickyNote };
    case "document": return { label: "Document", color: "text-blue-600 bg-blue-50", Icon: FileUp };
    case "note": return { label: "Note", color: "text-amber-600 bg-amber-50", Icon: StickyNote };
    case "image": return { label: "Image", color: "text-purple-600 bg-purple-50", Icon: FileText };
    case "lab": return { label: "Lab", color: "text-emerald-600 bg-emerald-50", Icon: FileText };
    default: return { label: t, color: "text-gray-600 bg-gray-50", Icon: FileText };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function ProPatientsTab() {
  const [pairings, setPairings] = useState<ActiveSession[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [passport, setPassport] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"passport" | "records">("passport");
  const [patientName, setPatientName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [composer, setComposer] = useState<ProEntryType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  const openAttachment = async (e: Entry) => {
    if (!e.file_path || !token) return;
    setOpening(e.id);
    try {
      const res = await fetch(`/api/public/connect/file?entry_id=${encodeURIComponent(e.id)}`, {
        headers: { "x-session-token": token },
      });
      const json = await res.json();
      if (!res.ok || !json.url) { toast.error(json.error || "Could not open file"); return; }
      const isImage = (e.file_mime || "").startsWith("image/");
      if (isImage) {
        setLightbox({ url: json.url, name: e.file_name || "Image" });
      } else {
        window.open(json.url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setOpening(null);
    }
  };

  const filterChips = [
    { key: "all", label: "All" },
    { key: "note", label: "Note" },
    { key: "clinical_note", label: "Clinical note" },
    { key: "document", label: "Document" },
    { key: "image", label: "Image" },
  ];

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (filterType !== "all") {
      result = result.filter((e) => e.entry_type === filterType);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return result;
    return result.filter((e) => {
      const dateStr = new Date(e.created_at).toLocaleString("en-GB");
      const typeLabel = typeMeta(e.entry_type).label.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.body ?? "").toLowerCase().includes(q) ||
        dateStr.toLowerCase().includes(q) ||
        e.entry_type.toLowerCase().includes(q) ||
        typeLabel.includes(q) ||
        (e.author_name ?? "").toLowerCase().includes(q) ||
        patientName.toLowerCase().includes(q)
      );
    });
  }, [entries, searchQuery, patientName, filterType]);

  useEffect(() => {
    let cancelled = false;
    let currentUserId: string | null = null;

    const load = async (uid: string) => {
      const fresh = await getActiveSessionsFromSupabase(uid);
      if (cancelled) return;
      setPairings(fresh);
      const activeIds = new Set(fresh.map((p) => p.id));
      setSelectedId((prev) => {
        if (prev && !activeIds.has(prev)) {
          setToken("");
          setPatientName("");
          setEntries([]);
          setPassport(null);
          return "";
        }
        return prev;
      });
    };

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      currentUserId = user.id;
      await load(user.id);
    })();

    const onVisible = () => {
      if (document.visibilityState === "visible" && currentUserId) {
        void load(currentUserId);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  const onSelect = async (id: string) => {
    setSelectedId(id);
    const p = pairings.find(x => x.id === id);
    if (!p) return;
    setToken(p.id);
    setPatientName(p.patient_name);
    await loadEntries(p.id);
  };

  const loadEntries = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/public/connect/passport", { headers: { "x-session-token": t } });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Could not load records"); setEntries([]); setPassport(null); return; }
      setEntries(json.records || []);
      setPassport(json);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => token && loadEntries(token);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-6">
      <h1 className="text-2xl font-bold text-[#0D1B2A]">Patients</h1>
      <p className="mt-1 text-sm text-gray-500">View and contribute to your patients' records.</p>

      <div className="mt-5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Select patient</label>
        <select
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none"
        >
          <option value="">— Choose a patient —</option>
          {pairings.map(p => (
            <option key={p.id} value={p.id}>{p.patient_name}</option>
          ))}
        </select>
      </div>

      {selectedId && (() => {
        const sel = pairings.find((p) => p.id === selectedId);
        if (!sel) return null;
        const hasChips = (sel.reason_chips?.length ?? 0) > 0;
        const hasText = !!(sel.reason_text && sel.reason_text.trim());
        if (!hasChips && !hasText) return null;
        return <ReasonBanner chips={sel.reason_chips || []} text={sel.reason_text || ""} />;
      })()}

      <div className="mt-5 flex gap-1 rounded-xl bg-gray-100 p-1">

        {([
          { key: "passport", label: "Health Passport" },
          { key: "records", label: "Records" },
        ] as const).map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-white text-[#0D1B2A] shadow-sm" : "text-gray-500 hover:text-[#0D1B2A]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {!selectedId ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <FileText className="mx-auto h-7 w-7 text-gray-400" />
          <p className="mt-3 text-sm text-gray-600">
            {activeTab === "passport"
              ? "Select a patient from the dropdown to view their Health Passport."
              : "Select a patient above to view their records."}
          </p>
        </div>
      ) : activeTab === "passport" ? (
        <div className="mt-5">
          {loading || !passport ? (
            <div className="mt-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : (
            <PatientHealthPassportView passport={passport} />
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {filterChips.map((chip) => {
              const active = filterType === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setFilterType(chip.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-[#2563EB] text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records…"
            className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none"
          />
          {loading ? (
            <div className="mt-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : entries.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
              <p className="text-sm text-gray-600">No records yet for {patientName}.</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
              <p className="text-sm text-gray-600">No records match your search.</p>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {filteredEntries.map(e => {
            const m = typeMeta(e.entry_type);
            return (
              <li key={e.id}>
                <article className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0D1B2A]">
                        {e.author_name || patientName}
                        {e.author_role && <span className="ml-1 font-normal text-gray-500">· {e.author_role}</span>}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(e.created_at)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${m.color}`}>
                      <m.Icon className="h-3 w-3" />{m.label}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-[#0D1B2A]">{e.title}</h3>
                  {e.body && <p className="mt-1 line-clamp-3 text-sm text-gray-600">{e.body}</p>}
                  {e.file_name && (
                    <button
                      type="button"
                      onClick={() => openAttachment(e)}
                      disabled={opening === e.id}
                      className="mt-3 flex w-full items-center gap-2 rounded-lg border border-gray-200 p-2 text-left text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {opening === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                      <span className="truncate">{e.file_name}</span>
                    </button>
                  )}
                  <div className="mt-3 flex items-center text-gray-400">
                    <button type="button" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-gray-100">
                      <MessageCircle className="h-4 w-4" /> Comment
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
            </ul>
          )}
        </>
      )}


      {selectedId && activeTab === "records" && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Add entry"
          className="fixed bottom-24 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg hover:bg-[#1d4ed8]"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {pickerOpen && (
        <ProTypePicker
          onPick={(t) => { setPickerOpen(false); setComposer(t); }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {composer && (
        <ProEntryComposer
          type={composer}
          token={token}
          onClose={() => setComposer(null)}
          onSaved={async () => { setComposer(null); await refresh(); toast.success("Entry added"); }}
        />
      )}
      {lightbox && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </main>
  );
}

function ProTypePicker({ onPick, onClose }: { onPick: (t: ProEntryType) => void; onClose: () => void }) {
  const opts: { t: ProEntryType; emoji: string; label: string }[] = [
    { t: "clinical_note", emoji: "📋", label: "Clinical note" },
    { t: "document", emoji: "📎", label: "Document upload" },
    { t: "suggestion", emoji: "💊", label: "Passport update suggestion" },
  ];
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0D1B2A]">Choose entry type</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <ul className="space-y-2">
          {opts.map(o => (
            <li key={o.t}>
              <button
                type="button"
                onClick={() => onPick(o.t)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left hover:bg-gray-50"
              >
                <span className="text-2xl">{o.emoji}</span>
                <span className="text-sm font-semibold text-[#0D1B2A]">{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProEntryComposer({
  type, token, onClose, onSaved,
}: { type: ProEntryType; token: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const titleLabel = type === "clinical_note" ? "Clinical note title"
    : type === "document" ? "Document title"
    : "Suggestion title";

  async function submit(): Promise<boolean | void> {
    if (!title.trim()) { toast.error("Title required"); return false; }
    if (type === "document" && !file) { toast.error("Choose a file"); return false; }
    if ((type === "clinical_note" || type === "suggestion") && !body.trim()) { toast.error("Body required"); return false; }
    setBusy(true);
    try {
      let file_base64: string | undefined;
      let file_name: string | undefined;
      let file_mime: string | undefined;
      if (file) {
        if (file.size > 25 * 1024 * 1024) { toast.error("File exceeds 25 MB"); return false; }
        const ab = await file.arrayBuffer();
        let bin = "";
        const bytes = new Uint8Array(ab);
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        file_base64 = btoa(bin);
        file_name = file.name;
        file_mime = file.type;
      }
      const res = await fetch("/api/public/connect/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-token": token },
        body: JSON.stringify({ type, title: title.trim(), body: body.trim() || undefined, file_base64, file_name, file_mime }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save");
      onSaved();
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0D1B2A]">{titleLabel}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none"
          />
          {type !== "document" ? (
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              placeholder={type === "suggestion" ? "Describe the suggested passport update…" : "Write your clinical note…"}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
            />
          ) : (
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <SaveButton
            onSave={submit}
            disabled={busy}
            savingLabel="Saving…"
            className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 flex items-center gap-2"
          >
            Save
          </SaveButton>
        </div>
      </div>
    </div>
  );
}

function ReasonBanner({ chips, text }: { chips: string[]; text: string }) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const targetLang = (typeof navigator !== "undefined" ? navigator.language : "en").slice(0, 5);

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setTranslating(true);
    try {
      const res: any = await translateDeepl({ data: { target: targetLang, text } });
      if (res?.error) {
        toast.error("Could not translate");
      } else {
        setTranslated(res?.translation || "");
      }
    } catch {
      toast.error("Could not translate");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-gray-200 border-l-4 border-l-[#0D1B2A] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-bold text-[#0D1B2A]">Reason for visit</h2>
        {text.trim() && (
          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-[#0D1B2A] hover:bg-gray-50 disabled:opacity-60"
          >
            {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
            Translate
          </button>
        )}
      </div>
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-[#0D1B2A]/5 px-2.5 py-0.5 text-xs font-semibold text-[#0D1B2A]">
              {c}
            </span>
          ))}
        </div>
      )}
      {text.trim() && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{text}</p>
      )}
      {translated !== null && (
        <p className="mt-2 whitespace-pre-wrap border-t border-gray-100 pt-2 text-sm italic text-gray-600">
          {translated}
        </p>
      )}
    </div>
  );
}
