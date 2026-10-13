import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Welcome — GlobeDoc" },
    { name: "description", content: "Access GlobeDoc patient and healthcare professional accounts." },
    { property: "og:title", content: "Welcome — GlobeDoc" },
    { property: "og:description", content: "Access GlobeDoc patient and healthcare professional accounts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/signin" });
  },
});
