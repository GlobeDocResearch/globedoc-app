import { LanguageGlobeButton } from "@/components/LanguagePicker";

/**
 * Backwards-compatible wrapper. The original EN | SV toggle is replaced
 * with a globe icon button that opens the full language picker.
 */
export function LanguageToggle({ className }: { className?: string }) {
  return <LanguageGlobeButton className={className} />;
}
