import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { BrandHeader } from "@/components/BrandHeader";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — GlobeDoc" },
      { name: "description", content: "Create your GlobeDoc Health Passport account." },
    ],
  }),
  component: SignupPage,
});

const detailsSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwords-mismatch",
  });

type Details = z.infer<typeof detailsSchema>;

function SignupPage() {
  const { t } = useI18n();
  const [step, setStep] = useState<1 | 2>(1);
  const [details, setDetails] = useState<Details | null>(null);

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background px-5 py-10">
      <LanguageToggle className="absolute right-4 top-4" />

      <BrandHeader tagline={false} />

      <div className="mt-6 w-full max-w-md">
        <p className="text-center text-base text-muted-foreground">{t("signup.title")}</p>
        <StepIndicator step={step} />
      </div>

      {step === 1 ? (
        <DetailsStep
          onContinue={(d) => {
            setDetails(d);
            setStep(2);
            window.scrollTo({ top: 0 });
          }}
          initial={details}
        />
      ) : (
        <ConsentStep details={details!} onBack={() => setStep(1)} />
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <Dot active n={1} done={step > 1} />
      <div className="h-px w-16 bg-border" />
      <Dot active={step === 2} n={2} />
    </div>
  );
}

function Dot({ n, active, done }: { n: number; active?: boolean; done?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
        active || done
          ? "bg-brand-blue text-brand-blue-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      {n}
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-foreground">
        {label}
      </label>
      <div
        className={cn(
          "relative flex items-center rounded-full border border-input bg-card transition-colors focus-within:border-brand-blue",
        )}
      >
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

function DetailsStep({
  onContinue,
  initial,
}: {
  onContinue: (d: Details) => void;
  initial: Details | null;
}) {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [confirmPassword, setConfirmPassword] = useState(initial?.confirmPassword ?? "");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = detailsSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.message === "passwords-mismatch") {
        toast.error(t("common.passwordsMismatch"));
      } else {
        toast.error(issue?.message ?? "Invalid input");
      }
      return;
    }
    onContinue(parsed.data);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 w-full max-w-md rounded-2xl bg-card p-7 shadow-[var(--shadow-card)]"
    >
      <h2 className="text-center text-2xl font-bold text-foreground">{t("signup.step1")}</h2>

      <div className="mt-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field id="firstName" label={t("signup.firstName")}>
            <input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t("signup.firstName")}
              className="w-full bg-transparent px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </Field>
          <Field id="lastName" label={t("signup.lastName")}>
            <input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t("signup.lastName")}
              className="w-full bg-transparent px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </Field>
        </div>

        <Field id="email" label={t("login.email")} icon={<Mail className="h-5 w-5" />}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent pl-11 pr-3 py-3 text-foreground outline-none"
          />
        </Field>

        <Field id="password" label={t("login.password")} icon={<Lock className="h-5 w-5" />}>
          <input
            id="password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("signup.passwordHint")}
            className="w-full bg-transparent pl-11 pr-11 py-3 text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle password visibility"
          >
            {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </Field>

        <Field
          id="confirmPassword"
          label={t("signup.confirmPassword")}
          icon={<Lock className="h-5 w-5" />}
        >
          <input
            id="confirmPassword"
            type={showPw2 ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("signup.confirmPassword")}
            className="w-full bg-transparent pl-11 pr-11 py-3 text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={() => setShowPw2((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle password visibility"
          >
            {showPw2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </Field>
      </div>

      <button
        type="submit"
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-navy px-4 py-3.5 text-base font-semibold text-brand-navy-foreground shadow-sm transition-opacity hover:opacity-95"
      >
        {t("signup.continue")} <ArrowRight className="h-5 w-5" />
      </button>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t("signup.have")}{" "}
        <Link to="/login" className="font-semibold text-brand-blue hover:underline">
          {t("signup.signIn")}
        </Link>
      </p>
    </form>
  );
}

function ConsentStep({ details, onBack }: { details: Details; onBack: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tos, setTos] = useState(false);
  const [health, setHealth] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = tos && health && !submitting;

  const onCreate = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const redirectUrl = `${window.location.origin}/verified`;
    const { error } = await supabase.auth.signUp({
      email: details.email,
      password: details.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: details.firstName,
          last_name: details.lastName,
          consent_tos_at: new Date().toISOString(),
          consent_health_at: new Date().toISOString(),
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Check your email to confirm.");
    navigate({ to: "/login" });
  };

  return (
    <div className="mt-6 w-full max-w-md space-y-4">
      <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
          <Shield className="h-5 w-5 text-brand-navy" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{t("consent.title")}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("consent.subtitle")}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-blue/25 bg-brand-blue/10 p-4">
        <p className="text-sm leading-relaxed text-foreground">
          <span className="font-semibold text-brand-navy">GDPR — Health data (Article 9)</span>
          <br />
          {t("consent.info")}
        </p>
      </div>

      <ConsentCard
        checked={tos}
        onChange={setTos}
        title={t("consent.tosTitle")}
        required
      >
        {t("consent.tosBody1")}
        <a
          href="/legal"
          className="font-medium text-brand-blue underline underline-offset-2"
        >
          {t("consent.tosLink")}
        </a>
        {t("consent.tosBody2")}
      </ConsentCard>

      <ConsentCard
        checked={health}
        onChange={setHealth}
        title={t("consent.healthTitle")}
        required
      >
        <p className="leading-relaxed">{t("consent.healthIntro")}</p>
        <p className="mt-3 leading-relaxed">{t("consent.healthUnderstand")}</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 leading-relaxed">
          <li>{t("consent.health1")}</li>
          <li>{t("consent.health2")}</li>
          <li>{t("consent.health3")}</li>
          <li>{t("consent.health4")}</li>
          <li>{t("consent.health5")}</li>
        </ul>
      </ConsentCard>

      <button
        type="button"
        onClick={onCreate}
        disabled={!canSubmit}
        className="mt-2 w-full rounded-full bg-brand-navy px-4 py-3.5 text-base font-semibold text-brand-navy-foreground shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t("consent.create")}
      </button>

      <p className="px-2 text-center text-xs leading-relaxed text-muted-foreground">
        {t("consent.footer")}
      </p>

      <button
        type="button"
        onClick={onBack}
        className="mx-auto block text-xs text-muted-foreground underline underline-offset-2"
      >
        ← {t("signup.step1")}
      </button>
    </div>
  );
}

function ConsentCard({
  checked,
  onChange,
  title,
  required,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-2xl border bg-card p-4 transition-colors",
        checked ? "border-brand-blue" : "border-border",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded-md border-input accent-brand-blue"
      />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {required && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {t("consent.required")}
            </span>
          )}
        </div>
        <div className="mt-2 text-sm text-foreground/85">{children}</div>
      </div>
    </label>
  );
}
