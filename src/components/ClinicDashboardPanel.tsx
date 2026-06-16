"use client";

import Link from "next/link";
import { clsx } from "clsx";
import type { ClinicDashboardSummary, ClinicDoctorStats } from "@/lib/api";

function roleLabel(role: string): string {
  if (role === "admin") return "Admin";
  if (role === "compounder") return "Compounder";
  return "Doctor";
}

function doctorInitials(name: string): string {
  const cleaned = name.replace(/^Dr\.?\s*/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase() || "?";
}

function DoctorStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={clsx(
          "text-lg font-black leading-none",
          highlight ? "text-positive" : "text-ink"
        )}
      >
        {value}
      </p>
      <p className="text-[10px] font-semibold text-mute uppercase tracking-wide mt-1">
        {label}
      </p>
    </div>
  );
}

function EnterIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoctorWorkspaceCard({
  doctor,
  onEnter,
}: {
  doctor: ClinicDoctorStats;
  onEnter: () => void;
}) {
  const canEnter = doctor.has_pin;

  return (
    <article
      className={clsx(
        "flex flex-col bg-canvas rounded-2xl border border-ink/10 shadow-sm overflow-hidden",
        canEnter ? "hover:border-green/40 hover:shadow-md transition-all" : "opacity-80"
      )}
    >
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div
            className={clsx(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black",
              canEnter ? "bg-green-pale text-positive-deep" : "bg-canvas-soft text-mute"
            )}
            aria-hidden
          >
            {doctorInitials(doctor.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-ink truncate">{doctor.name}</p>
                <p className="text-xs text-body mt-0.5 truncate">{doctor.speciality}</p>
              </div>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-pill bg-canvas-soft text-body">
                {roleLabel(doctor.role)}
              </span>
            </div>
            <p
              className={clsx(
                "text-[10px] font-semibold mt-2 inline-flex items-center gap-1",
                canEnter ? "text-positive" : "text-mute"
              )}
            >
              <span
                className={clsx(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  canEnter ? "bg-positive" : "bg-mute"
                )}
              />
              {canEnter ? "PIN set — ready to enter" : "PIN not set"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 py-3 border-t border-ink/10 bg-canvas-soft/40">
        <DoctorStat label="Today" value={doctor.today_prescriptions} highlight />
        <DoctorStat label="Week" value={doctor.week_prescriptions} />
        <DoctorStat label="Total Rx" value={doctor.total_prescriptions} />
        <DoctorStat label="Patients" value={doctor.total_patients} />
      </div>

      <div className="p-4 pt-3 border-t border-ink/10">
        {canEnter ? (
          <button
            type="button"
            onClick={onEnter}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green text-ink font-semibold px-4 py-3 text-sm hover:bg-green-hover transition-colors focus:outline-none focus:ring-2 focus:ring-green/50"
          >
            <EnterIcon />
            Enter workspace
          </button>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-canvas-soft text-mute font-semibold px-4 py-3 text-sm cursor-not-allowed"
            >
              Enter workspace
            </button>
            <p className="text-xs text-center text-body">
              Set a PIN in{" "}
              <Link href="/clinic/settings" className="text-positive font-semibold hover:underline">
                clinic settings
              </Link>
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

interface ClinicDashboardPanelProps {
  clinic: ClinicDashboardSummary;
  onDoctorClick?: (doctor: ClinicDoctorStats) => void;
}

export function ClinicDashboardPanel({ clinic, onDoctorClick }: ClinicDashboardPanelProps) {
  const clinicRxToday = clinic.doctors.reduce((sum, d) => sum + d.today_prescriptions, 0);
  const clinicRxWeek = clinic.doctors.reduce((sum, d) => sum + d.week_prescriptions, 0);
  const clinicPatients = clinic.doctors.reduce((sum, d) => sum + d.total_patients, 0);

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-mute uppercase tracking-wide">Clinic</p>
          <h2 className="text-xl font-bold text-ink mt-1">{clinic.clinic_name}</h2>
          <p className="text-sm text-body mt-0.5">
            {clinic.doctor_count} doctor{clinic.doctor_count !== 1 ? "s" : ""}
            {" · "}
            {clinic.plan} plan
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/clinic/doctors/new"
            className="text-sm font-semibold text-positive hover:text-positive-deep"
          >
            + Add doctor
          </Link>
          <Link
            href="/clinic/settings"
            className="text-sm font-semibold text-positive hover:text-positive-deep"
          >
            Clinic settings →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-canvas rounded-xl border border-ink/10 px-4 py-3 shadow-sm text-center">
          <p className="text-2xl font-black text-ink">{clinicRxToday}</p>
          <p className="text-[10px] font-semibold text-mute uppercase tracking-wide mt-1">
            Rx today
          </p>
        </div>
        <div className="bg-canvas rounded-xl border border-ink/10 px-4 py-3 shadow-sm text-center">
          <p className="text-2xl font-black text-ink">{clinicRxWeek}</p>
          <p className="text-[10px] font-semibold text-mute uppercase tracking-wide mt-1">
            Rx this week
          </p>
        </div>
        <div className="bg-canvas rounded-xl border border-ink/10 px-4 py-3 shadow-sm text-center">
          <p className="text-2xl font-black text-ink">{clinicPatients}</p>
          <p className="text-[10px] font-semibold text-mute uppercase tracking-wide mt-1">
            Patients added
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-3">
          Doctors — select a profile to enter workspace
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clinic.doctors.map((doctor) => (
            <DoctorWorkspaceCard
              key={doctor.id}
              doctor={doctor}
              onEnter={() => onDoctorClick?.(doctor)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
