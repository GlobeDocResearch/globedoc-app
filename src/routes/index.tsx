import { createFileRoute, redirect } from "@tanstack/react-router";

import { LaunchPage } from "@/components/LaunchPage";

function isMarketingHost(host: string | undefined | null): boolean {
  if (!host) return false;
  const h = host.toLowerCase().split(":")[0];
  return h === "globedoc.com" || h === "www.globedoc.com";
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GlobeDoc — Coming Soon" },
      { name: "description", content: "GlobeDoc is launching soon — a new way to own your health, wherever you are in the world." },
      { property: "og:title", content: "GlobeDoc — Coming Soon" },
      { property: "og:description", content: "GlobeDoc is launching soon — a new way to own your health, wherever you are in the world." },
    ],
  }),
  beforeLoad: async () => {
    let host: string | undefined;
    if (typeof window !== "undefined") {
      host = window.location.hostname;
    } else {
      try {
        const { getRequestHost } = await import("@tanstack/react-start/server");
        host = getRequestHost({ xForwardedHost: true });
      } catch {
        host = undefined;
      }
    }
    if (!isMarketingHost(host)) {
      throw redirect({ to: "/signin" });
    }
  },
  component: LaunchPage,
});
