"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { AppShell } from "@/components/AppShell";
import { PageContent, PageHeader } from "@/components/PageContent";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { DoctorSessionGuard } from "@/components/DoctorSessionGuard";
import { PatientHistoryPanel } from "@/components/PatientHistoryPanel";
import { AllergyBadge, AllergyModal } from "@/components/AllergyModal";
import {
  PatientFilters,
  DEFAULT_PATIENT_FILTERS,
} from "@/components/PatientFilters";
import {
  listPatients,
  type PatientListItem,
  type PatientListFilters,
} from "@/lib/api";
import { VitalsSummaryRow } from "@/components/VitalsSummaryRow";
import { ConditionChips } from "@/components/ConditionChips";

function formatLastVisit(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function PatientCard({
  patient,
  onHistoryClick,
}: {
  patient: PatientListItem;
  onHistoryClick: (patientId: string) => void;
}) {
  const router = useRouter();
  const [showAllergies, setShowAllergies] = useState(false);
  const [allergyCount, setAllergyCount] = useState(patient.allergy_count ?? 0);
  const lastVisit = formatLastVisit(patient.last_visit_at);

  const openDetail = () => router.push(`/patients/${patient.id}`);

  return (
    <>
      <div className="bg-canvas rounded-xl px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-3">
        <div
          role="button"
          tabIndex={0}
          onClick={openDetail}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openDetail();
            }
          }}
          className="min-w-0 flex-1 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-ink text-sm hover:text-positive transition-colors truncate">
              {patient.name}
            </p>
            <AllergyBadge
              count={allergyCount}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAllergies(true);
              }}
            />
            {patient.prescription_count > 0 && (
              <span className="text-[10px] font-semibold text-mute bg-canvas-soft px-2 py-0.5 rounded-pill">
                {patient.prescription_count} visit{patient.prescription_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <ConditionChips patientId={patient.id} compact className="mt-1" />
          <p className="text-xs text-mute mt-0.5">
            {patient.age}Y / {patient.sex}
            {patient.phone && <span> · {patient.phone}</span>}
            {lastVisit && <span> · Last visit {lastVisit}</span>}
          </p>
          <VitalsSummaryRow patientId={patient.id} />
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <Link
            href={`/patients/${patient.id}?edit=1`}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-semibold text-body hover:text-positive whitespace-nowrap"
          >
            Edit
          </Link>
          <Link
            href={`/prescribe?patient=${patient.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-semibold text-positive hover:text-positive-deep whitespace-nowrap"
          >
            New Rx
          </Link>
          <button
            type="button"
            onClick={() => onHistoryClick(patient.id)}
            className="p-1.5 rounded-lg text-mute hover:text-positive hover:bg-green-pale transition-colors"
            aria-label="View visit history"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <AllergyModal
        patientId={patient.id}
        patientName={patient.name}
        open={showAllergies}
        onClose={() => setShowAllergies(false)}
        onUpdated={setAllergyCount}
      />
    </>
  );
}

export default function PatientsPage() {
  return (
    <OnboardingGuard>
      <DoctorSessionGuard>
        <PatientsContent />
      </DoctorSessionGuard>
    </OnboardingGuard>
  );
}

function PatientsContent() {
  const [filters, setFilters] = useState<PatientListFilters>(DEFAULT_PATIENT_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyPatientId, setHistoryPatientId] = useState<string | null>(null);

  const fetchPatients = useCallback(
    async (activeFilters: PatientListFilters, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const result = await listPatients(activeFilters);
        setTotal(result.total);
        setPage(result.page);
        setPatients((prev) =>
          append ? [...prev, ...result.items] : result.items
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load patients.");
        if (!append) setPatients([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    const t = setTimeout(() => fetchPatients(filters), 300);
    return () => clearTimeout(t);
  }, [filters, fetchPatients]);

  const hasMore = patients.length < total;
  const subtitle = !loading
    ? total === 0
      ? filters.q
        ? `No patients matching "${filters.q}"`
        : "No patients"
      : `Showing ${patients.length} of ${total} patient${total !== 1 ? "s" : ""}${
          filters.q ? ` matching "${filters.q}"` : ""
        }`
    : undefined;

  return (
    <AppShell>
      <PageContent>
        <PageHeader
          title="Patients"
          subtitle={subtitle}
          actions={
            <Link
              href="/patients/new"
              className="bg-green text-ink font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-green-hover transition-colors"
            >
              + Add patient
            </Link>
          }
        />

        <PatientFilters
          filters={filters}
          onChange={setFilters}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((v) => !v)}
        />

        {error && (
          <div className="mb-4 bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-sm text-negative">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
          </div>
        )}

        {!loading && patients.length === 0 && (
          <div className="bg-canvas rounded-xl p-8 shadow-sm text-center">
            {filters.q || showAdvanced ? (
              <>
                <p className="text-sm text-body">No patients match your search or filters.</p>
                <button
                  onClick={() => {
                    setFilters(DEFAULT_PATIENT_FILTERS);
                    setShowAdvanced(false);
                  }}
                  className="mt-3 text-sm font-semibold text-positive underline underline-offset-2"
                >
                  Clear search & filters
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-body mb-3">No patients registered yet.</p>
                <Link
                  href="/patients/new"
                  className="inline-block bg-green text-ink font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-green-hover transition-colors"
                >
                  Register first patient
                </Link>
              </>
            )}
          </div>
        )}

        {!loading && patients.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {patients.map((p) => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  onHistoryClick={setHistoryPatientId}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-6">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() =>
                    fetchPatients({ ...filters, page: page + 1 }, true)
                  }
                  className={clsx(
                    "px-6 py-3 rounded-xl text-sm font-semibold border transition-colors",
                    loadingMore
                      ? "bg-canvas-soft text-mute border-ink/10 cursor-wait"
                      : "bg-canvas text-ink border-ink/15 hover:border-green hover:text-positive"
                  )}
                >
                  {loadingMore
                    ? "Loading…"
                    : `Load more (${total - patients.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </PageContent>

      <PatientHistoryPanel
        patientId={historyPatientId}
        onClose={() => setHistoryPatientId(null)}
      />
    </AppShell>
  );
}
