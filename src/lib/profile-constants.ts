export const SPECIALIZATIONS = [
  "General Physician",
  "Diabetologist",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "ENT",
  "Orthopedic",
  "Gynecologist",
  "Other",
];

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
];

export const LANGUAGE_OPTIONS = [
  "Telugu",
  "English",
  "Hindi",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Urdu",
];

export const SUBSCRIPTION_TIERS = {
  free: { label: "Free", className: "bg-mute/20 text-body" },
  solo: { label: "Solo", className: "bg-teal-100 text-teal-800" },
  annual_solo: { label: "Annual Solo", className: "bg-teal-100 text-teal-800" },
  clinic: { label: "Clinic", className: "bg-purple-100 text-purple-800" },
  opd: { label: "OPD", className: "bg-amber-100 text-amber-900" },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

/** Loose MCI validation — formats vary by state council. */
export function validateMci(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "MCI number is required.";
  if (trimmed.startsWith("PENDING-")) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9/\-.]{3,49}$/.test(trimmed)) {
    return "Use letters, numbers, /, - or . (4–50 characters).";
  }
  return null;
}

export function validatePhone(value: string): string | null {
  if (!value.trim()) return null;
  const digits = value.replace(/\D/g, "").replace(/^91/, "");
  if (!/^\d{10}$/.test(digits)) return "Enter a 10-digit mobile number.";
  return null;
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return digits.slice(2);
  return digits;
}
