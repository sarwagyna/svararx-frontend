"use client";

import Link from "next/link";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { ClinicAppShell } from "@/components/ClinicAppShell";
import { PageContent, PageHeader } from "@/components/PageContent";
import { PricingPlansContent } from "@/components/PricingPlansContent";

export default function ClinicPricingPage() {
  return (
    <OnboardingGuard>
      <ClinicAppShell>
        <PageContent size="wide" className="space-y-8 pb-16">
          <PageHeader
            title="Pricing & plans"
            subtitle="Voice prescribing built for Indian OPDs — Telugu, Hindi, and English."
            actions={
              <Link
                href="/clinic"
                className="text-sm font-semibold text-positive hover:text-positive-deep"
              >
                ← Clinic dashboard
              </Link>
            }
          />
          <PricingPlansContent />
        </PageContent>
      </ClinicAppShell>
    </OnboardingGuard>
  );
}
