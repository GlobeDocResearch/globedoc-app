import { useBlocker } from "@tanstack/react-router";
import { useI18n, type Lang } from "@/lib/i18n";

const TR: Record<Lang, Record<string, string>> = {
  en: {
    block_msg: "You have unsaved changes — save or discard?",
    save: "Save",
    discard: "Discard",
    leave_title: "Unsaved changes",
    leave_msg: "You have unsaved changes. If you leave now your changes will be lost.",
    stay_save: "Stay and save",
    leave: "Leave without saving",
  },
  sv: {
    block_msg: "Du har osparade ändringar — spara eller avfärda?",
    save: "Spara",
    discard: "Avfärda",
    leave_title: "Osparade ändringar",
    leave_msg: "Du har osparade ändringar. Om du lämnar nu förlorar du dina ändringar.",
    stay_save: "Stanna och spara",
    leave: "Lämna utan att spara",
  },
};

export function useUnsavedText() {
  const { lang } = useI18n();
  return (k: keyof typeof TR["en"]) => TR[lang][k] ?? TR.en[k];
}

/**
 * Page-level navigation guard. Blocks router navigations when `dirty` is true.
 * Also wires browser beforeunload.
 */
export function useLeaveGuard(dirty: boolean) {
  return useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: () => dirty,
    withResolver: true,
  });
}

export function LeaveDialog({
  resolver,
  onSaveAndLeave,
}: {
  resolver: ReturnType<typeof useLeaveGuard>;
  onSaveAndLeave: () => Promise<unknown> | unknown;
}) {
  const tr = useUnsavedText();
  if (resolver.status !== "blocked") return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-bold text-[#0D1B2A]">{tr("leave_title")}</h3>
        <p className="mt-2 text-sm text-gray-700">{tr("leave_msg")}</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={async () => {
              await onSaveAndLeave();
              resolver.proceed?.();
            }}
            className="w-full rounded-xl bg-[#0D1B2A] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            {tr("stay_save")}
          </button>
          <button
            type="button"
            onClick={() => resolver.proceed?.()}
            className="w-full rounded-xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            {tr("leave")}
          </button>
          <button
            type="button"
            onClick={() => resolver.reset?.()}
            className="w-full px-4 py-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function CardUnsavedBanner({
  onSave,
  onDiscard,
}: {
  onSave: () => void;
  onDiscard: () => void;
}) {
  const tr = useUnsavedText();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
      <span className="text-xs font-medium text-amber-900">{tr("block_msg")}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
        >
          {tr("save")}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
        >
          {tr("discard")}
        </button>
      </div>
    </div>
  );
}
