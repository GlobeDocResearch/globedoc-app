import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Info, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { isPublicEntryPath, usesMachineTranslation } from "@/lib/translationPolicy";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const TRANSLATION_PRIVACY_TEXT =
  "For your privacy, your health information is never sent to translation services. Menus and buttons are translated automatically; your records are shown in their original language. We are working on a secure, privacy-preserving translation solution.";

const SEEN_KEY = "gd-translation-privacy-note-seen";

/** One-time, dismissible note shown inside the logged-in app for machine-translated languages. */
export function TranslationPrivacyNote() {
  const { langCode } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!usesMachineTranslation(langCode) || isPublicEntryPath(pathname)) return setShow(false);
    if (localStorage.getItem(SEEN_KEY) !== "1") setShow(true);
  }, [langCode, pathname]);

  if (!show) return null;
  const dismiss = () => { localStorage.setItem(SEEN_KEY, "1"); setShow(false); };
  return (
    <div role="status" data-no-translate className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-md items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground shadow-lg">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">{TRANSLATION_PRIVACY_TEXT}</p>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded p-0.5 hover:bg-muted">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Small info icon next to the language selector. */
export function TranslationPrivacyInfo() {
  return (
    <Popover>
      <PopoverTrigger aria-label="About translation and privacy" className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
        <Info className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent data-no-translate className="w-72 text-xs text-muted-foreground">{TRANSLATION_PRIVACY_TEXT}</PopoverContent>
    </Popover>
  );
}
