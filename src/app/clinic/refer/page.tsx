"use client";

import Link from "next/link";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { ClinicAppShell } from "@/components/ClinicAppShell";
import { PageContent, PageHeader } from "@/components/PageContent";
import { ReferEarnContent } from "@/components/ReferEarnContent";
import { REFERRAL_REWARD_INR } from "@/lib/svararx-features";
import { formatInr } from "@/lib/subscription-plans";

export default function ClinicReferPage() {
  return (
    <OnboardingGuard>
      <ClinicAppShell>
        <PageContent className="space-y-6 pb-16">
          <PageHeader
            title="Refer & earn"
            subtitle={`Invite fellow doctors to SvaraRx and earn ${formatInr(REFERRAL_REWARD_INR)} per paid subscription.`}
            actions={
              <Link
                href="/clinic"
                className="text-sm font-semibold text-positive hover:text-positive-deep"
              >
                ← Clinic dashboard
              </Link>
            }
          />
          <ReferEarnContent />
        </PageContent>
      </ClinicAppShell>
    </OnboardingGuard>
  );
}
