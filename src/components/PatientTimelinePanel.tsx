"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { getPatientTimeline, type PatientTimeline } from "@/lib/api";

interface PatientTimelinePanelProps {
  patientId: string;
  recordHref?: (consultationId: string) => string;
}

export function PatientTimelinePanel({ patientId, recordHref }: PatientTimelinePanelProps) {
  const [timeline, setTimeline] = useState<PatientTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatientTimeline(patientId)
      .then(setTimeline)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load timeline")
      )
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative">
        {error}
      </div>
    );
  }

  if (!timeline?.visits.length) {
    return (
      <p className="text-sm text-mute py-4">No completed visits yet. Timeline builds as you approve consultations.</p>
    );
  }

  return (
    <div className="space-y-6">
      {timeline.visits.map((visit) => (
        <div key={visit.visit_id} className="relative pl-6">
          <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-positive" />
          <div className="absolute left-[3px] top-3 bottom-0 w-px bg-canvas-soft" />
          <p className="text-xs font-bold text-mute uppercase tracking-wide mb-2 flex items-center justify-between gap-2">
            <span>
              {new Date(visit.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              })}
            </span>
            {recordHref && (
              <Link
                href={recordHref(visit.visit_id)}
                className="text-positive normal-case font-semibold hover:underline"
              >
                View record
              </Link>
            )}
          </p>
          <ul className="space-y-2">
            {visit.events.map((event, idx) => (
              <li
                key={`${visit.visit_id}-${idx}`}
                className={clsx(
                  "rounded-lg border border-ink/10 bg-canvas px-3 py-2 text-sm",
                  event.type === "ai_summary" && "border-positive/20 bg-green-pale/30"
                )}
              >
                <span className="font-semibold text-ink">{event.label}</span>
                {event.detail && (
                  <p className="text-body text-xs mt-0.5 line-clamp-2">{event.detail}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
