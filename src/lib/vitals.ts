import type { VitalFlag, VitalReading } from "@/lib/api";

const FLAG_LABELS: Record<VitalFlag["flag"], string> = {
  high_bp: "High blood pressure",
  low_bp: "Low blood pressure",
  high_sugar: "High fasting blood sugar",
  low_spo2: "Low SpO₂",
};

export function vitalFlagLabel(flag: VitalFlag["flag"]): string {
  return FLAG_LABELS[flag];
}

export function formatVitalsSummary(vitals: VitalReading | null): string | null {
  if (!vitals) return null;

  const parts: string[] = [];
  if (vitals.bp_systolic != null || vitals.bp_diastolic != null) {
    const sys = vitals.bp_systolic ?? "—";
    const dia = vitals.bp_diastolic ?? "—";
    parts.push(`BP ${sys}/${dia}`);
  }
  if (vitals.weight_kg != null) {
    parts.push(`${vitals.weight_kg}kg`);
  }
  if (vitals.blood_sugar_mg_dl != null) {
    const type =
      vitals.blood_sugar_type === "pp"
        ? "PP"
        : vitals.blood_sugar_type
        ? vitals.blood_sugar_type.charAt(0).toUpperCase() + vitals.blood_sugar_type.slice(1)
        : "";
    parts.push(
      `${vitals.blood_sugar_mg_dl}mg/dL${type ? ` (${type})` : ""}`
    );
  }
  if (vitals.spo2_percent != null) {
    parts.push(`SpO₂ ${vitals.spo2_percent}%`);
  }
  if (vitals.temperature_f != null) {
    parts.push(`${vitals.temperature_f}°F`);
  }
  if (vitals.pulse_bpm != null) {
    parts.push(`${vitals.pulse_bpm}bpm`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function hasVitalFlags(vitals: VitalReading | null): boolean {
  return (vitals?.flags?.length ?? 0) > 0;
}
