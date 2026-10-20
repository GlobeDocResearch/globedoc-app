import logo from "@/assets/globedoc-globe.svg";
import { Bell, BriefcaseMedical } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shared presentation only; each page retains its own header controls. */
export function WorkspaceBrand({ professional = false }: { professional?: boolean }) {
  return (
    <div className="workspace-brand flex min-w-0 items-center gap-3">
      <div className="hub-hexagon flex h-[50px] w-[50px] shrink-0 items-center justify-center bg-hub-on-navy">
        <img src={logo} alt="GlobeDoc" className="h-9 w-9" />
      </div>
      <span className="workspace-wordmark text-2xl leading-none">
        <span className="font-semibold text-hub-on-navy">GlobeDoc</span>{" "}
        <span className="workspace-wordmark-sub font-normal text-hub-sky">Research Hub</span>
      </span>
      {professional && (
        <>
          <span className="workspace-pro-badge hidden shrink-0 rounded-full border border-hub-sky px-2 py-0.5 text-[10px] font-bold uppercase text-hub-sky sm:inline-flex">Pro</span>
          <span role="img" aria-label="Professional" className="workspace-pro-badge-round flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-hub-sky text-hub-sky sm:hidden">
            <BriefcaseMedical className="h-3.5 w-3.5" strokeWidth={1.5} />
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Bell button for the logged-in header. The red count badge renders only
 * when there are unread notifications; no notification source exists yet,
 * so pages pass no count and the badge stays hidden.
 */
export function WorkspaceBell({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <Button variant="plain" type="button" aria-label="Notifications" className="workspace-header-control flex items-center justify-center">
      <span className="relative inline-flex">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </span>
    </Button>
  );
}
