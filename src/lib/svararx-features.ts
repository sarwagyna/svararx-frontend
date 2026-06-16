export interface SvaraRxFeature {
  id: string;
  title: string;
  description: string;
}

/** Solo plan feature list — aligned with actual SvaraRx product capabilities. */
export const SOLO_PLAN_FEATURES: SvaraRxFeature[] = [
  {
    id: "unlimited-rx",
    title: "Unlimited prescriptions",
    description:
      "Dictate, review, and print as many prescriptions as your OPD needs — no per-Rx caps on Solo.",
  },
  {
    id: "voice-rx",
    title: "Voice-to-prescription in seconds",
    description:
      "Speak naturally in Telugu, Hindi, or English. SvaraRx structures drugs, dose, and frequency automatically.",
  },
  {
    id: "pdf-letterhead",
    title: "Branded PDF letterhead",
    description:
      "One-tap approve generates a print-ready prescription with your clinic logo, signature, and details.",
  },
  {
    id: "multilingual",
    title: "Multilingual clinical understanding",
    description:
      "Built for Indian OPDs — Telugu–English code-mix, regional frequency terms (OD, BD, TDS), and drug name correction.",
  },
  {
    id: "safety",
    title: "Allergy & safety checks",
    description:
      "Flags drug–allergy conflicts before you approve, with acknowledgment built into the prescribe flow.",
  },
  {
    id: "history",
    title: "Patient history & visit timeline",
    description:
      "Search patients at scale, compare visits, resume drafts, and add more medicines without re-dictating.",
  },
];

export const REFERRAL_REWARD_INR = 500;
export const REFERRAL_MIN_PLAN = "Solo";
