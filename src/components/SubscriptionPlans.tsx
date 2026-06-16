"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  ANNUAL_SOLO_PLAN,
  FREE_TIER_GRACE_PRESCRIPTIONS,
  FREE_TIER_PRESCRIPTION_LIMIT,
  formatInr,
  plansForInterval,
  PRD_PRICING_NOTES,
  SOLO_MONTHLY_ANNUAL_TOTAL,
  type BillingInterval,
  type PlanId,
  type SubscriptionPlan,
} from "@/lib/subscription-plans";
import { SUPPORT_EMAIL } from "@/lib/support";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/profile-constants";

interface SubscriptionPlansProps {
  currentTier?: string;
  showBackLink?: boolean;
}

function tierKey(tier: string): SubscriptionTier {
  const key = tier.toLowerCase();
  if (key in SUBSCRIPTION_TIERS) return key as SubscriptionTier;
  return "free";
}

function PlanFeature({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-3 text-sm">
      <span className="text-mute">{label}</span>
      <span className="font-semibold text-ink text-right">{value}</span>
    </li>
  );
}

function PlanCard({
  plan,
  currentTier,
  onSelect,
}: {
  plan: SubscriptionPlan;
  currentTier: string;
  onSelect: (planId: PlanId) => void;
}) {
  const isCurrent = tierKey(currentTier) === plan.id;
  const isFree = plan.id === "free";

  return (
    <article
      className={clsx(
        "relative flex flex-col rounded-xl border p-5 lg:p-6 transition-shadow",
        plan.highlighted
          ? "border-positive/40 bg-green-pale/40 shadow-md ring-1 ring-positive/20"
          : "border-ink/10 bg-canvas shadow-sm",
        isCurrent && "ring-2 ring-positive"
      )}
    >
      {plan.badge && (
        <span
          className={clsx(
            "absolute -top-3 left-5 rounded-pill px-3 py-0.5 text-xs font-bold uppercase tracking-wide",
            plan.highlighted ? "bg-positive text-white" : "bg-ink text-green"
          )}
        >
          {plan.badge}
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-black text-ink">{plan.name}</h3>
        <p className="text-sm text-body mt-1">{plan.description}</p>
      </div>

      <div className="mb-5">
        <p className="text-3xl font-black text-ink tracking-tight">
          {formatInr(plan.priceInr)}
        </p>
        <p className="text-sm text-mute mt-0.5">
          {plan.interval === "annual" ? "per year" : "per month"}
        </p>
        {plan.id === "annual_solo" && (
          <p className="text-xs text-positive-deep font-semibold mt-2">
            vs {formatInr(SOLO_MONTHLY_ANNUAL_TOTAL)} yearly on monthly Solo
          </p>
        )}
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        <PlanFeature label="Doctors" value={plan.doctors} />
        <PlanFeature label="Prescriptions" value={plan.prescriptions} />
        <PlanFeature label="Migration" value={plan.migration} />
      </ul>

      {isCurrent ? (
        <span
          className="inline-flex items-center justify-center rounded-pill px-4 py-2.5 text-sm font-semibold bg-ink/5 text-body"
        >
          Current plan
        </span>
      ) : isFree ? (
        <span
          className="inline-flex items-center justify-center rounded-pill px-4 py-2.5 text-sm font-semibold bg-canvas-soft text-mute"
        >
          Default tier
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onSelect(plan.id)}
          className={clsx(
            "w-full rounded-pill px-4 py-2.5 text-sm font-semibold transition-colors",
            plan.highlighted
              ? "bg-green text-ink hover:bg-green-hover"
              : "bg-ink text-green hover:bg-ink/90"
          )}
        >
          {plan.interval === "annual" ? "Choose Annual Solo" : `Upgrade to ${plan.name}`}
        </button>
      )}
    </article>
  );
}

function ComparisonTable({ interval }: { interval: BillingInterval }) {
  const plans =
    interval === "annual"
      ? [...plansForInterval("monthly").filter((p) => p.id !== "free"), ANNUAL_SOLO_PLAN]
      : plansForInterval("monthly");

  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-canvas shadow-sm">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-ink/10 bg-canvas-soft/50">
            <th className="text-left font-bold text-ink px-4 py-3">Plan</th>
            <th className="text-left font-bold text-ink px-4 py-3">Price</th>
            <th className="text-left font-bold text-ink px-4 py-3">Doctors</th>
            <th className="text-left font-bold text-ink px-4 py-3">Prescriptions</th>
            <th className="text-left font-bold text-ink px-4 py-3">Migration</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} className="border-b border-ink/5 last:border-0">
              <td className="px-4 py-3 font-semibold text-ink">{plan.name}</td>
              <td className="px-4 py-3 text-body">
                {formatInr(plan.priceInr)}
                {plan.interval === "annual" ? " / year" : " / month"}
              </td>
              <td className="px-4 py-3 text-body">{plan.doctors}</td>
              <td className="px-4 py-3 text-body">{plan.prescriptions}</td>
              <td className="px-4 py-3 text-body">{plan.migration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SubscriptionPlans({ currentTier = "free", showBackLink = true }: SubscriptionPlansProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  const visiblePlans = plansForInterval(interval);
  const tier = tierKey(currentTier);
  const tierMeta = SUBSCRIPTION_TIERS[tier];

  const handleSelect = (planId: PlanId) => {
    setSelectedPlan(planId);
  };

  return (
    <div className="space-y-8">
      {showBackLink && (
        <Link
          href="/settings/profile"
          className="inline-flex text-sm font-semibold text-positive hover:text-positive-deep transition-colors"
        >
          ← Back to profile
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-mute mb-2">Your current plan</p>
          <span
            className={clsx(
              "inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              tierMeta.className
            )}
          >
            {tierMeta.label}
          </span>
        </div>

        <div className="flex rounded-pill border border-ink/15 p-1 bg-canvas-soft self-start">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={clsx(
              "rounded-pill px-4 py-2 text-sm font-semibold transition-colors",
              interval === "monthly"
                ? "bg-ink text-green"
                : "text-body hover:text-ink"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("annual")}
            className={clsx(
              "rounded-pill px-4 py-2 text-sm font-semibold transition-colors",
              interval === "annual"
                ? "bg-ink text-green"
                : "text-body hover:text-ink"
            )}
          >
            Annual
          </button>
        </div>
      </div>

      {interval === "annual" && (
        <p className="text-sm text-body bg-green-pale/60 border border-green-pale rounded-xl px-4 py-3">
          Annual billing is available for the Solo plan. Clinic and OPD tiers are billed monthly.
          {formatInr(ANNUAL_SOLO_PLAN.priceInr)} per year saves 20% vs monthly Solo (
          {formatInr(SOLO_MONTHLY_ANNUAL_TOTAL)}).
        </p>
      )}

      <div
        className={clsx(
          "grid gap-4 lg:gap-5",
          interval === "monthly"
            ? "md:grid-cols-2 xl:grid-cols-4"
            : "md:grid-cols-1 max-w-md"
        )}
      >
        {visiblePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentTier={currentTier}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {selectedPlan && (
        <div className="rounded-xl border border-positive/30 bg-green-pale/50 px-5 py-4 space-y-2">
          <p className="font-bold text-ink">Billing coming soon</p>
          <p className="text-sm text-body">
            Online checkout for{" "}
            <span className="font-semibold text-ink">
              {visiblePlans.find((p) => p.id === selectedPlan)?.name ?? selectedPlan}
            </span>{" "}
            is not live yet. Contact support to upgrade and we will provision your account manually.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("SvaraRx plan upgrade")}`}
            className="inline-flex text-sm font-semibold text-positive hover:text-positive-deep"
          >
            Email support →
          </a>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink">Compare plans</h2>
        <ComparisonTable interval={interval} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink">Good to know</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {PRD_PRICING_NOTES.map((note) => (
            <div
              key={note.title}
              className="rounded-xl border border-ink/10 bg-canvas p-4 shadow-sm space-y-1"
            >
              <h3 className="text-sm font-bold text-ink">{note.title}</h3>
              <p className="text-sm text-body">{note.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-ink text-green px-5 py-4 space-y-1">
        <h2 className="text-sm font-bold uppercase tracking-wide text-green/70">Free tier</h2>
        <p className="text-sm text-green/90">
          {FREE_TIER_PRESCRIPTION_LIMIT} prescriptions per month, plus a{" "}
          {FREE_TIER_GRACE_PRESCRIPTIONS}-prescription grace period before hard cutoff — so you
          are never blocked mid-OPD when you hit the limit.
        </p>
      </section>
    </div>
  );
}
