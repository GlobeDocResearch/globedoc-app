import { useState } from "react";
import { X, Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Role = "patient" | "pro";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  role: Role;
};

const Q1_LABELS = ["Very poor", "Poor", "Neutral", "Good", "Excellent"];
const Q2_LABELS = ["Not at all", "Unlikely", "Neutral", "Somewhat", "Absolutely"];
const Q3_LABELS = ["Very unlikely", "Unlikely", "Maybe", "Likely", "Very likely"];
const Q4_LABELS = ["Definitely not", "Probably not", "Maybe", "Probably", "Definitely yes"];
const Q5_OPTIONS = ["€0 — Free only", "€5/year", "€10/year", "€20/year", "€35/year", "€50+/year"];

export function BetaSurveyCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-2xl bg-white p-5 text-left shadow-sm transition hover:bg-gray-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
        <MessageSquare className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#0D1B2A]">GlobeDoc Beta Survey</p>
        <p className="text-xs text-gray-500">Share your feedback — takes 1 minute.</p>
      </div>
      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2563EB]">
        Beta
      </span>
    </button>
  );
}

export function BetaSurvey({ open, onClose, userId, role }: Props) {
  const [step, setStep] = useState(1);
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [q3, setQ3] = useState<number | null>(null);
  const [q4, setQ4] = useState<number | null>(null);
  const [q5, setQ5] = useState<string[]>([]);
  const [q6, setQ6] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const reset = () => {
    setStep(1); setQ1(null); setQ2(null); setQ3(null);
    setQ4(null); setQ5([]); setQ6(""); setDone(false);
  };

  const close = () => { reset(); onClose(); };

  const canNext = () => {
    if (step === 1) return q1 !== null;
    if (step === 2) return q2 !== null;
    if (step === 3) return q3 !== null;
    if (step === 4) return q4 !== null;
    if (step === 5) return q5.length > 0;
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("beta_survey_responses").insert({
      user_id: userId,
      role,
      q1_impression: q1,
      q2_real_problem: q2,
      q3_likelihood: q3,
      q4_recommend: q4,
      q5_willingness_to_pay: q5.join(", "),
      q6_open_feedback: q6.trim() || null,
    } as any);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
  };

  const toggleQ5 = (opt: string) => {
    setQ5((arr) => arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8F9FA]">
      <header className="flex items-center justify-between bg-white px-5 py-3 shadow-sm">
        <div>
          <p className="text-sm font-bold text-[#0D1B2A]">GlobeDoc Beta Survey</p>
          {!done && <p className="text-xs text-gray-500">Question {step} of 6</p>}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto w-full max-w-xl">
          {done ? (
            <div className="mt-10 rounded-2xl bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-[#0D1B2A]">Thank you for your feedback!</h2>
              <p className="mt-2 text-sm text-gray-600">
                Your responses will help us improve GlobeDoc.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-6 rounded-full bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-95"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              {step === 1 && (
                <RatingQuestion
                  title="What is your overall impression of the GlobeDoc Beta app?"
                  labels={Q1_LABELS}
                  value={q1}
                  onChange={setQ1}
                  stars
                />
              )}
              {step === 2 && (
                <RatingQuestion
                  title="Does GlobeDoc solve a real and important problem for you?"
                  labels={Q2_LABELS}
                  value={q2}
                  onChange={setQ2}
                />
              )}
              {step === 3 && (
                <RatingQuestion
                  title="How likely are you to use GlobeDoc regularly once it launches?"
                  labels={Q3_LABELS}
                  value={q3}
                  onChange={setQ3}
                />
              )}
              {step === 4 && (
                <RatingQuestion
                  title="Would you recommend GlobeDoc to a colleague or friend?"
                  labels={Q4_LABELS}
                  value={q4}
                  onChange={setQ4}
                />
              )}
              {step === 5 && (
                <div>
                  <h2 className="text-lg font-bold text-[#0D1B2A]">
                    How much would you be willing to pay for GlobeDoc per year?
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">Select all that apply.</p>
                  <div className="mt-4 space-y-2">
                    {Q5_OPTIONS.map((opt) => {
                      const checked = q5.includes(opt);
                      return (
                        <label
                          key={opt}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                            checked ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleQ5(opt)}
                            className="h-4 w-4 accent-[#2563EB]"
                          />
                          <span className="font-medium text-[#0D1B2A]">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {step === 6 && (
                <div>
                  <h2 className="text-lg font-bold text-[#0D1B2A]">
                    Any bugs, errors, missing features, or suggestions?
                  </h2>
                  <textarea
                    value={q6}
                    onChange={(e) => setQ6(e.target.value)}
                    rows={8}
                    maxLength={2000}
                    placeholder="Tell us what's on your mind…"
                    className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">{q6.length}/2000</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {!done && (
        <footer className="border-t border-gray-100 bg-white px-5 py-4">
          <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-[#0D1B2A] hover:bg-gray-50 disabled:opacity-40"
            >
              Back
            </button>
            {step < 6 ? (
              <button
                type="button"
                disabled={!canNext()}
                onClick={() => setStep((s) => s + 1)}
                className="rounded-full bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="rounded-full bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

function RatingQuestion({
  title, labels, value, onChange, stars,
}: {
  title: string;
  labels: string[];
  value: number | null;
  onChange: (v: number) => void;
  stars?: boolean;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-[#0D1B2A]">{title}</h2>
      <div className="mt-6 flex items-center justify-between gap-2">
        {labels.map((_, i) => {
          const n = i + 1;
          const active = value !== null && n <= value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${n} of 5`}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                stars
                  ? active ? "text-yellow-400" : "text-gray-300"
                  : active ? "bg-[#2563EB] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {stars ? <Star className="h-7 w-7" fill={active ? "currentColor" : "none"} /> : <span className="text-sm font-bold">{n}</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2 text-center text-[10px] font-medium text-gray-500">
        {labels.map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}
