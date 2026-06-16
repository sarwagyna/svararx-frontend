export type BillingInterval = "monthly" | "annual";

export type PlanId = "free" | "solo" | "clinic" | "opd" | "annual_solo";

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  priceInr: number;
  interval: BillingInterval;
  doctors: string;
  prescriptions: string;
  migration: string;
  description: string;
  highlighted?: boolean;
  badge?: string;
}

export const MONTHLY_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    priceInr: 0,
    interval: "monthly",
    doctors: "1",
    prescriptions: "20 / month",
    migration: "Not included",
    description: "Try voice prescribing with a tight monthly cap — enough for 1–2 OPD days.",
  },
  {
    id: "solo",
    name: "Solo",
    priceInr: 2499,
    interval: "monthly",
    doctors: "1",
    prescriptions: "Unlimited",
    migration: "Up to 200 patients free",
    description: "Full prescribing for a single doctor in solo practice.",
    highlighted: true,
    badge: "Most popular",
  },
  {
    id: "clinic",
    name: "Clinic",
    priceInr: 5999,
    interval: "monthly",
    doctors: "Up to 5",
    prescriptions: "Unlimited",
    migration: "Up to 200 patients free",
    description: "Small clinic teams with multiple doctors.",
  },
  {
    id: "opd",
    name: "OPD",
    priceInr: 11999,
    interval: "monthly",
    doctors: "Unlimited",
    prescriptions: "Unlimited",
    migration: "Up to 200 patients free",
    description: "High-volume OPDs and hospital outpatient departments at scale.",
  },
];

export const ANNUAL_SOLO_PLAN: SubscriptionPlan = {
  id: "annual_solo",
  name: "Annual Solo",
  priceInr: 23990,
  interval: "annual",
  doctors: "1",
  prescriptions: "Unlimited",
  migration: "Up to 200 patients free",
  description: "Solo plan billed yearly — save 20% vs paying monthly.",
  highlighted: true,
  badge: "Save 20%",
};

export const ALL_PLANS: SubscriptionPlan[] = [...MONTHLY_PLANS, ANNUAL_SOLO_PLAN];

export function getPlanForTier(tier: string): SubscriptionPlan {
  const id = tier.toLowerCase();
  return ALL_PLANS.find((p) => p.id === id) ?? MONTHLY_PLANS[0];
}

/** Monthly Solo × 12 for annual discount comparison (PRD). */
export const SOLO_MONTHLY_ANNUAL_TOTAL = 2499 * 12;

export const FREE_TIER_PRESCRIPTION_LIMIT = 20;
export const FREE_TIER_GRACE_PRESCRIPTIONS = 10;

export const PRD_PRICING_NOTES = [
  {
    title: "Annual Solo discount",
    body: "Annual Solo is a 20% discount on monthly Solo — ₹2,499 × 12 = ₹29,988 vs ₹23,990 per year.",
  },
  {
    title: "Free tier limits",
    body: "20 prescriptions per month is roughly 1–2 days of use for a 30-patient/day doctor. There is also a 10-prescription grace period before hard cutoff so you are never blocked mid-OPD.",
  },
  {
    title: "Powered by SvaraRx AI",
    body: "Every tier prints “Powered by SvaraRx AI” on the prescription slip — patients carry it out of the clinic, which is the distribution play.",
  },
];

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function plansForInterval(interval: BillingInterval): SubscriptionPlan[] {
  if (interval === "annual") {
    return [ANNUAL_SOLO_PLAN];
  }
  return MONTHLY_PLANS;
}