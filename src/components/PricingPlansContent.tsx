"use client";

import { useEffect, useState } from "react";
import { Pricing } from "@/components/ui/pricing";
import { getDoctorProfile } from "@/lib/api";
import { buildSvaraRxPricingPlans } from "@/lib/pricing-plans-ui";
import {
  ANNUAL_SOLO_PLAN,
  FREE_TIER_GRACE_PRESCRIPTIONS,
  FREE_TIER_PRESCRIPTION_LIMIT,
  formatInr,
  MONTHLY_PLANS,
  PRD_PRICING_NOTES,
  SOLO_MONTHLY_ANNUAL_TOTAL,
  type PlanId,
} from "@/lib/subscription-plans";
import { SUPPORT_EMAIL } from "@/lib/support";

export function PricingPlansContent() {
  const [currentTier, setCurrentTier] = useState("free");
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const plans = buildSvaraRxPricingPlans();

  useEffect(() => {
    (async () => {
      try {
        const profile = await getDoctorProfile();
        setCurrentTier(profile.subscription_tier || "free");
      } catch {
        setCurrentTier("free");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
      </div>
    );
  }

  const selectedPlanName =
    plans.find((p) => p.id === selectedPlan)?.name ??
    MONTHLY_PLANS.find((p) => p.id === selectedPlan)?.name;

  return (
    <div className="space-y-12">
      <div id="all-plans" className="scroll-mt-6">
        <Pricing
          plans={plans}
          currentPlanId={currentTier === "annual_solo" ? "solo" : currentTier}
          onPlanSelect={setSelectedPlan}
          title="Plans for every practice"
          description={
            "Solo for one doctor, Clinic for small teams, OPD for high-volume departments.\nAnnual billing saves 20% on Solo."
          }
        />

        {selectedPlan && (
          <div className="mt-8 rounded-xl border border-positive/30 bg-green-pale/50 px-5 py-4 space-y-2 max-w-2xl mx-auto">
            <p className="font-bold text-ink">Billing coming soon</p>
            <p className="text-sm text-body">
              Online checkout for{" "}
              <span className="font-semibold text-ink">{selectedPlanName}</span> is not live yet.
              Contact support to upgrade and we will provision your account manually.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("SvaraRx plan upgrade")}`}
              className="inline-flex text-sm font-semibold text-positive hover:text-positive-deep"
            >
              Email support →
            </a>
          </div>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink text-center sm:text-left">Compare all tiers</h2>
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
              {MONTHLY_PLANS.map((plan) => (
                <tr key={plan.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink">{plan.name}</td>
                  <td className="px-4 py-3 text-body">
                    {formatInr(plan.priceInr)} / month
                  </td>
                  <td className="px-4 py-3 text-body">{plan.doctors}</td>
                  <td className="px-4 py-3 text-body">{plan.prescriptions}</td>
                  <td className="px-4 py-3 text-body">{plan.migration}</td>
                </tr>
              ))}
              <tr className="border-b border-ink/5 last:border-0 bg-green-pale/20">
                <td className="px-4 py-3 font-semibold text-ink">{ANNUAL_SOLO_PLAN.name}</td>
                <td className="px-4 py-3 text-body">
                  {formatInr(ANNUAL_SOLO_PLAN.priceInr)} / year
                </td>
                <td className="px-4 py-3 text-body">{ANNUAL_SOLO_PLAN.doctors}</td>
                <td className="px-4 py-3 text-body">{ANNUAL_SOLO_PLAN.prescriptions}</td>
                <td className="px-4 py-3 text-body">{ANNUAL_SOLO_PLAN.migration}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-body">
          Annual Solo: {formatInr(ANNUAL_SOLO_PLAN.priceInr)} per year saves 20% vs monthly (
          {formatInr(SOLO_MONTHLY_ANNUAL_TOTAL)}).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink text-center sm:text-left">Good to know</h2>
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
