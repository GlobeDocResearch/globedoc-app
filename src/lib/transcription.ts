/** Swappable, browser-safe transcription boundary. No recording is stored by the app. */
export type VoiceLanguage = "en-GB" | "sv-SE";
export type TranscriptionError = "unsupported" | "permission" | "no-speech" | "network" | "failed";
export interface TranscriptionSession { stop(): void; abort(): void }
export interface TranscriptionService {
  supported(): boolean;
  start(options: {
    language: VoiceLanguage;
    onText(text: string): void;
    onStart(): void;
    onEnd(): void;
    onError(error: TranscriptionError): void;
  }): TranscriptionSession;
}
type Result = { isFinal: boolean; [index: number]: { transcript: string } | undefined };
export interface BrowserRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<Result> }) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => BrowserRecognition;
function browserConstructor(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const browser = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}
export function createBrowserTranscription(getConstructor = browserConstructor): TranscriptionService {
  return {
    supported: () => Boolean(getConstructor()),
    start(options) {
      const Constructor = getConstructor();
      if (!Constructor) throw new Error("unsupported");
      const recognition = new Constructor();
      recognition.lang = options.language;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onstart = options.onStart;
      recognition.onend = options.onEnd;
      recognition.onresult = ({ results }) => {
        // Each event contains the complete result list, including interim revisions.
        options.onText(Array.from(results, result => result[0]?.transcript ?? "").join(" ").trim());
      };
      recognition.onerror = ({ error }) => options.onError(
        error === "not-allowed" || error === "service-not-allowed" || error === "audio-capture" ? "permission"
          : error === "no-speech" ? "no-speech" : error === "network" ? "network" : "failed",
      );
      recognition.start();
      return {
        stop: () => recognition.stop(),
        abort: () => {
          recognition.onresult = null;
          recognition.onstart = null;
          recognition.onend = null;
          recognition.onerror = null;
          recognition.abort();
        },
      };
    },
  };
}
export const transcriptionService: TranscriptionService = createBrowserTranscription();
export function appendDictation(existing: string, dictated: string): string {
  return dictated.trim() ? `${existing}${existing && !/\s$/.test(existing) ? " " : ""}${dictated.trim()}` : existing;
}