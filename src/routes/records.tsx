import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell, LogOut, Home as HomeIcon, Globe, Plane, Link as LinkIcon, User, FileText,
  Plus, MessageCircle, Pencil, Trash2, FileUp, Image as ImageIcon, FlaskConical,
  StickyNote, X, Download, ArrowLeft, Send, Hospital, Rows, CalendarDays,
} from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";
import { Hexagon } from "@/components/Hexagon";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import {
  upsertPassportEntry,
  titleForCondition,
  titleForStay,
  titleForLocation,
  firstYear,
} from "@/lib/passportRecords";
import { SaveButton } from "@/components/ui/save-button";

export const Route = createFileRoute("/records")({
  head: () => ({ meta: [{ title: "Records — GlobeDoc" }] }),
  component: RecordsPage,
});

type EntryType = "note" | "document" | "image" | "lab" | "clinical_note";

type RecordEntry = {
  id: string;
  user_id: string;
  entry_type: EntryType;
  title: string;
  body: string | null;
  file_path: string | null;
  file_name: string | null;
  file_mime: string | null;
  file_size: number | null;
  created_at: string;
  source_kind: string | null;
  event_year: string | null;
  code_icd11: string | null;
  code_ichi: string | null;
};

type Comment = {
  id: string;
  entry_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.txt,application/pdf,image/jpeg,image/png,text/plain";
const MAX_BYTES = 50 * 1024 * 1024;

const T = {
  en: {
    title: "Records", sub: "Your personal health record",
    empty: "Your Records feed is empty — add your first entry with the + button.",
    you: "You", add: "Add entry", pickType: "Choose entry type",
    note: "Personal note", noteSub: "Free text",
    doc: "Document", docSub: "PDF upload",
    image: "Medical image", imageSub: "JPEG / PNG upload",
    lab: "Lab result", labSub: "Upload or text entry",
    titleField: "Title", titleReq: "Title is required",
    commentField: "Comment (optional)", file: "File",
    pickFile: "Choose file", remove: "Remove",
    save: "Save", cancel: "Cancel", saved: "Entry saved",
    deleted: "Entry deleted", confirmDelete: "Delete this entry?",
    edit: "Edit", delete: "Delete", back: "Back",
    comments: "Comments", addComment: "Add a comment…", post: "Post",
    tooLarge: "File exceeds 50 MB", uploading: "Uploading…",
    open: "Open file", download: "Download",
    formats: "Supported: PDF · JPEG · PNG · TXT — max 50 MB",
    fromPassport: "From Health Passport",
    passportDeleteHint: "To remove this entry, update your Health Passport",
    addDetails: "Add details",
    viewFeed: "Feed",
    viewTimeline: "Timeline",
    timelineEmpty: "Your medical timeline will appear here as you fill in your Health Passport. Start by adding conditions and hospitalisations under Medical History.",
    searchPh: "Search records…",
    noMatches: "No records match your search.",
    filterAll: "All",
    filterPassport: "From Health Passport",
    filterClinical: "Clinical note",
  },
  sv: {
    title: "Journal", sub: "Din personliga hälsodagbok",
    empty: "Din journal är tom — lägg till din första post med +-knappen.",
    you: "Du", add: "Lägg till", pickType: "Välj typ av post",
    note: "Personlig anteckning", noteSub: "Fri text",
    doc: "Dokument", docSub: "Ladda upp PDF",
    image: "Medicinsk bild", imageSub: "JPEG / PNG",
    lab: "Provsvar", labSub: "Ladda upp eller skriv text",
    titleField: "Titel", titleReq: "Titel krävs",
    commentField: "Kommentar (valfritt)", file: "Fil",
    pickFile: "Välj fil", remove: "Ta bort",
    save: "Spara", cancel: "Avbryt", saved: "Sparat",
    deleted: "Borttagen", confirmDelete: "Radera denna post?",
    edit: "Redigera", delete: "Radera", back: "Tillbaka",
    comments: "Kommentarer", addComment: "Skriv en kommentar…", post: "Skicka",
    tooLarge: "Filen är större än 50 MB", uploading: "Laddar upp…",
    open: "Öppna fil", download: "Ladda ner",
    formats: "Format: PDF · JPEG · PNG · TXT — max 50 MB",
    fromPassport: "Från Hälsopass",
    passportDeleteHint: "För att ta bort denna post, uppdatera ditt Hälsopass",
    addDetails: "Lägg till detaljer",
    viewFeed: "Flöde",
    viewTimeline: "Tidslinje",
    timelineEmpty: "Din medicinska tidslinje visas här när du fyller i ditt Hälsopass. Börja med att lägga till tillstånd och sjukhusvistelser under Sjukdomshistorik.",
    searchPh: "Sök i journal…",
    noMatches: "Inga poster matchar din sökning.",
  },
};

function typeMeta(type: EntryType, t: typeof T.en) {
  switch (type) {
    case "note": return { Icon: StickyNote, label: t.note, color: "text-amber-600 bg-amber-50" };
    case "document": return { Icon: FileUp, label: t.doc, color: "text-blue-600 bg-blue-50" };
    case "image": return { Icon: ImageIcon, label: t.image, color: "text-purple-600 bg-purple-50" };
    case "lab": return { Icon: FlaskConical, label: t.lab, color: "text-emerald-600 bg-emerald-50" };
    case "clinical_note": return { Icon: StickyNote, label: "Clinical note", color: "text-green-700 bg-green-50" };
  }
}

function formatDate(iso: string, lang: "en" | "sv") {
  return new Date(iso).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function initials(name: string) {
  return name.split(" ").map(s => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function RecordsPage() {
  const { lang } = useI18n();
  const t = T[lang];
  const navigate = useNavigate();
  const handleLogout = async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); };
  const [userId, setUserId] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>(t.you);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [entries, setEntries] = useState<RecordEntry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadType, setUploadType] = useState<EntryType | null>(null);
  const [editingEntry, setEditingEntry] = useState<RecordEntry | null>(null);
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [view, setView] = useState<"feed" | "timeline">("feed");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: prof } = await supabase
        .from("profiles")
        .select("first_name,last_name,avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (prof) {
        const n = `${prof.first_name ?? ""} ${prof.last_name ?? ""}`.trim();
        if (n) setAuthorName(n);
        setAvatarUrl(prof.avatar_url ?? null);
      }
      await backfillFromPassport(user.id);
      await reload(user.id);
      setLoading(false);

      // Re-fetch immediately whenever the Health Passport (or anything else)
      // inserts/updates/deletes a row in record_entries for this user.
      channel = supabase
        .channel(`record-entries-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "record_entries", filter: `user_id=eq.${user.id}` },
          () => { reload(user.id); },
        )
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One-shot reconcile: ensure every existing Medical History row has a
  // matching record_entries row (idempotent via the unique constraint on
  // user_id+source_kind+source_id).
  async function backfillFromPassport(uid: string) {
    try {
      const [mc, hs, rl] = await Promise.all([
        supabase.from("medical_conditions").select("*").eq("user_id", uid),
        supabase.from("hospital_stays").select("*").eq("user_id", uid),
        (supabase as any).from("record_locations").select("*").eq("user_id", uid),
      ]);
      const existing = await supabase
        .from("record_entries")
        .select("source_kind,source_id")
        .eq("user_id", uid)
        .not("source_kind", "is", null);
      const have = new Set<string>(
        ((existing.data ?? []) as any[]).map((r) => `${r.source_kind}::${r.source_id}`),
      );
      const jobs: Promise<unknown>[] = [];
      for (const r of (mc.data ?? []) as any[]) {
        const kind = r.is_resolved ? "condition_past" : "condition_current";
        if (have.has(`${kind}::${r.id}`)) continue;
        jobs.push(upsertPassportEntry({
          userId: uid,
          sourceKind: kind,
          sourceId: r.id,
          title: titleForCondition(r.is_resolved ? "past" : "current", r.condition_name, r.icd11_code ?? null, r.year ?? null),
          body: r.icd11_code ? `ICD-11: ${r.icd11_code}` : null,
          eventYear: r.year ?? null,
          codeIcd11: r.icd11_code ?? null,
        }));
      }
      for (const r of (hs.data ?? []) as any[]) {
        if (have.has(`hospital_stay::${r.id}`)) continue;
        jobs.push(upsertPassportEntry({
          userId: uid,
          sourceKind: "hospital_stay",
          sourceId: r.id,
          title: titleForStay(r),
          body: r.notes ?? null,
          eventYear: firstYear(r.year),
          codeIchi: r.ichi_code ?? null,
          codeIcd11: r.diagnosis_code ?? null,
        }));
      }
      for (const r of ((rl.data ?? []) as any[])) {
        if (have.has(`record_location::${r.id}`)) continue;
        jobs.push(upsertPassportEntry({
          userId: uid,
          sourceKind: "record_location",
          sourceId: r.id,
          title: titleForLocation(r),
          body: r.record_type ?? null,
          eventYear: firstYear(r.years),
        }));
      }
      if (jobs.length) {
        console.log(`[records] backfilling ${jobs.length} passport entries`);
        await Promise.all(jobs);
      }
    } catch (e) {
      console.error("[records] backfill failed", e);
    }
  }

  async function reload(uid: string) {
    const { data } = await supabase
      .from("record_entries")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as RecordEntry[];
    setEntries(rows);
    if (rows.length) {
      const { data: cs } = await supabase
        .from("record_comments")
        .select("entry_id")
        .in("entry_id", rows.map(r => r.id));
      const c: Record<string, number> = {};
      (cs ?? []).forEach(row => { c[row.entry_id] = (c[row.entry_id] ?? 0) + 1; });
      setCounts(c);
    } else {
      setCounts({});
    }
  }

  async function deleteEntry(entry: RecordEntry) {
    if (entry.source_kind) {
      toast.info(t.passportDeleteHint);
      return;
    }
    if (!confirm(t.confirmDelete)) return;
    if (entry.file_path) {
      await supabase.storage.from("records").remove([entry.file_path]);
    }
    const { error } = await supabase.from("record_entries").delete().eq("id", entry.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t.deleted);
    await reload(userId);
  }

  const typeLabel = (et: EntryType) => {
    switch (et) {
      case "note": return t.note;
      case "document": return t.doc;
      case "image": return t.image;
      case "lab": return t.lab;
      case "clinical_note": return "Clinical note";
      default: return et;
    }
  };

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = !q
      ? entries
      : entries.filter((e) => {
          const dateStr = new Date(e.created_at).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB");
          return (
            e.title.toLowerCase().includes(q) ||
            (e.body ?? "").toLowerCase().includes(q) ||
            dateStr.toLowerCase().includes(q) ||
            typeLabel(e.entry_type).toLowerCase().includes(q) ||
            e.entry_type.toLowerCase().includes(q)
          );
        });
    // Chronological sort: passport entries use event_year; manual entries fall
    // back to created_at. Newest first.
    return base.slice().sort((a, b) => {
      const ka = a.event_year ? new Date(`${a.event_year}-12-31`).getTime() : new Date(a.created_at).getTime();
      const kb = b.event_year ? new Date(`${b.event_year}-12-31`).getTime() : new Date(b.created_at).getTime();
      return kb - ka;
    });
  }, [entries, searchQuery, lang, t]);

  // Timeline entries: anything with an event year (passport-derived rows always
  // carry one; manual rows are included if they happen to have an event_year).
  const timelineEntries = useMemo(
    () =>
      filteredEntries
        .filter((e) => (e.event_year ?? "").trim().length > 0)
        .slice()
        .sort((a, b) => Number(a.event_year) - Number(b.event_year)),
    [filteredEntries],
  );
  const timelineGroups = useMemo(() => {
    const map = new Map<string, RecordEntry[]>();
    for (const e of timelineEntries) {
      const y = e.event_year!;
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(e);
    }
    return Array.from(map.entries());
  }, [timelineEntries]);

  const openEntry = useMemo(() => entries.find(e => e.id === openEntryId) ?? null, [entries, openEntryId]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28">
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

      <main className="mx-auto w-full max-w-3xl px-5 py-6">
        <h1 className="text-2xl font-bold text-[#0D1B2A]">{t.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.sub}</p>

        <div className="mt-4 inline-flex rounded-full border border-gray-200 bg-white p-1 text-sm">
          <button
            type="button"
            onClick={() => setView("feed")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition ${
              view === "feed" ? "bg-[#2563EB] text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Rows className="h-4 w-4" /> {t.viewFeed}
          </button>
          <button
            type="button"
            onClick={() => setView("timeline")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition ${
              view === "timeline" ? "bg-[#2563EB] text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <CalendarDays className="h-4 w-4" /> {t.viewTimeline}
          </button>
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPh}
          className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none"
        />

        {loading ? null : view === "feed" ? (
          filteredEntries.length === 0 ? (
            <div className="mt-6 flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <FileText className="h-7 w-7 text-gray-400" />
              </div>
              <p className="mt-4 text-sm text-gray-600">{searchQuery.trim() ? t.noMatches : t.empty}</p>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {filteredEntries.map(e => (
                <RecordEntryCard
                  key={e.id}
                  entry={e}
                  authorName={authorName}
                  avatarUrl={avatarUrl}
                  commentCount={counts[e.id] ?? 0}
                  t={t}
                  lang={lang}
                  onOpen={() => setOpenEntryId(e.id)}
                  onEdit={() => setEditingEntry(e)}
                  onDelete={() => deleteEntry(e)}
                />
              ))}
            </ul>
          )
        ) : timelineGroups.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <CalendarDays className="h-7 w-7 text-gray-400" />
            </div>
            <p className="mt-4 text-sm text-gray-600">{searchQuery.trim() ? t.noMatches : t.timelineEmpty}</p>
          </div>
        ) : (
          <div className="mt-6">
            <ol className="relative space-y-6 border-l-2 border-gray-200 pl-6">
              {timelineGroups.map(([year, items]) => (
                <li key={year} className="relative">
                  <span className="absolute -left-[34px] flex h-6 min-w-[3rem] items-center justify-center rounded-full bg-[#2563EB] px-2 text-xs font-bold text-white">
                    {year}
                  </span>
                  <ul className="space-y-3">
                    {items.map((e) => (
                      <RecordEntryCard
                        key={e.id}
                        entry={e}
                        authorName={authorName}
                        avatarUrl={avatarUrl}
                        commentCount={counts[e.id] ?? 0}
                        t={t}
                        lang={lang}
                        onOpen={() => setOpenEntryId(e.id)}
                        onEdit={() => setEditingEntry(e)}
                        onDelete={() => deleteEntry(e)}
                      />
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        )}
      </main>

      {/* Floating + */}
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        aria-label={t.add}
        className="fixed bottom-24 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg hover:bg-[#1d4ed8]"
      >
        <Plus className="h-6 w-6" />
      </button>

      {pickerOpen && (
        <TypePicker
          t={t}
          onPick={(type) => { setPickerOpen(false); setUploadType(type); }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {(uploadType || editingEntry) && (
        <UploadModal
          t={t}
          userId={userId}
          type={editingEntry ? editingEntry.entry_type : uploadType!}
          existing={editingEntry}
          onClose={() => { setUploadType(null); setEditingEntry(null); }}
          onSaved={async () => { setUploadType(null); setEditingEntry(null); await reload(userId); toast.success(t.saved); }}
        />
      )}

      {openEntry && (
        <EntryDetail
          entry={openEntry}
          authorName={authorName}
          avatarUrl={avatarUrl}
          t={t}
          lang={lang}
          userId={userId}
          onClose={() => { setOpenEntryId(null); reload(userId); }}
        />
      )}

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#1D3F7C] bg-[#1D3F7C]">
        <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
          <NavTab to="/home" icon={<HomeIcon className="h-5 w-5" />} label="Home" />
          <NavTab to="/passport" icon={<Globe className="h-5 w-5" />} label="Passport" />
          <NavTab to="/travel" icon={<Plane className="h-5 w-5" />} label="Travel" />
          <NavTab to="/records" icon={<FileText className="h-5 w-5" />} label="Records" active />
          <NavTab to="/pairing" icon={<LinkIcon className="h-5 w-5" />} label="Pairing" />
          <NavTab to="/profile" icon={<User className="h-5 w-5" />} label="Profile" />
        </ul>
      </nav>
    </div>
  );
}

function RecordEntryCard({
  entry, authorName, avatarUrl, commentCount, t, lang, onOpen, onEdit, onDelete,
}: {
  entry: RecordEntry; authorName: string; avatarUrl: string | null; commentCount: number;
  t: typeof T.en; lang: "en" | "sv";
  onOpen: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const meta = typeMeta(entry.entry_type, t);
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    let revoke: string | null = null;
    (async () => {
      if (entry.file_path && entry.file_mime?.startsWith("image/")) {
        const { data } = await supabase.storage.from("records").createSignedUrl(entry.file_path, 600);
        if (data?.signedUrl) { setThumb(data.signedUrl); }
      }
    })();
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [entry.file_path, entry.file_mime]);

  const isPassport = Boolean(entry.source_kind);

  return (
    <li>
      <article className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Avatar name={authorName} url={avatarUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#0D1B2A]">{authorName}</p>
                <p className="text-xs text-gray-500">{formatDate(entry.created_at, lang)}</p>
              </div>
              {isPassport ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF0FB] px-2 py-0.5 text-xs font-medium text-[#5B6BD4]">
                  <Hospital className="h-3 w-3" />
                  {t.fromPassport}
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                  <meta.Icon className="h-3 w-3" />
                  {meta.label}
                </span>
              )}
            </div>

            <button type="button" onClick={onOpen} className="mt-3 block w-full text-left">
              <h3 className="text-base font-bold text-[#0D1B2A]">{entry.title}</h3>
              {(entry.code_icd11 || entry.code_ichi) && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {entry.code_icd11 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      ICD-11 · {entry.code_icd11}
                    </span>
                  )}
                  {entry.code_ichi && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      ICHI · {entry.code_ichi}
                    </span>
                  )}
                </div>
              )}
              {entry.body && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{entry.body}</p>
              )}
              {thumb && (
                <img src={thumb} alt="" className="mt-3 h-40 w-full rounded-lg object-cover" />
              )}
              {entry.file_path && !entry.file_mime?.startsWith("image/") && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-xs text-gray-600">
                  <FileUp className="h-4 w-4" />
                  <span className="truncate">{entry.file_name}</span>
                </div>
              )}
            </button>

            {isPassport && (
              <p className="mt-2 text-[11px] italic text-gray-500">{t.passportDeleteHint}</p>
            )}

            <div className="mt-3 flex items-center gap-1 text-gray-500">
              <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-gray-100">
                <MessageCircle className="h-4 w-4" /> {commentCount}
              </button>
              <button type="button" onClick={onEdit} aria-label={isPassport ? t.addDetails : t.edit} title={isPassport ? t.addDetails : t.edit} className="ml-auto rounded-md p-1.5 hover:bg-gray-100">
                {isPassport ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              </button>
              {!isPassport && (
                <button type="button" onClick={onDelete} aria-label={t.delete} className="rounded-md p-1.5 text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) return <img src={url} alt="" className="h-10 w-10 rounded-full object-cover" />;
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-sm font-semibold text-white">
      {initials(name) || "U"}
    </div>
  );
}

function TypePicker({ t, onPick, onClose }: { t: typeof T.en; onPick: (type: EntryType) => void; onClose: () => void }) {
  const opts: { type: EntryType; Icon: typeof StickyNote; label: string; sub: string }[] = [
    { type: "note", Icon: StickyNote, label: t.note, sub: t.noteSub },
    { type: "document", Icon: FileUp, label: t.doc, sub: t.docSub },
    { type: "image", Icon: ImageIcon, label: t.image, sub: t.imageSub },
    { type: "lab", Icon: FlaskConical, label: t.lab, sub: t.labSub },
  ];
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0D1B2A]">{t.pickType}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <ul className="space-y-2">
          {opts.map(o => (
            <li key={o.type}>
              <button
                type="button"
                onClick={() => onPick(o.type)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left hover:bg-gray-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[#0D1B2A]">
                  <o.Icon className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-[#0D1B2A]">{o.label}</span>
                  <span className="block text-xs text-gray-500">{o.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function UploadModal({
  t, userId, type, existing, onClose, onSaved,
}: {
  t: typeof T.en; userId: string; type: EntryType; existing: RecordEntry | null;
  onClose: () => void; onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [keepFile, setKeepFile] = useState(Boolean(existing?.file_path));
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const allowsFile = type !== "note";
  const meta = typeMeta(type, t);

  function pickFile(f: File | null) {
    if (!f) { setFile(null); return; }
    if (f.size > MAX_BYTES) { toast.error(t.tooLarge); return; }
    setFile(f);
    setKeepFile(false);
  }

  async function submit() {
    if (!title.trim()) { toast.error(t.titleReq); return; }
    setBusy(true);
    try {
      let file_path = existing?.file_path ?? null;
      let file_name = existing?.file_name ?? null;
      let file_mime = existing?.file_mime ?? null;
      let file_size = existing?.file_size ?? null;

      if (existing && !keepFile && !file && existing.file_path) {
        await supabase.storage.from("records").remove([existing.file_path]);
        file_path = null; file_name = null; file_mime = null; file_size = null;
      }

      if (file) {
        if (existing?.file_path) {
          await supabase.storage.from("records").remove([existing.file_path]);
        }
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
        const path = `${userId}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;
        const { error } = await supabase.storage.from("records").upload(path, file, {
          contentType: file.type || undefined,
        });
        if (error) throw error;
        file_path = path;
        file_name = file.name;
        file_mime = file.type || null;
        file_size = file.size;
      }

      if (existing) {
        const { error } = await supabase.from("record_entries").update({
          title: title.trim(), body: body.trim() || null,
          file_path, file_name, file_mime, file_size,
        }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("record_entries").insert({
          user_id: userId, entry_type: type, title: title.trim(),
          body: body.trim() || null, file_path, file_name, file_mime, file_size,
        });
        if (error) throw error;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-base font-bold text-[#0D1B2A]">
            <meta.Icon className="h-5 w-5" /> {meta.label}
          </h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-gray-600">{t.titleField} *</span>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
          />
        </label>

        <label className="mt-3 block">
          <span className="text-xs font-medium text-gray-600">{t.commentField}</span>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
          />
        </label>

        {allowsFile && (
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-600">{t.file}</span>
            <input
              ref={fileRef}
              type="file"
              accept={type === "image" ? "image/jpeg,image/png" : type === "document" ? "application/pdf" : ACCEPT}
              onChange={e => pickFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <div className="mt-1 flex items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50">
                {t.pickFile}
              </button>
              {(file || (keepFile && existing?.file_name)) && (
                <>
                  <span className="truncate text-xs text-gray-600">{file?.name ?? existing?.file_name}</span>
                  <button type="button" onClick={() => { setFile(null); setKeepFile(false); if (fileRef.current) fileRef.current.value = ""; }} className="text-xs text-red-500 hover:underline">{t.remove}</button>
                </>
              )}
            </div>
            <p className="mt-1 text-[11px] text-gray-500">{t.formats}</p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">{t.cancel}</button>
          <SaveButton
            onSave={submit}
            disabled={busy}
            savingLabel={t.uploading}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] flex items-center gap-2"
          >
            {t.save}
          </SaveButton>
        </div>
      </div>
    </div>
  );
}

function EntryDetail({
  entry, authorName, avatarUrl, t, lang, userId, onClose,
}: {
  entry: RecordEntry; authorName: string; avatarUrl: string | null;
  t: typeof T.en; lang: "en" | "sv"; userId: string; onClose: () => void;
}) {
  const meta = typeMeta(entry.entry_type, t);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    (async () => {
      if (entry.file_path) {
        const { data } = await supabase.storage.from("records").createSignedUrl(entry.file_path, 3600);
        setFileUrl(data?.signedUrl ?? null);
      }
      const { data: cs } = await supabase
        .from("record_comments").select("*").eq("entry_id", entry.id).order("created_at", { ascending: true });
      setComments((cs ?? []) as Comment[]);
    })();
  }, [entry.id, entry.file_path]);

  async function postComment() {
    if (!draft.trim()) return;
    setPosting(true);
    const { data, error } = await supabase.from("record_comments").insert({
      entry_id: entry.id, user_id: userId, body: draft.trim(),
    }).select().single();
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    setComments(c => [...c, data as Comment]);
    setDraft("");
  }

  const isImage = entry.file_mime?.startsWith("image/");
  const isPdf = entry.file_mime === "application/pdf";

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#F8F9FA]">
      <header className="flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <button type="button" onClick={onClose} aria-label={t.back} className="rounded-md p-1 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
          <meta.Icon className="h-3 w-3" /> {meta.label}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center gap-3">
            <Avatar name={authorName} url={avatarUrl} />
            <div>
              <p className="text-sm font-semibold text-[#0D1B2A]">{authorName}</p>
              <p className="text-xs text-gray-500">{formatDate(entry.created_at, lang)}</p>
            </div>
          </div>

          <h1 className="mt-4 text-xl font-bold text-[#0D1B2A]">{entry.title}</h1>
          {entry.body && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{entry.body}</p>}

          {entry.file_path && fileUrl && (
            <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm">
              {isImage ? (
                <img src={fileUrl} alt={entry.file_name ?? ""} className="w-full rounded-lg" />
              ) : isPdf ? (
                <iframe src={fileUrl} title={entry.file_name ?? "PDF"} className="h-[60vh] w-full rounded-lg border" />
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FileUp className="h-4 w-4" />
                  <span className="truncate">{entry.file_name}</span>
                </div>
              )}
              <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline">
                <Download className="h-3 w-3" /> {t.download}
              </a>
            </div>
          )}

          <section className="mt-6">
            <h2 className="text-sm font-bold text-[#0D1B2A]">{t.comments} ({comments.length})</h2>
            <ul className="mt-3 space-y-3">
              {comments.map(c => (
                <li key={c.id} className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Avatar name={authorName} url={avatarUrl} />
                    <div>
                      <p className="text-xs font-semibold text-[#0D1B2A]">{authorName}</p>
                      <p className="text-[11px] text-gray-500">{formatDate(c.created_at, lang)}</p>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{c.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white p-3">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={t.addComment}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
          />
          <button type="button" disabled={posting || !draft.trim()} onClick={postComment} className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#2563EB] px-3 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60">
            <Send className="h-4 w-4" /> {t.post}
          </button>
        </div>
      </div>
    </div>
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
