import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { transcriptionService, type TranscriptionSession, type VoiceLanguage, type TranscriptionError } from "@/lib/transcription";

const copy = {
  en: {
    title: "Voice note", start: "Start recording", stop: "Stop", stopping: "Stopping…",
    listening: "Listening…", ready: "Ready to record", use: "Use text", retry: "Record again",
    notice: "Voice input is in test mode — do not dictate sensitive information yet.",
    privacy: "Your browser may send audio to its speech recognition provider. Audio is not saved by GlobeDoc.",
    dictate: "Dictate text", language: "Voice language",
    unsupported: "Voice input is not supported in this browser. You can still type your note.",
    permission: "Microphone access is unavailable. Check your browser permissions and try again.",
    "no-speech": "No speech was detected. Please try again.",
    network: "Voice input could not connect. Check your connection and try again.",
    failed: "Voice input stopped unexpectedly. Please try again.",
  },
  sv: {
    title: "Röstanteckning", start: "Starta inspelning", stop: "Stoppa", stopping: "Stoppar…",
    listening: "Lyssnar…", ready: "Redo att spela in", use: "Använd text", retry: "Spela in igen",
    notice: "Röstinmatning är i testläge — diktera inte känslig information ännu.",
    privacy: "Din webbläsare kan skicka ljud till sin taligenkänningstjänst. GlobeDoc sparar inte ljudet.",
    dictate: "Diktera text", language: "Språk för röstinmatning",
    unsupported: "Röstinmatning stöds inte i den här webbläsaren. Du kan fortfarande skriva din anteckning.",
    permission: "Mikrofonen är inte tillgänglig. Kontrollera webbläsarens behörigheter och försök igen.",
    "no-speech": "Inget tal upptäcktes. Försök igen.",
    network: "Röstinmatningen kunde inte ansluta. Kontrollera anslutningen och försök igen.",
    failed: "Röstinmatningen avbröts oväntat. Försök igen.",
  },
};

export function VoiceInput({ lang, onText, onClose }: { lang: "en" | "sv"; onText(text: string): void; onClose(): void }) {
  const t = copy[lang];
  const [language, setLanguage] = useState<VoiceLanguage>(lang === "sv" ? "sv-SE" : "en-GB");
  const [state, setState] = useState<"idle" | "starting" | "recording" | "stopping">("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<TranscriptionError | null>(null);
  const session = useRef<TranscriptionSession | null>(null);
  const transcript = useRef("");
  const finishing = useRef(false);
  const prefix = useRef("");
  const active = state !== "idle";
  useEffect(() => () => session.current?.abort(), []);
  function start() {
    if (!transcriptionService.supported()) { setError("unsupported"); return; }
    setError(null);
    finishing.current = false;
    prefix.current = transcript.current;
    setState("starting");
    try {
      session.current = transcriptionService.start({
        language,
        onStart: () => setState("recording"),
        onText: value => {
          transcript.current = [prefix.current, value].filter(Boolean).join(" ");
          setText(transcript.current);
        },
        onError: value => { finishing.current = false; setError(value); setState("idle"); },
        onEnd: () => {
          setState("idle");
          if (finishing.current && transcript.current.trim()) onText(transcript.current);
          finishing.current = false;
        },
      });
    } catch { setError("failed"); setState("idle"); }
  }
  function stop() {
    finishing.current = true;
    setState("stopping");
    session.current?.stop();
  }
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="workspace-card max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto bg-card">
        <DialogTitle className="workspace-heading">{t.title}</DialogTitle>
        <DialogDescription className="text-xs">{t.notice}</DialogDescription>
        <p className="text-xs text-muted-foreground">{t.privacy}</p>
        <label className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          {t.language}
          <select aria-label={t.language} value={language} disabled={active} onChange={e => setLanguage(e.target.value === "sv-SE" ? "sv-SE" : "en-GB")} className="rounded-md border border-border bg-card px-3 py-2 text-foreground">
            <option value="en-GB">English</option><option value="sv-SE">Svenska</option>
          </select>
        </label>
        <div className="flex flex-col items-center gap-3 py-4">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-hub-navy/10 text-hub-navy ${state === "recording" ? "animate-pulse motion-reduce:animate-none" : ""}`}>
            <Mic className="h-12 w-12" aria-hidden="true" />
          </div>
          <p role="status" className="text-sm text-muted-foreground">{state === "recording" ? t.listening : state === "stopping" ? t.stopping : t.ready}</p>
        </div>
        <div data-no-translate="true" translate="no" aria-live="polite" className="min-h-24 whitespace-pre-wrap break-words text-sm text-foreground">{text}</div>
        {error && <p role="alert" className="text-sm text-destructive">{t[error]}</p>}
        <div className="flex justify-center gap-2">
          {active ? <Button onClick={stop} disabled={state !== "recording"} className="rounded-full bg-hub-navy text-hub-on-navy hover:bg-hub-navy hover:opacity-90"><Square className="h-4 w-4" />{t.stop}</Button>
            : <Button onClick={start} className="rounded-full bg-hub-navy text-hub-on-navy hover:bg-hub-navy hover:opacity-90"><Mic className="h-4 w-4" />{text ? t.retry : t.start}</Button>}
          {!active && text.trim() && <Button variant="outline" onClick={() => onText(text)}>{t.use}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DictationButton({ lang, onClick }: { lang: "en" | "sv"; onClick(): void }) {
  return <Button variant="plain" type="button" onClick={onClick} aria-label={copy[lang].dictate} title={copy[lang].dictate} className="absolute bottom-2 right-2 h-8 w-8 rounded-full p-1.5 text-hub-navy hover:bg-hub-navy/10"><Mic className="h-4 w-4" /></Button>;
}