"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { ClinicAppShell } from "@/components/ClinicAppShell";
import { PageContent } from "@/components/PageContent";
import { ClinicDashboardPanel } from "@/components/ClinicDashboardPanel";
import { PinEntry } from "@/components/ClinicSessionUI";
import {
  actAsDoctor,
  exchangeToken,
  getClinicUxContext,
  getDashboard,
  type ClinicDoctorStats,
  type ClinicUxContext,
  type DashboardData,
} from "@/lib/api";
import {
  cacheClinicContext,
  exitDoctorSession,
  isDoctorSessionActive,
  usesClinicDashboard,
} from "@/lib/clinic-session";

function ClinicDashboardContent() {
  const router = useRouter();
  const [ctx, setCtx] = useState<ClinicUxContext | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<ClinicDoctorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDoctorSessionActive()) {
      exitDoctorSession();
    }
  }, []);

  const load = useCallback(async () => {
    await exchangeToken();
    // Context decides routing; dashboard is only used if we stay — fetch both
    // in parallel and discard the dashboard result on redirect.
    const [context, dashboard] = await Promise.all([
      getClinicUxContext(),
      getDashboard().catch(() => null),
    ]);
    cacheClinicContext(context);

    if (!usesClinicDashboard(context)) {
      router.replace("/prescribe");
      return;
    }
    if (context.membership_role === "compounder") {
      router.replace("/prescribe");
      return;
    }

    setCtx(context);
    setData(dashboard ?? (await getDashboard()));
  }, [router]);

  useEffect(() => {
    load()
      .catch(() => setError("Could not load clinic dashboard."))
      .finally(() => setLoading(false));
  }, [load]);

  const handleDoctorClick = (doctor: ClinicDoctorStats) => {
    if (!doctor.has_pin) {
      setError(`${doctor.name} has not set a PIN yet.`);
      return;
    }
    setError(null);
    setSelectedDoctor(doctor);
  };

  const handlePin = async (pin: string) => {
    if (!selectedDoctor) return;
    setSubmitting(true);
    setError(null);
    try {
      await actAsDoctor(selectedDoctor.id, pin);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PIN verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ClinicAppShell>
        <PageContent>
          <p className="text-body py-8">Loading clinic dashboard…</p>
        </PageContent>
      </ClinicAppShell>
    );
  }

  return (
    <ClinicAppShell subtitle={ctx?.clinic_name}>
      <PageContent className="space-y-8 pb-16">
        {!selectedDoctor && (
          <div>
            <h1 className="text-2xl lg:text-[32px] font-semibold text-ink tracking-tight">
              Clinic dashboard
            </h1>
            <p className="text-sm text-body mt-1">
              Choose a doctor and tap Enter workspace to sign in with their PIN.
            </p>
          </div>
        )}

        {error && !selectedDoctor && (
          <div className="bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-sm text-negative">
            {error}
          </div>
        )}

        {!selectedDoctor && data?.clinic && (
          <ClinicDashboardPanel clinic={data.clinic} onDoctorClick={handleDoctorClick} />
        )}

        {selectedDoctor && (
          <PinEntry
            doctorName={selectedDoctor.name}
            onSubmit={handlePin}
            onCancel={() => {
              setSelectedDoctor(null);
              setError(null);
            }}
            loading={submitting}
            error={error}
            submitLabel="Open doctor dashboard →"
          />
        )}
      </PageContent>
    </ClinicAppShell>
  );
}

export default function ClinicDashboardPage() {
  return (
    <OnboardingGuard>
      <ClinicDashboardContent />
    </OnboardingGuard>
  );
}
