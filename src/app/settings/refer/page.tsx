"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageContent, PageHeader } from "@/components/PageContent";
import { ReferEarnContent } from "@/components/ReferEarnContent";
import { SettingsTiles } from "@/components/SettingsTiles";
import { REFERRAL_REWARD_INR } from "@/lib/svararx-features";
import { formatInr } from "@/lib/subscription-plans";

export default function ReferEarnPage() {
  return (
    <AppShell>
      <PageContent className="space-y-6 pb-16">
        <PageHeader
          title="Refer & earn"
          subtitle={`Invite fellow doctors to SvaraRx and earn ${formatInr(REFERRAL_REWARD_INR)} per paid subscription.`}
          actions={
            <Link
              href="/settings/profile"
              className="text-sm font-semibold text-positive hover:text-positive-deep"
            >
              ← Settings
            </Link>
          }
        />

        <SettingsTiles currentPath="/settings/refer" />

        <ReferEarnContent />
      </PageContent>
    </AppShell>
  );
}
