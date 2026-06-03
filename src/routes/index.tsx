import { createFileRoute, redirect } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";

import { LaunchPage } from "@/components/LaunchPage";

const getHost = createIsomorphicFn()
  .client(() => window.location.hostname)
  .server(() => {
    try {
      return getRequestHost({ xForwardedHost: true });
    } catch {
      return "";
    }
  });

function isMarketingHost(host: string): boolean {
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
  beforeLoad: () => {
    const host = getHost();
    if (!isMarketingHost(host)) {
      throw redirect({ to: "/signin" });
    }
  },
  component: LaunchPage,
});
