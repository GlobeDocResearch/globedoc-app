import logo from "@/assets/globedoc-logo.svg";
import { Hexagon } from "@/components/Hexagon";
import { useI18n } from "@/lib/i18n";

export function BrandHeader({ tagline = true }: { tagline?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center text-center">
      <Hexagon style={{ height: "6.04rem", width: "6.04rem" }}>
        <img src={logo} alt="GlobeDoc" className="h-[4.62rem] w-[4.62rem]" />
      </Hexagon>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#1D438C]">GlobeDoc</h1>
      {tagline && (
        <p className="mt-1 text-base text-muted-foreground">{t("brand.tagline")}</p>
      )}
    </div>
  );
}
