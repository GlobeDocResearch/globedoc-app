import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Shield } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal & Privacy — GlobeDoc" },
      { name: "description", content: "GlobeDoc legal, privacy and data protection information." },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  const { t, lang, setLang } = useI18n();

  const sections: { id: string; titleKey: TKey; body: TKey[] }[] = [
    {
      id: "tos",
      titleKey: "legal.s1",
      body: [
        "legal.tos.updated",
        "legal.tos.intro",
        "legal.tos.h1",
        "legal.tos.p1",
        "legal.tos.h2",
        "legal.tos.p2",
        "legal.tos.h3",
        "legal.tos.p3",
        "legal.tos.h4",
        "legal.tos.p4",
        "legal.tos.h5",
        "legal.tos.p5",
        "legal.tos.h6",
        "legal.tos.p6",
        "legal.tos.h7",
        "legal.tos.p7",
      ],
    },
    {
      id: "pp",
      titleKey: "legal.s2",
      body: [
        "legal.pp.intro",
        "legal.pp.controller",
        "legal.pp.collectTitle",
        "legal.pp.collect1",
        "legal.pp.collect2",
        "legal.pp.collect3",
        "legal.pp.collect4",
        "legal.pp.basis",
        "legal.pp.use",
        "legal.pp.storage",
        "legal.pp.retention",
        "legal.pp.rights",
        "legal.pp.cookies",
      ],
    },
    {
      id: "ds",
      titleKey: "legal.s3",
      body: [
        "legal.ds.intro",
        "legal.ds.l1",
        "legal.ds.l2",
        "legal.ds.l3",
        "legal.ds.l4",
        "legal.ds.l5",
        "legal.ds.l6",
        "legal.ds.report",
      ],
    },
    {
      id: "md",
      titleKey: "legal.s4",
      body: ["legal.md.h", "legal.md.p1", "legal.md.p2", "legal.md.p3"],
    },
    {
      id: "cd",
      titleKey: "legal.s5",
      body: ["legal.cd.p1", "legal.cd.p2", "legal.cd.p3"],
    },
    {
      id: "sp",
      titleKey: "legal.s6",
      body: [
        "legal.sp.intro",
        "legal.sp.l1",
        "legal.sp.l2",
        "legal.sp.l3",
        "legal.sp.outro",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#0D1B2A] text-white">
        <div className="mx-auto max-w-3xl px-5 pt-5 pb-7">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("legal.back")}
          </Link>

          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-blue/30 ring-1 ring-brand-blue/40">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">{t("legal.title")}</h1>
              <p className="mt-1 text-sm text-white/60">{t("legal.subtitle")}</p>
            </div>
          </div>

          <div className="mt-5 inline-flex items-center rounded-full bg-white/5 p-1 ring-1 ring-white/10">
            {(["en", "sv"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  lang === l
                    ? "bg-white text-[#0D1B2A]"
                    : "text-white/70 hover:text-white",
                )}
              >
                {l === "en" ? t("legal.langEn") : t("legal.langSv")}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-5 py-6">
        <Accordion type="multiple" className="space-y-3">
          {sections.map((s) => (
            <AccordionItem
              key={s.id}
              value={s.id}
              className="rounded-2xl border border-border bg-white px-5 [&]:border-b"
            >
              <AccordionTrigger className="py-4 text-base font-semibold text-[#0D1B2A] hover:no-underline">
                {t(s.titleKey)}
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-5 pt-1 text-sm leading-relaxed text-foreground/80">
                {s.body.map((k) => (
                  <p key={k} className={isHeading(k) ? "font-semibold text-[#0D1B2A]" : undefined}>
                    {t(k)}
                  </p>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Contact card */}
        <section className="mt-4 rounded-2xl border border-border bg-muted/40 p-5">
          <h2 className="text-base font-semibold text-[#0D1B2A]">{t("legal.contactTitle")}</h2>
          <p className="mt-2 text-sm text-foreground/80">{t("legal.contactCompany")}</p>
          <p className="mt-1 text-sm text-foreground/80">
            {t("legal.contactEmailLabel")}{" "}
            <a href="mailto:hello@globedoc.com" className="text-brand-blue hover:underline">
              hello@globedoc.com
            </a>
          </p>
        </section>

        <footer className="mt-5 px-1 pb-8 text-xs text-muted-foreground">
          <p>{t("legal.footer1")}</p>
          <p className="mt-1">{t("legal.footer2")}</p>
        </footer>
      </main>
    </div>
  );
}

function isHeading(key: string) {
  return (
    /\.h\d$/.test(key) ||
    key.endsWith(".collectTitle") ||
    key === "legal.tos.updated" ||
    key === "legal.md.h"
  );
}
