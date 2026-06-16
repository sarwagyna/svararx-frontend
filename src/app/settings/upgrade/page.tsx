"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageContent, PageHeader } from "@/components/PageContent";
import { PricingPlansContent } from "@/components/PricingPlansContent";
import { SettingsTiles } from "@/components/SettingsTiles";

export default function UpgradePage() {
  return (
    <AppShell>
      <PageContent size="wide" className="space-y-10 pb-16">
        <PageHeader
          title="Pricing & plans"
          subtitle="Voice prescribing built for Indian OPDs — Telugu, Hindi, and English."
          actions={
            <Link
              href="/settings/profile"
              className="text-sm font-semibold text-positive hover:text-positive-deep"
            >
              ← Settings
            </Link>
          }
        />

        <SettingsTiles currentPath="/settings/upgrade" />

        <PricingPlansContent />
      </PageContent>
    </AppShell>
  );
}
