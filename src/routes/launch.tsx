import { createFileRoute } from "@tanstack/react-router";

import { LaunchPage } from "@/components/LaunchPage";

export const Route = createFileRoute("/launch")({
  head: () => ({
    meta: [
      { title: "GlobeDoc — Coming Soon" },
      { name: "description", content: "GlobeDoc is launching soon — a new way to own your health, wherever you are in the world." },
      { property: "og:title", content: "GlobeDoc — Coming Soon" },
      { property: "og:description", content: "GlobeDoc is launching soon — a new way to own your health, wherever you are in the world." },
    ],
  }),
  component: LaunchPage,
});
