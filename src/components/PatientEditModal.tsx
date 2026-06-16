"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  addPatientAllergy,
  deletePatientAllergy,
  getPatientAllergies,
  updatePatient,
  type Patient,
  type PatientAllergy,
  type PatientAllergyCreate,
} from "@/lib/api";
import { useSaveFeedback, useUnsavedChanges } from "@/lib/save-feedback";
import { normalizePhone, validatePhone } from "@/lib/profile-constants";
import { ConditionChips } from "@/components/ConditionChips";

const inputClass =
  "w-full bg-canvas border border-ink/15 rounded-md px-4 py-3 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition";

const SEVERITY_OPTIONS = [
  { value: "unknown", label: "Unknown" },
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
] as const;

function normalizeSex(sex: string): "" | "M" | "F" | "O" {
  if (sex === "M" || sex === "F" || sex === "O") return sex;
  if (sex === "Other") return "O";
  return "";
}

interface PatientEditModalProps {
  patient: Patient;
  open: boolean;
  onClose: () => void;
  onSaved: (patient: Patient) => void;
  onAllergiesUpdated?: (count: number) => void;
}

export function PatientEditModal({
  patient,
  open,
  onClose,
  onSaved,
  onAllergiesUpdated,
}: PatientEditModalProps) {
  const { notifySaved, confirmIfDirty } = useSaveFeedback();
  const [form, setForm] = useState({
    name: patient.name,
    age: String(patient.age),
    phone: patient.phone ?? "",
    sex: normalizeSex(patient.sex),
    abha_id: patient.abha_id ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allergies, setAllergies] = useState<PatientAllergy[]>([]);
  const [allergiesLoading, setAllergiesLoading] = useState(true);
  const [allergySaving, setAllergySaving] = useState(false);
  const [allergyError, setAllergyError] = useState<string | null>(null);
  const [allergyForm, setAllergyForm] = useState<PatientAllergyCreate>({
    drug_name: "",
    reaction: "",
    severity: "unknown",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: patient.name,
      age: String(patient.age),
      phone: patient.phone ?? "",
      sex: normalizeSex(patient.sex),
      abha_id: patient.abha_id ?? "",
    });
    setError(null);
    setAllergyError(null);
    setAllergyForm({ drug_name: "", reaction: "", severity: "unknown" });
  }, [open, patient]);

  const loadAllergies = useCallback(async () => {
    setAllergiesLoading(true);
    setAllergyError(null);
    try {
      const data = await getPatientAllergies(patient.id);
      setAllergies(data);
      return data;
    } catch (err) {
      setAllergyError(err instanceof Error ? err.message : "Failed to load allergies.");
      return [];
    } finally {
      setAllergiesLoading(false);
    }
  }, [patient.id]);

  useEffect(() => {
    if (!open) return;
    void loadAllergies();
  }, [open, patient.id, loadAllergies]);

  const profileDirty = useMemo(() => {
    if (!open) return false;
    return (
      form.name !== patient.name ||
      form.age !== String(patient.age) ||
      (form.phone ?? "") !== (patient.phone ?? "") ||
      form.sex !== normalizeSex(patient.sex) ||
      (form.abha_id ?? "") !== (patient.abha_id ?? "")
    );
  }, [open, form, patient]);

  const allergyDraftDirty = open && Boolean(allergyForm.drug_name.trim());
  useUnsavedChanges(profileDirty || allergyDraftDirty);

  const handleClose = () => confirmIfDirty(onClose);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    const age = parseInt(form.age, 10);
    if (!age || age < 1 || age > 119) {
      setError("Enter a valid age (1–119).");
      return;
    }

    setSaving(true);
    try {
      const updated = await updatePatient(patient.id, {
        name: form.name.trim(),
        age,
        phone: normalizePhone(form.phone),
        sex: form.sex || "M",
        abha_id: form.abha_id.trim() || undefined,
      });
      onSaved(updated);
      notifySaved("Patient profile saved");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save patient.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allergyForm.drug_name.trim()) return;
    setAllergySaving(true);
    setAllergyError(null);
    try {
      await addPatientAllergy(patient.id, {
        drug_name: allergyForm.drug_name.trim(),
        reaction: allergyForm.reaction?.trim() || undefined,
        severity: allergyForm.severity,
      });
      setAllergyForm({ drug_name: "", reaction: "", severity: "unknown" });
      const data = await loadAllergies();
      onAllergiesUpdated?.(data.length);
      notifySaved("Allergy added");
    } catch (err) {
      setAllergyError(err instanceof Error ? err.message : "Failed to add allergy.");
    } finally {
      setAllergySaving(false);
    }
  };

  const handleRemoveAllergy = async (allergyId: string) => {
    setAllergyError(null);
    try {
      await deletePatientAllergy(patient.id, allergyId);
      const data = await loadAllergies();
      onAllergiesUpdated?.(data.length);
    } catch (err) {
      setAllergyError(err instanceof Error ? err.message : "Failed to remove allergy.");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="bg-canvas rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-canvas border-b border-ink/10 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-black text-lg text-ink">Edit patient</h2>
            <p className="text-sm text-mute">Update profile, allergies, and conditions</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-mute hover:text-ink text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <p className="text-xs font-semibold text-mute uppercase tracking-wide">Profile</p>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-body">Full name *</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className={inputClass}
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-body">Age *</span>
                <input
                  type="number"
                  min={1}
                  max={119}
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  required
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-body">Phone *</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className={inputClass}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-semibold text-body">Gender</span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "M", label: "Male" },
                    { value: "F", label: "Female" },
                    { value: "O", label: "Other" },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, sex: form.sex === value ? "" : value })
                    }
                    className={clsx(
                      "rounded-pill px-4 py-2 text-sm font-semibold border transition-colors",
                      form.sex === value
                        ? "bg-green border-green text-ink"
                        : "border-ink/15 text-body hover:border-ink/30"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-body">
                ABHA ID <span className="text-mute font-normal">(optional)</span>
              </span>
              <input
                type="text"
                value={form.abha_id}
                onChange={(e) => setForm({ ...form, abha_id: e.target.value })}
                placeholder="Ayushman Bharat Health Account ID"
                className={inputClass}
              />
            </label>

            {error && (
              <p className="text-sm text-negative bg-negative/10 border border-negative/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-green text-ink font-semibold rounded-xl px-6 py-3 text-sm hover:bg-green-hover disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving profile…" : "Save profile"}
            </button>
          </form>

          <section className="space-y-3 border-t border-ink/10 pt-6">
            <p className="text-xs font-semibold text-mute uppercase tracking-wide">
              Drug allergies
            </p>

            {allergyError && (
              <p className="text-xs text-negative bg-negative/10 rounded-lg px-3 py-2">
                {allergyError}
              </p>
            )}

            {allergiesLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
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
                      {a.reaction && (
                        <p className="text-xs text-negative mt-0.5">{a.reaction}</p>
                      )}
                      <p className="text-xs text-mute capitalize">{a.severity}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(a.id)}
                      className="text-mute hover:text-negative text-lg flex-shrink-0"
                      aria-label={`Remove ${a.drug_name} allergy`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleAddAllergy} className="space-y-2">
              <input
                type="text"
                value={allergyForm.drug_name}
                onChange={(e) =>
                  setAllergyForm({ ...allergyForm, drug_name: e.target.value })
                }
                placeholder="Drug name (e.g. Penicillin)"
                className={inputClass}
                required
              />
              <input
                type="text"
                value={allergyForm.reaction ?? ""}
                onChange={(e) =>
                  setAllergyForm({ ...allergyForm, reaction: e.target.value })
                }
                placeholder="Reaction (optional)"
                className={inputClass}
              />
              <select
                value={allergyForm.severity ?? "unknown"}
                onChange={(e) =>
                  setAllergyForm({
                    ...allergyForm,
                    severity: e.target.value as PatientAllergyCreate["severity"],
                  })
                }
                className={inputClass}
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={allergySaving || !allergyForm.drug_name.trim()}
                className="w-full border border-ink/15 text-ink font-semibold rounded-xl px-4 py-2.5 text-sm hover:border-green disabled:opacity-50 transition-colors"
              >
                {allergySaving ? "Adding…" : "Add allergy"}
              </button>
            </form>
          </section>

          <section className="space-y-3 border-t border-ink/10 pt-6">
            <p className="text-xs font-semibold text-mute uppercase tracking-wide">
              Chronic conditions
            </p>
            <p className="text-xs text-mute">
              Tap a condition to mark resolved, or add new ones below.
            </p>
            <ConditionChips patientId={patient.id} editable />
          </section>
        </div>
      </div>
    </div>
  );
}
