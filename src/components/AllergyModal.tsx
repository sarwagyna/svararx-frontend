"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  addPatientAllergy,
  deletePatientAllergy,
  getPatientAllergies,
  type PatientAllergy,
  type PatientAllergyCreate,
} from "@/lib/api";

const SEVERITY_OPTIONS = [
  { value: "unknown", label: "Unknown" },
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
] as const;

interface AllergyModalProps {
  patientId: string;
  patientName: string;
  open: boolean;
  onClose: () => void;
  onUpdated?: (count: number) => void;
}

export function AllergyModal({
  patientId,
  patientName,
  open,
  onClose,
  onUpdated,
}: AllergyModalProps) {
  const [allergies, setAllergies] = useState<PatientAllergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PatientAllergyCreate>({
    drug_name: "",
    reaction: "",
    severity: "unknown",
  });

  const loadAllergies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPatientAllergies(patientId);
      setAllergies(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load allergies.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!open) return;
    void loadAllergies();
  }, [open, patientId, loadAllergies]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.drug_name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await addPatientAllergy(patientId, {
        drug_name: form.drug_name.trim(),
        reaction: form.reaction?.trim() || undefined,
        severity: form.severity,
      });
      setForm({ drug_name: "", reaction: "", severity: "unknown" });
      const data = await loadAllergies();
      onUpdated?.(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add allergy.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (allergyId: string) => {
    setError(null);
    try {
      await deletePatientAllergy(patientId, allergyId);
      const data = await loadAllergies();
      onUpdated?.(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove allergy.");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-canvas rounded-xl w-full max-w-md p-5 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-black text-lg text-ink">Allergies</h2>
            <p className="text-sm text-mute">{patientName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-mute hover:text-ink text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <p className="text-xs text-negative bg-negative/10 rounded-lg px-3 py-2">{error}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
          </div>
        ) : allergies.length === 0 ? (
          <p className="text-sm text-mute">No allergies recorded.</p>
        ) : (
          <ul className="space-y-2">
            {allergies.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-2 bg-canvas-soft rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-ink">{a.drug_name}</p>
                  {a.drug_generic && a.drug_generic !== a.drug_name && (
                    <p className="text-xs text-mute">{a.drug_generic}</p>
                  )}
                  {a.reaction && (
                    <p className="text-xs text-negative mt-0.5">{a.reaction}</p>
                  )}
                  <p className="text-xs text-mute capitalize">{a.severity}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(a.id)}
                  className="text-mute hover:text-negative text-lg flex-shrink-0"
                  aria-label={`Remove ${a.drug_name} allergy`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="space-y-3 border-t border-ink/10 pt-4">
          <p className="text-xs font-semibold text-mute uppercase tracking-wide">Add allergy</p>
          <input
            type="text"
            value={form.drug_name}
            onChange={(e) => setForm({ ...form, drug_name: e.target.value })}
            placeholder="Drug name (e.g. Penicillin)"
            className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-positive"
            required
          />
          <input
            type="text"
            value={form.reaction ?? ""}
            onChange={(e) => setForm({ ...form, reaction: e.target.value })}
            placeholder="Reaction (optional, e.g. rash)"
            className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-positive"
          />
          <select
            value={form.severity ?? "unknown"}
            onChange={(e) =>
              setForm({
                ...form,
                severity: e.target.value as PatientAllergyCreate["severity"],
              })
            }
            className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-positive"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving || !form.drug_name.trim()}
            className={clsx(
              "w-full py-2.5 rounded-xl font-semibold text-sm",
              saving || !form.drug_name.trim()
                ? "bg-canvas-soft text-mute cursor-not-allowed"
                : "bg-green text-ink hover:bg-green-hover"
            )}
          >
            {saving ? "Adding…" : "Add allergy"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AllergyBadge({
  count,
  onClick,
}: {
  count: number;
  onClick: (e: React.MouseEvent) => void;
}) {
  if (count <= 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-bold text-negative bg-negative/10 border border-negative/30 rounded-pill px-2 py-0.5 hover:bg-negative/20 transition-colors flex-shrink-0"
    >
      ⚠ {count} {count === 1 ? "Allergy" : "Allergies"}
    </button>
  );
}
