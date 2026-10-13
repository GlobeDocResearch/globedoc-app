import { createFileRoute } from "@tanstack/react-router";
import { LoginEntryPage } from "@/components/LoginEntryPage";

export const Route = createFileRoute("/patient")({
  head: () => ({ meta: [
    { title: "Patient sign in — GlobeDoc" },
    { name: "description", content: "Access your GlobeDoc patient research demo account." },
    { property: "og:title", content: "Patient sign in — GlobeDoc" },
    { property: "og:description", content: "Access your GlobeDoc patient research demo account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: EntryPage,
});

function EntryPage() {
  return <LoginEntryPage audience="patient" />;
}
