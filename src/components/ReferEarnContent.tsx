"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import { getDoctorProfile, getReferralStats, type ReferralStats } from "@/lib/api";
import {
  buildReferralLink,
  buildReferralWhatsAppMessage,
} from "@/lib/referral";
import { REFERRAL_MIN_PLAN, REFERRAL_REWARD_INR } from "@/lib/svararx-features";
import { formatInr } from "@/lib/subscription-plans";
import { SUPPORT_EMAIL } from "@/lib/support";

const STEPS = [
  {
    title: "Share your link",
    body: "Send your personal referral link to doctor friends or clinic groups.",
  },
  {
    title: "They sign up & subscribe",
    body: `When they join SvaraRx and upgrade to ${REFERRAL_MIN_PLAN} or above, we track the referral.`,
  },
  {
    title: "You earn",
    body: `Receive ${formatInr(REFERRAL_REWARD_INR)} credit per successful referral — applied to your next bill.`,
  },
];

function ReferralStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-canvas rounded-xl border border-ink/10 p-5 shadow-sm">
      <p className="text-[10px] font-semibold text-mute uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black text-ink mt-1">{value}</p>
      {hint && <p className="text-xs text-body mt-1">{hint}</p>}
    </div>
  );
}

export function ReferEarnContent() {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([getDoctorProfile(), getReferralStats()])
      .then(([profile, referralStats]) => {
        setDoctorId(profile.id);
        setDoctorName(profile.full_name);
        setStats(referralStats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const referralLink = doctorId ? buildReferralLink(doctorId) : "";

  const copyLink = useCallback(async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  }, [referralLink]);

  const whatsappHref = referralLink
    ? `https://wa.me/?text=${buildReferralWhatsAppMessage(referralLink, doctorName)}`
    : "#";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-warning/30 bg-warning/10 p-6 lg:p-8 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/30 text-warning-content font-black text-lg">
            ₹
          </div>
          <div>
            <h2 className="text-xl font-black text-ink">
              Earn {formatInr(REFERRAL_REWARD_INR)} per doctor
            </h2>
            <p className="text-sm text-body mt-1 max-w-xl">
              Help another doctor ditch handwriting and print AI-structured prescriptions in
              under a minute. When they subscribe to {REFERRAL_MIN_PLAN}, you both win.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            <div className="h-24 bg-canvas-soft rounded-xl animate-pulse" />
            <div className="h-24 bg-canvas-soft rounded-xl animate-pulse" />
            <div className="h-24 bg-canvas-soft rounded-xl animate-pulse sm:col-span-2 lg:col-span-1" />
          </>
        ) : (
          <>
            <ReferralStatCard
              label="Total referrals"
              value={stats?.total_referrals ?? 0}
              hint="Doctors who signed up with your link"
            />
            <ReferralStatCard
              label="Paid referrals"
              value={stats?.paid_referrals ?? 0}
              hint={
                (stats?.pending_referrals ?? 0) > 0
                  ? `${stats?.pending_referrals} still on free tier`
                  : `Subscribed to ${REFERRAL_MIN_PLAN} or above`
              }
            />
            <ReferralStatCard
              label="Earnings"
              value={formatInr(stats?.earnings_inr ?? 0)}
              hint={`${formatInr(stats?.reward_per_referral_inr ?? REFERRAL_REWARD_INR)} per paid referral`}
            />
          </>
        )}
      </section>

      <section className="bg-canvas rounded-xl border border-ink/10 p-5 lg:p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-ink">Your referral link</h2>
        {loading ? (
          <div className="h-12 bg-canvas-soft rounded-lg animate-pulse" />
        ) : referralLink ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                readOnly
                value={referralLink}
                className="flex-1 bg-canvas-soft border border-ink/10 rounded-lg px-4 py-3 text-sm text-ink font-mono"
              />
              <button
                type="button"
                onClick={copyLink}
                className={clsx(
                  "shrink-0 rounded-xl px-5 py-3 text-sm font-semibold transition-colors",
                  copied
                    ? "bg-positive text-white"
                    : "bg-green text-ink hover:bg-green-hover"
                )}
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-positive text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition-opacity"
              >
                Share on WhatsApp
              </a>
              <a
                href={`mailto:?subject=Try%20SvaraRx&body=${encodeURIComponent(
                  `I use SvaraRx for voice prescriptions. Try it: ${referralLink}`
                )}`}
                className="inline-flex items-center rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-canvas-soft transition-colors"
              >
                Email invite
              </a>
            </div>
          </>
        ) : (
          <p className="text-sm text-negative">Could not load your referral link. Try again later.</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink">How it works</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="bg-canvas rounded-xl border border-ink/10 p-5 shadow-sm space-y-2"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green text-ink text-xs font-black">
                {i + 1}
              </span>
              <p className="font-bold text-sm text-ink">{step.title}</p>
              <p className="text-sm text-body">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-xs text-mute text-center max-w-lg mx-auto">
        Referral rewards are credited after your invitee completes their first paid month.
        Terms may change; contact{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-positive hover:underline">
          {SUPPORT_EMAIL}
        </a>{" "}
        with questions.
      </p>
    </div>
  );
}
