import { createFileRoute } from "@tanstack/react-router";
import { LoginEntryPage } from "@/components/LoginEntryPage";

export const Route = createFileRoute("/pro/")({
  head: () => ({ meta: [
    { title: "Healthcare Professionals — GlobeDoc" },
    { name: "description", content: "Access the GlobeDoc professional research demo and patient pairing." },
    { property: "og:title", content: "Healthcare Professionals — GlobeDoc" },
    { property: "og:description", content: "Access the GlobeDoc professional research demo and patient pairing." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: EntryPage,
});

function EntryPage() {
  return <LoginEntryPage audience="professional" />;
}
