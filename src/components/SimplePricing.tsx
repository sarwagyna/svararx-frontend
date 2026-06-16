"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  ANNUAL_SOLO_PLAN,
  formatInr,
  MONTHLY_PLANS,
  SOLO_MONTHLY_ANNUAL_TOTAL,
} from "@/lib/subscription-plans";
import { SOLO_PLAN_FEATURES } from "@/lib/svararx-features";

type BillingInterval = "monthly" | "yearly";

function FeatureIcon({ id }: { id: string }) {
  const className = "w-5 h-5 text-positive";
  switch (id) {
    case "unlimited-rx":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
          <path strokeLinecap="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
          <path strokeLinecap="round" d="M8 12h8" />
          <path strokeLinecap="round" d="M12 8v8" />
        </svg>
      );
    case "voice-rx":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
          <path strokeLinecap="round" d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
          <path strokeLinecap="round" d="M19 11v1a7 7 0 01-14 0v-1M12 18v3" />
        </svg>
      );
    case "pdf-letterhead":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "multilingual":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
          <path strokeLinecap="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
          <path strokeLinecap="round" d="M9 12h6" />
        </svg>
      );
    case "safety":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
          <path strokeLinecap="round" d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

interface SimplePricingProps {
  onUpgrade?: () => void;
  showAllPlansLink?: boolean;
}

export function SimplePricing({ onUpgrade, showAllPlansLink = true }: SimplePricingProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const solo = MONTHLY_PLANS.find((p) => p.id === "solo")!;

  const pricing = useMemo(() => {
    if (interval === "yearly") {
      const perMonth = Math.round(ANNUAL_SOLO_PLAN.priceInr / 12);
      const savePct = Math.round(
        (1 - ANNUAL_SOLO_PLAN.priceInr / SOLO_MONTHLY_ANNUAL_TOTAL) * 100
      );
      return {
        amount: ANNUAL_SOLO_PLAN.priceInr,
        suffix: "/yr",
        perDay: Math.round(ANNUAL_SOLO_PLAN.priceInr / 365),
        billingNote: `Billed annually · ${formatInr(perMonth)}/mo effective`,
        savePct,
      };
    }
    return {
      amount: solo.priceInr,
      suffix: "/mo",
      perDay: Math.round(solo.priceInr / 30),
      billingNote: "Billed monthly · Solo plan for one doctor",
      savePct: 20,
    };
  }, [interval, solo.priceInr]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl lg:text-4xl font-black text-ink tracking-tight">
          Simple pricing
        </h2>
        <p className="text-base text-body">
          Choose the plan that fits your practice
        </p>
      </div>

      <article className="bg-canvas rounded-2xl shadow-md border border-ink/5 overflow-hidden">
        <div className="px-6 pt-6 pb-2 flex items-center justify-center gap-3">
          <div className="inline-flex rounded-pill border border-ink/15 p-1 bg-canvas-soft">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={clsx(
                "rounded-pill px-5 py-2 text-sm font-semibold transition-colors",
                interval === "monthly" ? "bg-ink text-green" : "text-body hover:text-ink"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className={clsx(
                "rounded-pill px-5 py-2 text-sm font-semibold transition-colors flex items-center gap-2",
                interval === "yearly" ? "bg-ink text-green" : "text-body hover:text-ink"
              )}
            >
              Yearly
              <span className="text-[10px] font-bold uppercase tracking-wide bg-warning text-warning-content rounded-pill px-2 py-0.5">
                Save {pricing.savePct}%
              </span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 text-center border-b border-canvas-soft">
          <p className="text-4xl lg:text-5xl font-black text-ink tracking-tight">
            {formatInr(pricing.amount)}
            <span className="text-xl font-semibold text-mute">{pricing.suffix}</span>
          </p>
          <span className="inline-block mt-3 text-xs font-semibold text-warning-content bg-warning/30 rounded-pill px-3 py-1">
            Just {formatInr(pricing.perDay)}/day per doctor · {pricing.billingNote}
          </span>
        </div>

        <ul className="divide-y divide-canvas-soft">
          {SOLO_PLAN_FEATURES.map((feature) => (
            <li key={feature.id} className="flex gap-4 px-6 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-pale">
                <FeatureIcon id={feature.id} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-ink">{feature.title}</p>
                <p className="text-sm text-body mt-1 leading-relaxed">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="px-6 py-6 bg-canvas-soft/40 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/prescribe"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-green text-ink font-semibold px-8 py-3.5 text-sm hover:bg-green-hover transition-colors shadow-sm"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Try for free
          </Link>
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex items-center justify-center w-full sm:w-auto rounded-xl border border-ink/20 bg-canvas text-ink font-semibold px-8 py-3.5 text-sm hover:bg-canvas-soft transition-colors"
          >
            Upgrade to Solo
          </button>
        </div>
      </article>

      {showAllPlansLink && (
        <p className="text-center text-sm text-body">
          Need a multi-doctor clinic or OPD?{" "}
          <a
            href="#all-plans"
            className="font-semibold text-positive hover:text-positive-deep underline underline-offset-2"
          >
            See all plans below
          </a>
        </p>
      )}

      <div className="rounded-xl border border-ink/10 bg-canvas px-5 py-4 text-center text-sm text-body">
        <span className="font-semibold text-ink">Free tier:</span> 20 prescriptions/month to
        try voice prescribing — enough for 1–2 OPD days before you upgrade.
      </div>
    </div>
  );
}
