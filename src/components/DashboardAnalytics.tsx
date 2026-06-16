"use client";

import { type ReactNode } from "react";
import { clsx } from "clsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyCount, DashboardAnalytics } from "@/lib/api";

function weekChange(current: number, previous: number): string | null {
  if (previous === 0) {
    return current > 0 ? "+100%" : null;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "0%";
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

function weekDeltaPositive(weekDelta: string | null): boolean | null {
  if (weekDelta == null) return null;
  if (weekDelta === "0%") return null;
  return weekDelta.startsWith("+");
}

function MiniStat({
  label,
  value,
  hint,
  hintPositive,
}: {
  label: string;
  value: string | number;
  hint?: string | null;
  hintPositive?: boolean | null;
}) {
  return (
    <div className="bg-canvas-soft rounded-xl px-4 py-3">
      <p className="text-[10px] font-semibold text-mute uppercase tracking-wide">{label}</p>
      <p className="text-xl font-black text-ink mt-1">{value}</p>
      {hint && (
        <p
          className={clsx(
            "text-xs font-semibold mt-0.5",
            hintPositive === true && "text-positive",
            hintPositive === false && "text-negative",
            hintPositive == null && "text-mute"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function DailyBarChart({
  data,
  color,
  tooltipLabel,
}: {
  data: DailyCount[];
  color: string;
  tooltipLabel: string;
}) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e4" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: `${color}14` }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
            formatter={(value) => [value, tooltipLabel]}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload as { date?: string };
              if (!item?.date) return "";
              return new Date(item.date).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                timeZone: "Asia/Kolkata",
              });
            }}
          />
          <Bar dataKey="count" fill={color} radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  total,
  totalClassName,
  children,
}: {
  title: string;
  subtitle: string;
  total: number;
  totalClassName: string;
  children: ReactNode;
}) {
  return (
    <div className="xl:col-span-2 bg-canvas rounded-xl border border-ink/10 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          <p className="text-xs text-mute mt-0.5">{subtitle}</p>
        </div>
        <span
          className={clsx(
            "text-xs font-semibold px-2.5 py-1 rounded-pill shrink-0",
            totalClassName
          )}
        >
          {total} total
        </span>
      </div>
      {children}
    </div>
  );
}

interface DashboardAnalyticsPanelProps {
  analytics: DashboardAnalytics;
}

export function DashboardAnalyticsPanel({ analytics }: DashboardAnalyticsPanelProps) {
  const rxWeekDelta = weekChange(
    analytics.week_prescriptions,
    analytics.last_week_prescriptions
  );
  const patientWeekDelta = weekChange(
    analytics.new_patients_week,
    analytics.last_week_new_patients
  );

  const totalStatus =
    analytics.draft_prescriptions + analytics.completed_prescriptions;
  const completedPct =
    totalStatus > 0
      ? Math.round((analytics.completed_prescriptions / totalStatus) * 100)
      : 0;

  const sexTotal = analytics.patient_sex_breakdown.reduce((sum, s) => sum + s.count, 0);

  return (
    <section className="space-y-6">
      <p className="text-xs font-semibold text-mute uppercase tracking-wide">Analytics</p>

      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-mute uppercase tracking-wide">Patients</p>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ChartCard
            title="New patients — last 7 days"
            subtitle="Daily patient registrations"
            total={analytics.patients_by_day.reduce((sum, d) => sum + d.count, 0)}
            totalClassName="text-ink bg-canvas-soft"
          >
            <DailyBarChart
              data={analytics.patients_by_day}
              color="#2563eb"
              tooltipLabel="New patients"
            />
          </ChartCard>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat
                label="New this week"
                value={analytics.new_patients_week}
                hint={
                  patientWeekDelta
                    ? `${patientWeekDelta} vs last week`
                    : "vs last week"
                }
                hintPositive={weekDeltaPositive(patientWeekDelta)}
              />
              <MiniStat
                label="Visited this week"
                value={analytics.patients_visited_week}
                hint="Unique patients"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MiniStat
                label="Total patients"
                value={analytics.total_active_patients}
                hint="Active records"
              />
              <MiniStat
                label="With allergies"
                value={analytics.patients_with_allergies}
                hint="Recorded allergies"
              />
            </div>

            {analytics.patient_sex_breakdown.length > 0 && (
              <div className="bg-canvas rounded-xl border border-ink/10 p-4 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-ink">Gender breakdown</h3>
                <div className="space-y-2">
                  {analytics.patient_sex_breakdown.map((item) => {
                    const pct =
                      sexTotal > 0 ? Math.round((item.count / sexTotal) * 100) : 0;
                    return (
                      <div key={item.sex}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-body font-semibold">{item.label}</span>
                          <span className="font-bold text-ink">
                            {item.count}
                            <span className="text-mute font-semibold ml-1">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-canvas-soft rounded-pill overflow-hidden">
                          <div
                            className="h-full bg-ink/70 rounded-pill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-mute uppercase tracking-wide">
          Prescriptions
        </p>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ChartCard
            title="Prescriptions — last 7 days"
            subtitle="Daily Rx volume in your clinic"
            total={analytics.rx_by_day.reduce((sum, d) => sum + d.count, 0)}
            totalClassName="text-positive bg-green-pale"
          >
            <DailyBarChart
              data={analytics.rx_by_day}
              color="#16a34a"
              tooltipLabel="Prescriptions"
            />
          </ChartCard>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat
                label="Rx this week"
                value={analytics.week_prescriptions}
                hint={rxWeekDelta ? `${rxWeekDelta} vs last week` : "vs last week"}
                hintPositive={weekDeltaPositive(rxWeekDelta)}
              />
              <MiniStat
                label="Avg meds / Rx"
                value={analytics.avg_medications_per_rx}
                hint="All time"
              />
            </div>

            <div className="bg-canvas rounded-xl border border-ink/10 p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-ink">Rx status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-body font-semibold">Completed</span>
                  <span className="font-bold text-ink">
                    {analytics.completed_prescriptions}
                  </span>
                </div>
                <div className="h-2 bg-canvas-soft rounded-pill overflow-hidden">
                  <div
                    className="h-full bg-positive rounded-pill transition-all"
                    style={{ width: `${completedPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-body font-semibold">Drafts</span>
                  <span className="font-bold text-warning-content">
                    {analytics.draft_prescriptions}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
