export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "svararax.help@gmail.com";

export const SUPPORT_PHONE =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+91 6305036991";

export const SUPPORT_PHONE_TEL =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE_TEL ?? "+916305036991";

export const SUPPORT_WHATSAPP =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "916305036991";

export const SUPPORT_HOURS = "Mon–Sat, 9 AM – 7 PM IST";

export interface WhatsNewItem {
  date: string;
  title: string;
  description: string;
}

export const WHATS_NEW: WhatsNewItem[] = [
  {
    date: "Jun 2026",
    title: "Patient filters & search",
    description:
      "Filter patients by sex, age, last visit, allergies, and sort large lists with pagination.",
  },
  {
    date: "Jun 2026",
    title: "Draft prescriptions",
    description:
      "Resume draft Rx from the dashboard or patient visit history — pick up right where you left off.",
  },
  {
    date: "Jun 2026",
    title: "Refer & earn",
    description:
      "Invite fellow doctors and earn ₹500 when they subscribe to Solo.",
  },
  {
    date: "Jun 2026",
    title: "Step-wise prescribe flow",
    description:
      "Patient → complaint → dictate → review. Add more medicines on review without re-dictating.",
  },
  {
    date: "Jun 2026",
    title: "Telugu PDF rendering",
    description:
      "Prescription PDFs now render Telugu advice and instructions correctly.",
  },
  {
    date: "May 2026",
    title: "Voice prescribing",
    description:
      "Dictate in Telugu, Hindi, or English — AI structures medications, dose, and frequency.",
  },
];

export function supportMailto(subject: string, body: string): string {
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);
  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
}

export function supportWhatsAppLink(message: string): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
