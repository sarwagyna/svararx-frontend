export const REFERRAL_STORAGE_KEY = "svararx_referral";

export function storeReferralCode(code: string): void {
  if (typeof window === "undefined" || !code.trim()) return;
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, code.trim());
  } catch {
    /* ignore */
  }
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function buildReferralLink(doctorId: string): string {
  if (typeof window === "undefined") {
    return `/signup?ref=${doctorId}`;
  }
  const url = new URL("/signup", window.location.origin);
  url.searchParams.set("ref", doctorId);
  return url.toString();
}

export function buildReferralWhatsAppMessage(link: string, doctorName?: string): string {
  const who = doctorName ? `${doctorName} uses` : "I use";
  return encodeURIComponent(
    `${who} SvaraRx to dictate prescriptions and print PDFs in seconds. Try it free: ${link}`
  );
}
