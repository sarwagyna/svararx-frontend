export interface FrequencyOption {
  value: string;
  label: string;
}

/** Standard OPD frequency codes — SOS = as needed / when required */
export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: "", label: "—" },
  { value: "OD", label: "OD — once daily" },
  { value: "BD", label: "BD — twice daily" },
  { value: "TDS", label: "TDS — three times daily" },
  { value: "QID", label: "QID — four times daily" },
  { value: "SOS", label: "SOS — when needed" },
];

export function normalizeFrequency(value: string): string {
  const raw = value.trim().toUpperCase();
  if (!raw) return "";
  if (
    raw === "SOS" ||
    raw === "PRN" ||
    raw.includes("SOS") ||
    raw.includes("PRN") ||
    raw.includes("AS NEEDED") ||
    raw.includes("WHEN NEEDED") ||
    raw.includes("AS REQUIRED")
  ) {
    return "SOS";
  }
  for (const { value: code } of FREQUENCY_OPTIONS) {
    if (code && raw.startsWith(code)) return code;
  }
  return raw;
}

export function frequencyLabel(value: string): string {
  const code = normalizeFrequency(value);
  return FREQUENCY_OPTIONS.find((o) => o.value === code)?.label ?? value;
}
