import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/passport/$section")({
  head: () => ({ meta: [{ title: "Passport Section — GlobeDoc" }] }),
  component: SectionPage,
});

const TITLES: Record<string, string> = {
  "medical-history": "Medical History",
  "medications": "Medications",
  "allergies": "Allergies",
  "vaccinations": "Vaccinations",
  "heredity": "Heredity",
  "lifestyle": "Lifestyle & Risk",
};

function SectionPage() {
  const { section } = useParams({ from: "/passport/$section" });
  const title = TITLES[section] ?? "Section";
  return (
    <div className="min-h-screen bg-[#0D1B2A] px-5 pt-6 text-white">
      <Link to="/passport" className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Passport
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-gray-400">This section's form is coming soon.</p>
    </div>
  );
}
