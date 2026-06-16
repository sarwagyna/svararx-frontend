"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageContent, PageHeader } from "@/components/PageContent";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { DoctorSessionGuard } from "@/components/DoctorSessionGuard";
import { AddPatientForm } from "@/components/AddPatientForm";

export default function AddPatientPage() {
  return (
    <OnboardingGuard>
      <DoctorSessionGuard>
      <AppShell>
        <PageContent size="narrow">
          <Link
            href="/patients"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-ink transition-colors mb-5"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Patients
          </Link>

          <PageHeader
            title="Add patient"
            subtitle="Register a new patient for your clinic."
          />

          <div className="bg-canvas rounded-xl border border-ink/10 p-5 lg:p-6 shadow-sm">
            <AddPatientForm />
          </div>
        </PageContent>
      </AppShell>
      </DoctorSessionGuard>
    </OnboardingGuard>
  );
}
