import { createFileRoute, redirect } from "@tanstack/react-router";

import { LaunchPage } from "@/components/LaunchPage";

type BeforeLoadHostContext = {
  serverContext?: {
    requestHost?: string;
  };
};

function getHost(context: BeforeLoadHostContext): string {
  if (typeof window !== "undefined") {
    return window.location.hostname;
  }

  return context.serverContext?.requestHost ?? "";
}

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
  beforeLoad: (context) => {
    const host = getHost(context as BeforeLoadHostContext);
    if (!isMarketingHost(host)) {
      throw redirect({ to: "/signin" });
    }
  },
  component: LaunchPage,
});
