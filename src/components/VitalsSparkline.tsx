"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getPatientVitals, type VitalReading } from "@/lib/api";

function formatChartDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

interface VitalsSparklineProps {
  patientId: string;
  limit?: number;
}

export function VitalsSparkline({ patientId, limit = 10 }: VitalsSparklineProps) {
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getPatientVitals(patientId, limit);
        if (!cancelled) {
          setReadings([...data].reverse());
        }
      } catch {
        if (!cancelled) setReadings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, limit]);

  const bpData = useMemo(
    () =>
      readings
        .filter((r) => r.bp_systolic != null)
        .map((r) => ({
          date: formatChartDate(r.recorded_at),
          systolic: r.bp_systolic,
          diastolic: r.bp_diastolic,
        })),
    [readings]
  );

  const sugarData = useMemo(
    () =>
      readings
        .filter((r) => r.blood_sugar_mg_dl != null)
        .map((r) => ({
          date: formatChartDate(r.recorded_at),
          sugar: r.blood_sugar_mg_dl,
          type: r.blood_sugar_type,
        })),
    [readings]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-5 h-5 border-2 border-green-pale border-t-positive rounded-full animate-spin" />
      </div>
    );
  }

  if (bpData.length === 0 && sugarData.length === 0) {
    return (
      <p className="text-xs text-mute text-center py-3">No vitals history yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {bpData.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-body mb-2">BP trend (systolic)</p>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bpData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} width={32} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="Systolic"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sugarData.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-body mb-2">Blood sugar trend</p>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sugarData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} width={32} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="sugar"
                  stroke="#ca8a04"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="mg/dL"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
