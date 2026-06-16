"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import type { PatientListFilters, PatientSort } from "@/lib/api";

export const DEFAULT_PATIENT_FILTERS: PatientListFilters = {
  q: "",
  page: 1,
  limit: 30,
  sex: "",
  sort: "name_asc",
  hasAllergies: null,
  visitedWithinDays: null,
};

interface PatientFiltersProps {
  filters: PatientListFilters;
  onChange: (next: PatientListFilters) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

const SORT_OPTIONS: { value: PatientSort; label: string }[] = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "recent_visit", label: "Recent visit" },
  { value: "created_desc", label: "Newest registered" },
];

const VISIT_PRESETS = [
  { label: "Any time", value: null },
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
] as const;

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "text-xs font-semibold px-3 py-1.5 rounded-pill border transition-colors",
        active
          ? "bg-green text-ink border-green"
          : "bg-canvas text-body border-ink/15 hover:border-ink/30"
      )}
    >
      {children}
    </button>
  );
}

export function PatientFilters({
  filters,
  onChange,
  showAdvanced,
  onToggleAdvanced,
}: PatientFiltersProps) {
  const set = (patch: Partial<PatientListFilters>) =>
    onChange({ ...filters, ...patch, page: 1 });

  const activeFilterCount = [
    filters.sex,
    filters.ageMin != null,
    filters.ageMax != null,
    filters.hasAllergies != null,
    filters.visitedWithinDays != null,
    filters.sort !== "name_asc",
  ].filter(Boolean).length;

  return (
    <div className="space-y-3 mb-5 lg:mb-6">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 max-w-xl">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-mute absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={filters.q ?? ""}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search name, phone, or ABHA…"
            className="w-full bg-canvas border border-ink rounded-md pl-10 pr-4 py-3 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition"
          />
        </div>

        <div className="flex gap-2 flex-wrap lg:flex-nowrap">
          <select
            value={filters.sort ?? "name_asc"}
            onChange={(e) => set({ sort: e.target.value as PatientSort })}
            className="bg-canvas border border-ink rounded-md px-3 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-green/50"
            aria-label="Sort patients"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onToggleAdvanced}
            className={clsx(
              "px-4 py-3 rounded-md text-sm font-semibold border transition-colors whitespace-nowrap",
              showAdvanced || activeFilterCount > 0
                ? "bg-green-pale text-positive-deep border-green/40"
                : "bg-canvas text-ink border-ink/15 hover:border-ink/30"
            )}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div className="bg-canvas rounded-xl p-4 shadow-sm space-y-4">
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-2">
              Sex
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "", label: "All" },
                { value: "M", label: "Male" },
                { value: "F", label: "Female" },
                { value: "O", label: "Other" },
              ].map((opt) => (
                <FilterChip
                  key={opt.value || "all"}
                  active={(filters.sex ?? "") === opt.value}
                  onClick={() => set({ sex: opt.value as PatientListFilters["sex"] })}
                >
                  {opt.label}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-mute uppercase tracking-wide block mb-1.5">
                Min age
              </label>
              <input
                type="number"
                min={1}
                max={119}
                value={filters.ageMin ?? ""}
                onChange={(e) =>
                  set({
                    ageMin: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Any"
                className="w-full bg-canvas-soft border border-ink/15 rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-green/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-mute uppercase tracking-wide block mb-1.5">
                Max age
              </label>
              <input
                type="number"
                min={1}
                max={119}
                value={filters.ageMax ?? ""}
                onChange={(e) =>
                  set({
                    ageMax: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Any"
                className="w-full bg-canvas-soft border border-ink/15 rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-green/50"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-2">
              Last visit
            </p>
            <div className="flex flex-wrap gap-2">
              {VISIT_PRESETS.map((opt) => (
                <FilterChip
                  key={opt.label}
                  active={filters.visitedWithinDays === opt.value}
                  onClick={() => set({ visitedWithinDays: opt.value })}
                >
                  {opt.label}
                </FilterChip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-2">
              Allergies
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={filters.hasAllergies == null}
                onClick={() => set({ hasAllergies: null })}
              >
                Any
              </FilterChip>
              <FilterChip
                active={filters.hasAllergies === true}
                onClick={() => set({ hasAllergies: true })}
              >
                Has allergies
              </FilterChip>
              <FilterChip
                active={filters.hasAllergies === false}
                onClick={() => set({ hasAllergies: false })}
              >
                No allergies
              </FilterChip>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_PATIENT_FILTERS, q: filters.q })}
              className="text-sm font-semibold text-positive hover:underline underline-offset-2"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
