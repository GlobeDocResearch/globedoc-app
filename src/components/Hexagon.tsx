import type { ReactNode, CSSProperties } from "react";

const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

export function Hexagon({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-white ${className}`}
      style={{ clipPath: HEX_CLIP, WebkitClipPath: HEX_CLIP, ...style }}
    >
      {children}
    </div>
  );
}
