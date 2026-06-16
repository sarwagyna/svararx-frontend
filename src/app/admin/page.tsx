"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { AppShell } from "@/components/AppShell";
import { PageContent, PageHeader } from "@/components/PageContent";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { getAdminOverview, type AdminOverview, type DoctorInfo } from "@/lib/api";

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-canvas rounded-xl p-5 shadow-sm">
      <span
        className="font-black text-ink block leading-none"
        style={{ fontSize: 40, lineHeight: 1 }}
      >
        {value}
      </span>
      <span className="text-xs font-semibold text-mute uppercase tracking-wide mt-1 block">
        {label}
      </span>
      {sub && <span className="text-xs text-mute mt-0.5 block">{sub}</span>}
    </div>
  );
}

function DoctorRow({ doctor }: { doctor: DoctorInfo }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-canvas-soft last:border-0">
      <div className="min-w-0">
        <p className="font-bold text-sm text-ink">{doctor.name}</p>
        <p className="text-xs text-mute mt-0.5">
          {doctor.qualifications} · {doctor.speciality}
        </p>
        <p className="text-xs text-mute font-mono">{doctor.mci_number}</p>
      </div>
      <span
        className={clsx(
          "text-xs font-semibold px-2 py-0.5 rounded-pill flex-shrink-0",
          doctor.is_active
            ? "bg-green-pale text-positive-deep"
            : "bg-canvas-soft text-mute"
        )}
      >
        {doctor.is_active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

export default function AdminPage() {
  return (
    <OnboardingGuard>
      <AdminContent />
    </OnboardingGuard>
  );
}

function AdminContent() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOverview()
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load admin data.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <PageContent className="space-y-6 lg:space-y-8">
        <PageHeader title="Admin" subtitle="System overview" />

        {/* Error */}
        {error && (
          <div className="bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-sm text-negative">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-canvas rounded-xl p-5 h-24 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-canvas rounded-xl p-5 h-40 animate-pulse" />
              <div className="bg-canvas rounded-xl p-5 h-40 animate-pulse" />
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Stats */}
            <Section title="Stats">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <StatCard label="Patients" value={data.total_patients} />
                <StatCard label="Prescriptions" value={data.total_prescriptions} />
                <StatCard
                  label="This Month"
                  value={data.prescriptions_this_month}
                  sub="prescriptions"
                />
                <StatCard label="Drugs in DB" value={data.total_drugs} />
              </div>
            </Section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Clinic */}
            <Section title="Clinic">
              <div className="bg-canvas rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-ink text-base">{data.clinic.name}</p>
                    <p className="text-sm text-body mt-0.5">
                      {data.clinic.address_line1}
                      {data.clinic.address_line2 && `, ${data.clinic.address_line2}`}
                    </p>
                    <p className="text-sm text-body">
                      {data.clinic.city}, {data.clinic.state} — {data.clinic.pincode}
                    </p>
                    {data.clinic.phone && (
                      <p className="text-sm text-mute mt-0.5">{data.clinic.phone}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span
                      className={clsx(
                        "text-xs font-semibold px-2 py-0.5 rounded-pill",
                        data.clinic.is_active
                          ? "bg-green-pale text-positive-deep"
                          : "bg-canvas-soft text-mute"
                      )}
                    >
                      {data.clinic.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-pill bg-canvas-soft text-body capitalize">
                      {data.clinic.plan} plan
                    </span>
                  </div>
                </div>
                <p className="text-xs text-mute font-mono border-t border-canvas-soft pt-3">
                  ID: {data.clinic.id}
                </p>
              </div>
            </Section>

            {/* Doctors */}
            <Section title={`Doctors · ${data.doctors.length}`}>
              {data.doctors.length === 0 ? (
                <div className="bg-canvas rounded-xl p-6 shadow-sm text-center">
                  <p className="text-sm text-body">No doctors linked to this clinic.</p>
                </div>
              ) : (
                <div className="bg-canvas rounded-xl px-4 shadow-sm">
                  {data.doctors.map((d) => (
                    <DoctorRow key={d.id} doctor={d} />
                  ))}
                </div>
              )}
            </Section>
            </div>

            {/* Quick links */}
            <Section title="Quick Links">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-2xl lg:max-w-none">
                <Link
                  href="/patients"
                  className="bg-canvas rounded-xl px-4 py-3.5 shadow-sm text-sm font-semibold text-ink hover:bg-canvas-soft transition-colors text-center"
                >
                  All Patients
                </Link>
                <Link
                  href="/prescribe"
                  className="bg-green text-ink rounded-xl px-4 py-3.5 text-sm font-semibold hover:bg-green-hover transition-colors text-center"
                >
                  New Prescription
                </Link>
              </div>
            </Section>
          </>
        )}
      </PageContent>
    </AppShell>
  );
}
