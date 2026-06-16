"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { getPatientVitalsLatest, type VitalReading } from "@/lib/api";
import { formatVitalsSummary, hasVitalFlags } from "@/lib/vitals";

interface VitalsSummaryRowProps {
  patientId: string;
  refreshKey?: number;
  className?: string;
}

export function VitalsSummaryRow({
  patientId,
  refreshKey = 0,
  className,
}: VitalsSummaryRowProps) {
  const [vitals, setVitals] = useState<VitalReading | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const latest = await getPatientVitalsLatest(patientId);
        if (!cancelled) setVitals(latest);
      } catch {
        if (!cancelled) setVitals(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, refreshKey]);

  if (loading) return null;

  const summary = formatVitalsSummary(vitals);
  if (!summary) return null;

  return (
    <p
      className={clsx(
        "text-xs mt-0.5 truncate",
        hasVitalFlags(vitals) ? "text-negative font-semibold" : "text-mute",
        className
      )}
      title={summary}
    >
      {summary}
    </p>
  );
}
