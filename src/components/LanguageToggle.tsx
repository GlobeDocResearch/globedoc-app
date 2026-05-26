import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card/60 p-0.5 text-xs font-medium shadow-sm backdrop-blur",
        className,
      )}
    >
      {(["en", "sv"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            lang === l
              ? "bg-brand-navy text-brand-navy-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
