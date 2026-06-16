/** Common chief complaint chips for AP/TG general practitioners. */
export const CHIEF_COMPLAINT_CHIPS = [
  "Fever",
  "Cold / Cough",
  "BP Check",
  "Sugar Check",
  "Body Pain",
  "Stomach Pain",
  "Headache",
  "Skin Issue",
  "Eye Problem",
  "Ear Problem",
  "Throat Pain",
  "Follow-up",
  "Repeat Prescription",
  "Certificate",
  "Injection",
  "Joint Pain",
  "Back Pain",
  "Chest Pain",
  "Breathing Difficulty",
  "Urine Problem",
] as const;

export type ChiefComplaintChip = (typeof CHIEF_COMPLAINT_CHIPS)[number];

export function buildChiefComplaint(
  tags: string[],
  freeText: string
): { chief_complaint: string | null; tags: string[] } {
  const trimmed = freeText.trim();
  const parts = [...tags, ...(trimmed ? [trimmed] : [])];
  return {
    tags,
    chief_complaint: parts.length > 0 ? parts.join(", ") : null,
  };
}
