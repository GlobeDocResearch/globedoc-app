import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

type Status = "idle" | "saving" | "saved";

export type SaveButtonProps = {
  /**
   * Async handler. Return `false` to signal a soft failure (no "Saved ✓" shown,
   * button re-enables silently — assume the handler showed its own toast).
   * Throw to signal an error — SaveButton shows a toast and re-enables.
   */
  onSave: () => Promise<boolean | void> | boolean | void;
  children: ReactNode;
  savingLabel?: string;
  savedLabel?: string;
  errorMessage?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  icon?: ReactNode;
  type?: "button" | "submit";
  ariaLabel?: string;
};

/**
 * Reusable save button that prevents double-submits and gives visual feedback.
 * - Click → disabled + spinner + "Saving..."
 * - Success → brief "Saved ✓" then back to idle
 * - Failure → toast + re-enabled so user can retry
 */
export function SaveButton({
  onSave,
  children,
  savingLabel = "Saving...",
  savedLabel = "Saved ✓",
  errorMessage = "Save failed. Please try again.",
  className,
  style,
  disabled,
  icon,
  type = "button",
  ariaLabel,
}: SaveButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const handleClick = async () => {
    if (status !== "idle" || disabled) return;
    setStatus("saving");
    try {
      const result = await onSave();
      if (!mounted.current) return;
      if (result === false) {
        setStatus("idle");
        return;
      }
      setStatus("saved");
      setTimeout(() => {
        if (mounted.current) setStatus("idle");
      }, 1200);
    } catch (err) {
      console.error("[SaveButton]", err);
      if (mounted.current) setStatus("idle");
      const msg = err instanceof Error && err.message ? err.message : errorMessage;
      toast.error(msg);
    }
  };

  const isBusy = status !== "idle";
  const composedClass = `${className ?? ""} ${isBusy ? "opacity-60 cursor-not-allowed" : ""}`.trim();

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || isBusy}
      className={composedClass}
      style={style}
      aria-busy={status === "saving"}
      aria-label={ariaLabel}
    >
      {status === "saving" ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : status === "saved" ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        icon ?? null
      )}
      <span>
        {status === "saving" ? savingLabel : status === "saved" ? savedLabel : children}
      </span>
    </button>
  );
}
