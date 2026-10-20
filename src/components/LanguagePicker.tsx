import { useState } from "react";
import { Check, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { useLanguages } from "@/lib/useLanguages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Shared dialog that lists every supported UI language. */
export function LanguagePickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { langCode, setLangCode } = useI18n();
  const LANGUAGES = useLanguages();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-no-translate>
        <DialogHeader>
          <DialogTitle>Choose language</DialogTitle>
        </DialogHeader>
        <ul className="max-h-[60vh] divide-y divide-gray-100 overflow-y-auto">
          {LANGUAGES.map((l) => {
            const selected = l.code === langCode;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  onClick={() => {
                    setLangCode(l.code);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-3 text-left text-sm hover:bg-gray-50",
                    selected && "font-semibold text-[#2563EB]",
                  )}
                >
                  <span>
                    <span>{l.nativeName}</span>
                    {l.nativeName !== l.name && (
                      <span className="ml-2 text-xs text-gray-400">{l.name}</span>
                    )}
                  </span>
                  {selected && <Check className="h-4 w-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/** Round globe icon button — used in the top-right of public pages. */
export function LanguageGlobeButton({ className, appearance = "default" }: { className?: string; appearance?: "default" | "header" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="plain" size="icon"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Choose language"
        data-no-translate
        className={cn(
          appearance === "header"
            ? "h-9 w-9 shrink-0 rounded-full border border-auth-header-foreground/35 bg-transparent p-0 text-auth-header-foreground/90 hover:bg-auth-header-foreground/10"
            : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 text-foreground shadow-sm backdrop-blur transition hover:bg-card",
          className,
        )}
      >
        <Globe className="h-4 w-4" />
      </Button>
      <LanguagePickerDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Row used inside Settings — globe icon + current language name. */
export function LanguagePickerRow() {
  const [open, setOpen] = useState(false);
  const { langCode } = useI18n();
  const LANGUAGES = useLanguages();
  const current = LANGUAGES.find((l) => l.code === langCode) ?? LANGUAGES[0];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-no-translate
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-[#0D1B2A] hover:bg-gray-50"
      >
        <Globe className="h-4 w-4" />
        <span>{current.nativeName}</span>
      </button>
      <LanguagePickerDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
