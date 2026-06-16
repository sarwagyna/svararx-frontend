"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { useGuardedNavigation } from "@/lib/save-feedback";
import {
  getPatient,
  getPatientAllergies,
  getPatientHistory,
  getPatientVitalsLatest,
  type Patient,
  type PatientAllergy,
  type VitalReading,
} from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { PageContent } from "@/components/PageContent";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { DoctorSessionGuard } from "@/components/DoctorSessionGuard";
import { PatientHistoryPanel } from "@/components/PatientHistoryPanel";
import { PatientTimelinePanel } from "@/components/PatientTimelinePanel";
import { PatientRecordPanel } from "@/components/PatientRecordPanel";
import { ConditionChips } from "@/components/ConditionChips";
import { AllergyModal } from "@/components/AllergyModal";
import { PatientEditModal } from "@/components/PatientEditModal";
import { formatVitalsSummary, hasVitalFlags, vitalFlagLabel } from "@/lib/vitals";

type PatientTab = "overview" | "record";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function sexLabel(sex: string) {
  if (sex === "M") return "Male";
  if (sex === "F") return "Female";
  if (sex === "O") return "Other";
  return sex;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-mute uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-ink mt-0.5">{value}</p>
    </div>
  );
}

function patientRecordHref(patientId: string, visitId?: string | null) {
  const query = new URLSearchParams({ tab: "record" });
  if (visitId) query.set("visit", visitId);
  return `/patients/${patientId}?${query.toString()}#record`;
}

export default function PatientDetailPage() {
  return (
    <OnboardingGuard>
      <DoctorSessionGuard>
        <PatientDetailContent />
      </DoctorSessionGuard>
    </OnboardingGuard>
  );
}

function PatientDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { push: guardedPush } = useGuardedNavigation();
  const patientId = params.id as string;

  const visitParam = searchParams.get("visit");
  const tabParam = searchParams.get("tab");
  const activeTab: PatientTab =
    tabParam === "record" || visitParam ? "record" : "overview";

  const [patient, setPatient] = useState<Patient | null>(null);
  const [allergies, setAllergies] = useState<PatientAllergy[]>([]);
  const [vitals, setVitals] = useState<VitalReading | null>(null);
  const [visitTotal, setVisitTotal] = useState(0);
  const [lastVisitAt, setLastVisitAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllergies, setShowAllergies] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const setTab = useCallback(
    (tab: PatientTab, visitId?: string | null) => {
      const query = new URLSearchParams();
      if (tab === "record") {
        query.set("tab", "record");
        if (visitId) query.set("visit", visitId);
        guardedPush(`/patients/${patientId}?${query.toString()}#record`);
      } else {
        guardedPush(`/patients/${patientId}`);
      }
    },
    [patientId, guardedPush]
  );

  const selectVisit = useCallback(
    (consultationId: string) => {
      setTab("record", consultationId);
    },
    [setTab]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, allergyList, latestVitals, history] = await Promise.all([
        getPatient(patientId),
        getPatientAllergies(patientId),
        getPatientVitalsLatest(patientId).catch(() => null),
        getPatientHistory(patientId, 1, 1),
      ]);
      setPatient(p);
      setAllergies(allergyList);
      setVitals(latestVitals);
      setVisitTotal(history.total);
      setLastVisitAt(history.items[0]?.created_at ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patient.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("edit") === "1" && patient) {
      setShowEdit(true);
    }
  }, [searchParams, patient]);

  const handleAllergiesUpdated = useCallback(
    (count: number) => {
      if (!patient) return;
      getPatientAllergies(patient.id).then(setAllergies);
      setPatient((p) => (p ? { ...p, allergy_count: count } : p));
    },
    [patient]
  );

  return (
    <AppShell>
      <PageContent>
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-sm text-negative mb-6">
            {error}
          </div>
        )}

        {!loading && patient && (
          <>
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

            <div className="bg-canvas rounded-xl border border-ink/10 p-5 lg:p-6 shadow-sm mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <span className="w-14 h-14 rounded-full bg-green/30 text-ink font-black text-lg flex items-center justify-center shrink-0">
                  {initials(patient.name)}
                </span>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-black text-ink leading-tight">{patient.name}</h1>
                  <p className="text-sm text-body mt-1">
                    {patient.age} years · {sexLabel(patient.sex)}
                  </p>
                  <ConditionChips patientId={patient.id} className="mt-3" />
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEdit(true)}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold border border-ink/15 text-ink hover:border-green hover:text-positive transition-colors"
                  >
                    Edit
                  </button>
                  <Link
                    href={`/prescribe?patient=${patient.id}`}
                    className="bg-green text-ink font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-green-hover transition-colors"
                  >
                    + New Rx
                  </Link>
                  <a
                    href={`tel:${patient.phone ?? ""}`}
                    className={clsx(
                      "rounded-xl px-5 py-2.5 text-sm font-semibold border transition-colors",
                      patient.phone
                        ? "border-ink/15 text-ink hover:border-green"
                        : "border-ink/10 text-mute pointer-events-none"
                    )}
                  >
                    Call
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-canvas-soft">
                <DetailField label="Phone" value={patient.phone ?? "—"} />
                <DetailField label="ABHA ID" value={patient.abha_id ?? "—"} />
                <DetailField label="Registered" value={formatDate(patient.created_at)} />
                <DetailField label="Last visit" value={formatDate(lastVisitAt)} />
                <DetailField
                  label="Total visits"
                  value={visitTotal === 0 ? "No visits yet" : `${visitTotal} visit${visitTotal !== 1 ? "s" : ""}`}
                />
                <DetailField
                  label="Allergies"
                  value={
                    allergies.length === 0 ? (
                      "None recorded"
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAllergies(true)}
                        className="text-positive hover:underline underline-offset-2"
                      >
                        {allergies.length} recorded
                      </button>
                    )
                  }
                />
              </div>
            </div>

            <div className="flex gap-1 mb-6 border-b border-ink/10">
              <button
                type="button"
                onClick={() => setTab("overview")}
                className={clsx(
                  "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
                  activeTab === "overview"
                    ? "border-green text-ink"
                    : "border-transparent text-mute hover:text-ink"
                )}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setTab("record", visitParam)}
                className={clsx(
                  "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
                  activeTab === "record"
                    ? "border-green text-ink"
                    : "border-transparent text-mute hover:text-ink"
                )}
              >
                Patient record
              </button>
            </div>

            {activeTab === "overview" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <section className="bg-canvas rounded-xl border border-ink/10 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold text-ink">Drug allergies</h2>
                      <button
                        type="button"
                        onClick={() => setShowAllergies(true)}
                        className="text-xs font-semibold text-positive hover:underline underline-offset-2"
                      >
                        {allergies.length === 0 ? "Add allergy" : "Manage"}
                      </button>
                    </div>
                    {allergies.length === 0 ? (
                      <p className="text-sm text-mute">No allergies recorded for this patient.</p>
                    ) : (
                      <ul className="space-y-2">
                        {allergies.map((a) => (
                          <li
                            key={a.id}
                            className="flex items-start justify-between gap-3 text-sm border-b border-canvas-soft last:border-0 pb-2 last:pb-0"
                          >
                            <div>
                              <p className="font-semibold text-ink">{a.drug_name}</p>
                              {a.reaction && (
                                <p className="text-xs text-body mt-0.5">{a.reaction}</p>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold uppercase text-mute shrink-0">
                              {a.severity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="bg-canvas rounded-xl border border-ink/10 p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-ink mb-4">Latest vitals</h2>
                    {!vitals ? (
                      <p className="text-sm text-mute">No vitals recorded yet.</p>
                    ) : (
                      <div className="space-y-3">
                        <p
                          className={clsx(
                            "text-sm font-semibold",
                            hasVitalFlags(vitals) ? "text-negative" : "text-ink"
                          )}
                        >
                          {formatVitalsSummary(vitals)}
                        </p>
                        <p className="text-xs text-mute">
                          Recorded {formatDate(vitals.recorded_at)}
                        </p>
                        {vitals.flags.length > 0 && (
                          <ul className="flex flex-wrap gap-2">
                            {vitals.flags.map((f, i) => (
                              <li
                                key={i}
                                className="text-[10px] font-semibold text-negative bg-negative/10 px-2 py-1 rounded-pill"
                              >
                                {vitalFlagLabel(f.flag)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </section>
                </div>

                <section id="visits" className="mb-8">
                  <h2 className="text-xs font-semibold text-mute uppercase tracking-wide mb-3">
                    Visit history
                  </h2>
                  <PatientHistoryPanel
                    patientId={patientId}
                    onClose={() => {}}
                    embedded
                    recordHref={(visitId) => patientRecordHref(patientId, visitId)}
                  />
                </section>

                <section className="mb-8">
                  <h2 className="text-xs font-semibold text-mute uppercase tracking-wide mb-3">
                    Visit timeline
                  </h2>
                  <PatientTimelinePanel
                    patientId={patientId}
                    recordHref={(visitId) => patientRecordHref(patientId, visitId)}
                  />
                </section>
              </>
            )}

            {activeTab === "record" && (
              <section id="record" className="mb-8">
                <PatientRecordPanel
                  patientId={patientId}
                  selectedVisitId={visitParam}
                  onSelectVisit={selectVisit}
                />
              </section>
            )}

            <AllergyModal
              patientId={patient.id}
              patientName={patient.name}
              open={showAllergies}
              onClose={() => setShowAllergies(false)}
              onUpdated={handleAllergiesUpdated}
            />

            <PatientEditModal
              patient={patient}
              open={showEdit}
              onClose={() => setShowEdit(false)}
              onSaved={(updated) => {
                setPatient(updated);
                setShowEdit(false);
              }}
              onAllergiesUpdated={handleAllergiesUpdated}
            />
          </>
        )}
      </PageContent>
    </AppShell>
  );
}
