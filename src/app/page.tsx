"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { clsx } from "clsx";
import { AppShell } from "@/components/AppShell";
import { PageContent } from "@/components/PageContent";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { DoctorSessionGuard } from "@/components/DoctorSessionGuard";

// recharts is heavy — load it only on the client after the dashboard shell paints.
const DashboardAnalyticsPanel = dynamic(
  () => import("@/components/DashboardAnalytics").then((m) => m.DashboardAnalyticsPanel),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-2xl bg-canvas-soft animate-pulse" aria-hidden />
    ),
  }
);
import { getDashboard, getMe, prescriptionLink, type DashboardData, type RecentPrescription } from "@/lib/api";
import { getActiveDoctorId } from "@/lib/clinic-session";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl p-5 lg:p-6 flex flex-col gap-1",
        accent ? "bg-ink" : "bg-canvas shadow-sm"
      )}
    >
      <span
        className={clsx(
          "font-black leading-none",
          accent ? "text-green" : "text-ink"
        )}
        style={{ fontSize: 40, lineHeight: 1 }}
      >
        {value}
      </span>
      <span
        className={clsx(
          "text-xs font-semibold uppercase tracking-wide mt-1",
          accent ? "text-green/60" : "text-mute"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "pdf_generated" || status === "approved"
      ? "bg-green-pale text-positive-deep"
      : status === "draft"
      ? "bg-warning/20 text-warning-content"
      : "bg-warning/10 text-warning-content";
  const label =
    status === "pdf_generated"
      ? "Printed"
      : status === "draft"
      ? "Draft"
      : status.replace("_", " ");
  return (
    <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-pill", cls)}>
      {label}
    </span>
  );
}

function RecentRxCard({ rx }: { rx: RecentPrescription }) {
  const dateStr = new Date(rx.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const timeStr = rx.approved_at
    ? new Date(rx.approved_at).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : null;

  const href = prescriptionLink(rx);

  return (
    <Link
      href={href}
      className="block bg-canvas rounded-xl px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-sm text-ink group-hover:text-positive transition-colors truncate">
            {rx.patient_name}
          </p>
          <p className="text-xs text-mute mt-0.5 truncate">
            {rx.diagnosis || "No diagnosis"}
            {" · "}
            {rx.item_count} med{rx.item_count !== 1 ? "s" : ""}
            {rx.doctor_name && (
              <>
                {" · "}
                <span className="text-body">{rx.doctor_name}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <StatusBadge status={rx.status} />
          <p className="text-xs text-mute">
            {dateStr}
            {timeStr && ` · ${timeStr}`}
          </p>
        </div>
      </div>
    </Link>
  );
}

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [sessionDoctorId, setSessionDoctorId] = useState<string | null>(null);

  useEffect(() => {
    setSessionDoctorId(getActiveDoctorId());
    // A valid token is already guaranteed by OnboardingGuard, and authFetch
    // self-heals on 401 — so skip the extra exchangeToken round-trip and let
    // these two calls run in parallel.
    getMe()
      .then((profile) => setDoctorName(profile.name))
      .catch(() => {});

    getDashboard()
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load dashboard.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell
      right={
        sessionDoctorId ? (
          <span className="text-xs font-semibold text-body">Doctor session</span>
        ) : undefined
      }
    >
      <PageContent className="space-y-6 lg:space-y-8">
        {/* Greeting + quick actions */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 lg:gap-6">
          <div>
            <h1 className="text-2xl lg:text-[32px] font-semibold text-ink tracking-tight leading-tight">
              {greeting()}
              {doctorName && <span className="text-body">, {doctorName}</span>}
            </h1>
            <p className="text-sm text-mute mt-1">
              Doctor dashboard ·{" "}
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              })}
            </p>
          </div>
          <div className="flex gap-3 lg:flex-shrink-0">
            <Link
              href="/prescribe"
              className="flex-1 lg:flex-none bg-green text-ink font-semibold rounded-xl px-5 py-3.5 text-sm hover:bg-green-hover transition-colors text-center"
            >
              + New Prescription
            </Link>
            <Link
              href="/patients"
              className="flex-1 lg:flex-none bg-canvas text-ink font-semibold rounded-xl px-5 py-3.5 text-sm hover:bg-canvas-soft transition-colors text-center shadow-sm"
            >
              View Patients
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-sm text-negative">
            {error}
          </div>
        )}

        {/* Stats */}
        {loading ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-canvas rounded-xl p-5 lg:p-6 animate-pulse h-24 lg:h-28" />
              ))}
            </div>
            <div className="bg-canvas rounded-xl border border-ink/10 p-5 animate-pulse h-64" />
            <div className="bg-canvas rounded-xl border border-ink/10 p-5 animate-pulse h-64 mt-6" />
          </>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              <StatCard label="Patients" value={data.total_patients} />
              <StatCard label="Total Rx" value={data.total_prescriptions} />
              <StatCard label="Today" value={data.today_prescriptions} accent />
            </div>

            <DashboardAnalyticsPanel analytics={data.analytics} />
          </>
        ) : null}

        {/* Recent prescriptions */}
        <div>
          <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-3">
            Recent Prescriptions
          </p>

          {loading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-canvas rounded-xl p-4 animate-pulse h-16" />
              ))}
            </div>
          )}

          {!loading && data?.recent_prescriptions.length === 0 && (
            <div className="bg-canvas rounded-xl p-6 shadow-sm text-center">
              <p className="text-sm text-body">No prescriptions yet.</p>
              <Link
                href="/prescribe"
                className="mt-2 inline-block text-sm font-semibold text-positive underline underline-offset-2"
              >
                Create first prescription
              </Link>
            </div>
          )}

          {!loading && data && data.recent_prescriptions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {data.recent_prescriptions.map((rx) => (
                <RecentRxCard key={rx.id} rx={rx} />
              ))}
            </div>
          )}
        </div>
      </PageContent>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <OnboardingGuard>
      <DoctorSessionGuard>
        <DashboardContent />
      </DoctorSessionGuard>
    </OnboardingGuard>
  );
}
