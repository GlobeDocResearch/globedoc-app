import logo from "@/assets/globedoc-globe.svg";

/** Shared presentation only; each page retains its own header controls. */
export function WorkspaceBrand({ professional = false }: { professional?: boolean }) {
  return (
    <div className="workspace-brand flex min-w-0 items-center gap-3">
      <div className="hub-hexagon flex h-[50px] w-[50px] shrink-0 items-center justify-center bg-hub-on-navy">
        <img src={logo} alt="GlobeDoc" className="h-9 w-9" />
      </div>
      <span className="workspace-wordmark text-2xl leading-none">
        <span className="font-semibold text-hub-on-navy">GlobeDoc</span>{" "}
        <span className="font-normal text-hub-sky">Research Hub</span>
      </span>
      {professional && <span className="shrink-0 rounded-full border border-hub-sky px-2 py-0.5 text-[10px] font-bold uppercase text-hub-sky">Pro</span>}
    </div>
  );
}