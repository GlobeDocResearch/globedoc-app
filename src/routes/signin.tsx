import { createFileRoute } from "@tanstack/react-router";
import { LoginEntryPage } from "@/components/LoginEntryPage";

export const Route = createFileRoute("/signin")({
  head: () => ({ meta: [
    { title: "Sign in — GlobeDoc" },
    { name: "description", content: "Sign in to your GlobeDoc Health Passport account." },
    { property: "og:title", content: "Sign in — GlobeDoc" },
    { property: "og:description", content: "Sign in to your GlobeDoc Health Passport account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: EntryPage,
});

function EntryPage() {
  return <LoginEntryPage audience="combined" />;
}
