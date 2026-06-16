"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { AppShell } from "@/components/AppShell";
import { PageContent, PageHeader } from "@/components/PageContent";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import {
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
  WHATS_NEW,
  supportMailto,
  supportWhatsAppLink,
} from "@/lib/support";

const inputClass =
  "w-full bg-canvas border border-ink/15 rounded-md px-4 py-3 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition";

function ContactCard({
  title,
  description,
  actionLabel,
  href,
  external,
  icon,
  accent,
}: {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  external?: boolean;
  icon: ReactNode;
  accent: "green" | "positive" | "ink";
}) {
  const accentClass =
    accent === "green"
      ? "bg-green-pale text-positive-deep"
      : accent === "positive"
        ? "bg-positive/10 text-positive-deep"
        : "bg-canvas-soft text-ink";

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex flex-col rounded-xl border border-ink/10 bg-canvas p-5 shadow-sm hover:shadow-md hover:border-ink/20 transition-all"
    >
      <div
        className={clsx(
          "flex h-11 w-11 items-center justify-center rounded-xl mb-4",
          accentClass
        )}
      >
        {icon}
      </div>
      <h3 className="font-bold text-ink group-hover:text-positive transition-colors">
        {title}
      </h3>
      <p className="text-sm text-body mt-1 flex-1">{description}</p>
      <p className="text-sm font-semibold text-positive mt-4">{actionLabel} →</p>
    </a>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function SupportPage() {
  return (
    <OnboardingGuard>
      <SupportContent />
    </OnboardingGuard>
  );
}

function SupportContent() {
  const [issueType, setIssueType] = useState("bug");
  const [issueDetails, setIssueDetails] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState("");

  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `SvaraRx issue: ${issueType}`;
    const body = [
      `Issue type: ${issueType}`,
      "",
      issueDetails.trim(),
      "",
      "---",
      `Sent from SvaraRx Support page`,
    ].join("\n");
    window.location.href = supportMailto(subject, body);
  };

  const handleShareFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = "SvaraRx product feedback";
    const body = [
      feedbackRating ? `Rating: ${feedbackRating}/5` : "",
      "",
      feedbackMessage.trim(),
      "",
      "---",
      `Sent from SvaraRx Support page`,
    ]
      .filter(Boolean)
      .join("\n");
    window.location.href = supportMailto(subject, body);
  };

  const waDefault = supportWhatsAppLink(
    "Hi SvaraRx support, I need help with my account."
  );

  return (
    <AppShell>
      <PageContent className="space-y-8 pb-16">
        <PageHeader
          title="Support"
          subtitle={`We're here to help. ${SUPPORT_HOURS}.`}
        />

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ContactCard
            title="Email support"
            description={`Write to us at ${SUPPORT_EMAIL}. We usually reply within one business day.`}
            actionLabel={SUPPORT_EMAIL}
            href={supportMailto("SvaraRx support request", "Hi SvaraRx team,\n\n")}
            icon={<EmailIcon />}
            accent="green"
          />
          <ContactCard
            title="Phone support"
            description={`Call ${SUPPORT_PHONE} for urgent prescribing or account issues during clinic hours.`}
            actionLabel={SUPPORT_PHONE}
            href={`tel:${SUPPORT_PHONE_TEL}`}
            icon={<PhoneIcon />}
            accent="ink"
          />
          <ContactCard
            title="WhatsApp support"
            description="Chat with our team on WhatsApp for quick questions between OPD sessions."
            actionLabel="Open WhatsApp"
            href={waDefault}
            external
            icon={<WhatsAppIcon />}
            accent="positive"
          />
        </section>

        <section className="bg-canvas rounded-xl border border-ink/10 p-5 lg:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink mb-1">What&apos;s new</h2>
          <p className="text-sm text-mute mb-5">Recent updates to SvaraRx</p>
          <ul className="space-y-4">
            {WHATS_NEW.map((item) => (
              <li
                key={item.title}
                className="flex gap-4 pb-4 border-b border-canvas-soft last:border-0 last:pb-0"
              >
                <span className="text-xs font-semibold text-mute shrink-0 w-16 pt-0.5">
                  {item.date}
                </span>
                <div>
                  <p className="font-bold text-sm text-ink">{item.title}</p>
                  <p className="text-sm text-body mt-0.5">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-canvas rounded-xl border border-ink/10 p-5 lg:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink mb-1">Report an issue</h2>
            <p className="text-sm text-mute mb-5">
              Something broken? Tell us what happened and we&apos;ll investigate.
            </p>
            <form onSubmit={handleReportIssue} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-body">Issue type</span>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className={inputClass}
                >
                  <option value="bug">Bug / something not working</option>
                  <option value="voice">Voice / transcription problem</option>
                  <option value="pdf">PDF / letterhead issue</option>
                  <option value="account">Account or billing</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-body">Details</span>
                <textarea
                  value={issueDetails}
                  onChange={(e) => setIssueDetails(e.target.value)}
                  required
                  rows={5}
                  placeholder="What were you doing? What did you expect? What happened instead?"
                  className={inputClass}
                />
              </label>
              <button
                type="submit"
                className="w-full bg-ink text-green font-semibold rounded-xl px-6 py-3 text-sm hover:bg-ink/90 transition-colors"
              >
                Send report via email
              </button>
            </form>
          </section>

          <section className="bg-canvas rounded-xl border border-ink/10 p-5 lg:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink mb-1">Share your feedback</h2>
            <p className="text-sm text-mute mb-5">
              Ideas to make prescribing faster? We read every message.
            </p>
            <form onSubmit={handleShareFeedback} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-body">
                  Overall experience <span className="text-mute font-normal">(optional)</span>
                </span>
                <select
                  value={feedbackRating}
                  onChange={(e) => setFeedbackRating(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select a rating</option>
                  <option value="5">★★★★★ Excellent</option>
                  <option value="4">★★★★☆ Good</option>
                  <option value="3">★★★☆☆ Okay</option>
                  <option value="2">★★☆☆☆ Needs work</option>
                  <option value="1">★☆☆☆☆ Poor</option>
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-body">Your feedback</span>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="What do you love? What should we improve?"
                  className={inputClass}
                />
              </label>
              <button
                type="submit"
                className="w-full bg-green text-ink font-semibold rounded-xl px-6 py-3 text-sm hover:bg-green-hover transition-colors"
              >
                Send feedback via email
              </button>
            </form>
          </section>
        </div>

        <p className="text-center text-sm text-mute">
          Prefer self-serve? Visit{" "}
          <Link href="/settings/profile" className="font-semibold text-positive hover:underline">
            Settings
          </Link>{" "}
          for profile, letterhead, and plans.
        </p>
      </PageContent>
    </AppShell>
  );
}
