/** Common chronic conditions for AP/TG GPs */
export const COMMON_CHRONIC_CONDITIONS = [
  "Type 2 Diabetes",
  "Hypertension",
  "Hypothyroidism",
  "Asthma / COPD",
  "Heart Disease",
  "Kidney Disease (CKD)",
  "Liver Disease",
  "Epilepsy",
  "Arthritis",
  "Anemia",
  "Anxiety / Depression",
  "Obesity",
  "High Cholesterol",
  "Gout",
] as const;

export type ChronicConditionName = (typeof COMMON_CHRONIC_CONDITIONS)[number];

/** Color-coded chip styles per condition category */
export function conditionChipClass(conditionName: string): string {
  const lower = conditionName.toLowerCase();
  if (lower.includes("diabetes")) {
    return "bg-amber-100 text-amber-900 border-amber-300";
  }
  if (lower.includes("hypertension") || lower.includes("blood pressure")) {
    return "bg-red-100 text-red-900 border-red-300";
  }
  if (lower.includes("thyroid")) {
    return "bg-purple-100 text-purple-900 border-purple-300";
  }
  return "bg-gray-100 text-gray-700 border-gray-300";
}

/** Short label for tight chip display */
export function conditionShortLabel(name: string): string {
  if (name === "Type 2 Diabetes") return "Diabetes";
  if (name === "Kidney Disease (CKD)") return "CKD";
  if (name === "Anxiety / Depression") return "Anxiety";
  if (name === "Asthma / COPD") return "Asthma";
  if (name === "High Cholesterol") return "Chol.";
  return name.split(" ")[0];
}
