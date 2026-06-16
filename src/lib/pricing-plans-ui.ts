import {
  ANNUAL_SOLO_PLAN,
  MONTHLY_PLANS,
  type PlanId,
} from "@/lib/subscription-plans";

export interface PricingPlanUi {
  id: PlanId;
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  isPopular: boolean;
  annualAvailable: boolean;
}

export function buildSvaraRxPricingPlans(): PricingPlanUi[] {
  const solo = MONTHLY_PLANS.find((p) => p.id === "solo")!;
  const clinic = MONTHLY_PLANS.find((p) => p.id === "clinic")!;
  const opd = MONTHLY_PLANS.find((p) => p.id === "opd")!;
  const soloAnnualPerMonth = String(Math.round(ANNUAL_SOLO_PLAN.priceInr / 12));

  return [
    {
      id: "solo",
      name: solo.name,
      price: String(solo.priceInr),
      yearlyPrice: soloAnnualPerMonth,
      period: "per month",
      features: [
        `${solo.doctors} doctor`,
        `${solo.prescriptions} prescriptions`,
        solo.migration,
        "Voice-to-prescription in seconds",
        "Branded PDF letterhead",
        "Telugu, Hindi & English",
      ],
      description: solo.description,
      buttonText: "Upgrade to Solo",
      isPopular: true,
      annualAvailable: true,
    },
    {
      id: "clinic",
      name: clinic.name,
      price: String(clinic.priceInr),
      yearlyPrice: String(clinic.priceInr),
      period: "per month",
      features: [
        `${clinic.doctors} doctors`,
        `${clinic.prescriptions} prescriptions`,
        clinic.migration,
        "Clinic dashboard & doctor picker",
        "Approval PINs for staff",
      ],
      description: clinic.description,
      buttonText: "Upgrade to Clinic",
      isPopular: false,
      annualAvailable: false,
    },
    {
      id: "opd",
      name: opd.name,
      price: String(opd.priceInr),
      yearlyPrice: String(opd.priceInr),
      period: "per month",
      features: [
        `${opd.doctors} doctors`,
        `${opd.prescriptions} prescriptions`,
        opd.migration,
        "High-volume OPD workflows",
        "Priority onboarding support",
      ],
      description: opd.description,
      buttonText: "Contact for OPD",
      isPopular: false,
      annualAvailable: false,
    },
  ];
}
