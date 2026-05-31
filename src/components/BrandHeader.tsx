import logo from "@/assets/globedoc-logo.svg";
import { useI18n } from "@/lib/i18n";

export function BrandHeader({ tagline = true }: { tagline?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card shadow-[var(--shadow-card)]">
        <img src={logo} alt="GlobeDoc" className="h-[4.75rem] w-[4.75rem]" />
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#1D438C]">GlobeDoc</h1>
      {tagline && (
        <p className="mt-1 text-base text-muted-foreground">{t("brand.tagline")}</p>
      )}
    </div>
  );
}
