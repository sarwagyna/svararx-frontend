"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  listPatientConsultations,
  type PatientConsultationListItem,
} from "@/lib/api";
import { EmrRecordEditor } from "@/components/EmrRecordEditor";

function formatVisitDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

function visitLabel(item: PatientConsultationListItem): string {
  if (item.chief_complaint) return item.chief_complaint;
  if (item.diagnosis_primary) return item.diagnosis_primary;
  if (item.ai_summary) {
    const short = item.ai_summary.slice(0, 60);
    return item.ai_summary.length > 60 ? `${short}…` : short;
  }
  return "Consultation";
}

interface PatientRecordPanelProps {
  patientId: string;
  selectedVisitId: string | null;
  onSelectVisit: (consultationId: string) => void;
}

export function PatientRecordPanel({
  patientId,
  selectedVisitId,
  onSelectVisit,
}: PatientRecordPanelProps) {
  const [consultations, setConsultations] = useState<PatientConsultationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listPatientConsultations(patientId);
      setConsultations(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load patient record.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading && consultations.length > 0 && !selectedVisitId) {
      onSelectVisit(consultations[0].consultation_id);
    }
  }, [loading, consultations, selectedVisitId, onSelectVisit]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-negative/25 bg-negative/5 px-4 py-3 text-sm text-negative">
        {error}
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-canvas p-8 text-center">
        <p className="text-sm text-body mb-4">
          No visit records yet. Start a new prescription to document a consultation.
        </p>
        <Link
          href={`/prescribe?patient=${patientId}`}
          className="inline-flex rounded-2xl bg-green text-ink px-5 py-2.5 text-sm font-semibold hover:bg-green-hover"
        >
          + New Rx
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <p className="text-[10px] font-semibold text-mute uppercase tracking-wide mb-2 px-1">
          Visits ({consultations.length})
        </p>
        <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {consultations.map((item) => {
            const active = selectedVisitId === item.consultation_id;
            return (
              <li key={item.consultation_id}>
                <button
                  type="button"
                  onClick={() => onSelectVisit(item.consultation_id)}
                  className={clsx(
                    "w-full text-left rounded-2xl border px-3 py-3 transition-colors",
                    active
                      ? "border-green bg-green-pale/40"
                      : "border-ink/8 bg-canvas hover:border-green/40"
                  )}
                >
                  <p className="text-[10px] text-mute font-medium">
                    {formatVisitDate(item.started_at)}
                  </p>
                  <p className="text-sm font-semibold text-ink mt-0.5 line-clamp-2">
                    {visitLabel(item)}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={clsx(
                        "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-pill",
                        item.record_status === "approved"
                          ? "bg-green-pale text-positive-deep"
                          : "bg-warning/15 text-warning-content"
                      )}
                    >
                      {item.record_status}
                    </span>
                    <span className="text-[10px] text-mute capitalize">
                      {item.visit_type.replace("_", " ")}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="min-w-0">
        {selectedVisitId ? (
          <EmrRecordEditor
            key={selectedVisitId}
            consultationId={selectedVisitId}
            onSaved={() => listPatientConsultations(patientId).then(setConsultations)}
          />
        ) : (
          <p className="text-sm text-mute">Select a visit to view the record.</p>
        )}
      </main>
    </div>
  );
}
