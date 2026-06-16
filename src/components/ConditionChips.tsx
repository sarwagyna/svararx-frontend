"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  addPatientCondition,
  confirmConditionSuggestion,
  dismissConditionSuggestion,
  getPatientConditionSuggestions,
  getPatientConditions,
  updatePatientCondition,
  type PatientCondition,
  type PatientConditionSuggestion,
} from "@/lib/api";
import {
  COMMON_CHRONIC_CONDITIONS,
  conditionChipClass,
  conditionShortLabel,
} from "@/lib/chronicConditions";

interface ConditionChipsProps {
  patientId: string;
  /** Compact mode for patient list cards */
  compact?: boolean;
  /** Show add-condition UI expanded (edit mode) */
  editable?: boolean;
  className?: string;
}

export function ConditionChips({
  patientId,
  compact = false,
  editable = false,
  className,
}: ConditionChipsProps) {
  const [conditions, setConditions] = useState<PatientCondition[]>([]);
  const [suggestions, setSuggestions] = useState<PatientConditionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(editable);
  const [customName, setCustomName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [conds, suggs] = await Promise.all([
        getPatientConditions(patientId),
        getPatientConditionSuggestions(patientId),
      ]);
      setConditions(conds);
      setSuggestions(suggs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conditions.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (editable) setShowAdd(true);
  }, [editable]);

  const handleResolve = async (condition: PatientCondition) => {
    if (!window.confirm(`Mark "${condition.condition_name}" as resolved?`)) return;
    setError(null);
    try {
      await updatePatientCondition(patientId, condition.id, { status: "resolved" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update condition.");
    }
  };

  const handleAdd = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      await addPatientCondition(patientId, { condition_name: trimmed });
      setCustomName("");
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add condition.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSuggestion = async (suggestion: PatientConditionSuggestion) => {
    setError(null);
    try {
      await confirmConditionSuggestion(patientId, suggestion.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm suggestion.");
    }
  };

  const handleDismissSuggestion = async (suggestion: PatientConditionSuggestion) => {
    setError(null);
    try {
      await dismissConditionSuggestion(patientId, suggestion.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dismiss suggestion.");
    }
  };

  const existingNames = new Set(conditions.map((c) => c.condition_name.toLowerCase()));
  const availableCommon = COMMON_CHRONIC_CONDITIONS.filter(
    (c) => !existingNames.has(c.toLowerCase())
  );

  if (loading && conditions.length === 0 && suggestions.length === 0 && !editable) {
    return null;
  }

  return (
    <div className={clsx("space-y-1.5", className)} onClick={(e) => e.stopPropagation()}>
      {error && (
        <p className="text-[10px] text-negative">{error}</p>
      )}

      {suggestions.map((s) => (
        <div
          key={s.id}
          className="flex flex-wrap items-center gap-1.5 bg-yellow-50 border border-yellow-300 rounded-lg px-2 py-1"
        >
          <span className="text-[10px] font-semibold text-yellow-900">
            Suggested: {s.condition_name} — Confirm?
          </span>
          <button
            type="button"
            onClick={() => handleConfirmSuggestion(s)}
            className="text-[10px] font-bold text-positive hover:underline"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => handleDismissSuggestion(s)}
            className="text-[10px] font-semibold text-mute hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-1">
        {conditions.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleResolve(c)}
            title={`Tap to mark "${c.condition_name}" resolved`}
            className={clsx(
              "inline-flex items-center rounded-pill border font-semibold transition-opacity hover:opacity-80",
              conditionChipClass(c.condition_name),
              compact ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
            )}
          >
            {compact ? conditionShortLabel(c.condition_name) : c.condition_name}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className={clsx(
            "inline-flex items-center justify-center rounded-pill border border-dashed border-ink/25 text-mute hover:text-ink hover:border-green/50 font-bold",
            compact ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm"
          )}
          aria-label="Add condition"
        >
          +
        </button>
      </div>

      {showAdd && (
        <div className="bg-canvas-soft border border-ink/10 rounded-lg p-2 space-y-2">
          <p className="text-[10px] font-semibold text-mute uppercase tracking-wide">
            Add condition
          </p>
          <div className="flex flex-wrap gap-1">
            {availableCommon.map((name) => (
              <button
                key={name}
                type="button"
                disabled={saving}
                onClick={() => handleAdd(name)}
                className={clsx(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-pill border",
                  conditionChipClass(name),
                  "hover:opacity-80 disabled:opacity-50"
                )}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Other condition…"
              className="flex-1 text-xs border border-ink/15 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd(customName);
              }}
            />
            <button
              type="button"
              disabled={saving || !customName.trim()}
              onClick={() => handleAdd(customName)}
              className="text-xs font-semibold px-2 py-1 rounded-md bg-green text-ink disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
