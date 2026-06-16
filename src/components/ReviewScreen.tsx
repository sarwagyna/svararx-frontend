"use client";
/**
 * ReviewScreen — editable prescription review form.
 * Doctor reviews AI-structured prescription, edits inline, then approves.
 * Ctrl+Enter to approve. Amber highlight for flagged/blank mandatory fields.
 * Red allergy warnings require explicit acknowledgment before PDF generation.
 */
import { AddMoreMedicine, mergeAddedMedications } from "@/components/AddMoreMedicine";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { clsx } from "clsx";
import { useUnsavedChanges } from "@/lib/save-feedback";
import type {
  StructuredPrescription,
  MedicationItem,
  Patient,
  AllergyAcknowledgment,
} from "@/lib/api";

interface ReviewScreenProps {
  structured: StructuredPrescription;
  patient: Patient;
  transcription: string;
  patientId?: string;
  onApprove: (
    structured: StructuredPrescription,
    allergyAcknowledgments?: AllergyAcknowledgment[]
  ) => void;
  onReDictate: () => void;
  onStructuredChange?: (structured: StructuredPrescription) => void;
  onTranscriptionAppend?: (text: string) => void;
  isApproving: boolean;
}

import { FREQUENCY_OPTIONS } from "@/lib/frequencies";

function isAllergyFlag(med: MedicationItem): boolean {
  return Boolean(med.allergy_drug || med.allergy_warning);
}

function MedRow({
  med,
  index,
  onChange,
  onRemove,
}: {
  med: MedicationItem;
  index: number;
  onChange: (updated: MedicationItem) => void;
  onRemove: () => void;
}) {
  const isDosageMissing = !med.dosage.trim();
  const isDrugNameMissing = !med.drug_name.trim();
  const allergyFlag = isAllergyFlag(med);

  return (
    <div
      className={clsx(
        "rounded-xl p-3 border transition-colors",
        allergyFlag
          ? "border-negative bg-negative/10"
          : med.flagged || isDrugNameMissing
          ? "border-warning bg-warning/10"
          : isDosageMissing
          ? "border-warning/50 bg-warning/5"
          : "border-transparent bg-canvas-soft"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-xs font-bold text-mute mt-2.5 w-5 flex-shrink-0">
          {index + 1}.
        </span>
        <div className="flex-1 space-y-2">
          <div>
            <input
              type="text"
              value={med.drug_name}
              onChange={(e) =>
                onChange({ ...med, drug_name: e.target.value.toUpperCase() })
              }
              placeholder="DRUG NAME *"
              className={clsx(
                "w-full font-black text-sm uppercase tracking-wide",
                "bg-transparent border-b pb-0.5 focus:outline-none",
                allergyFlag || isDrugNameMissing
                  ? "border-negative text-negative placeholder-negative/60"
                  : "border-ink/20 text-ink focus:border-positive"
              )}
            />
            {allergyFlag && (
              <p className="text-xs text-negative mt-0.5 font-semibold">
                ⚠ Allergy match — patient allergic to {med.allergy_drug}
                {med.allergy_warning ? ` (${med.allergy_warning})` : ""}
              </p>
            )}
            {med.flagged && !allergyFlag && (
              <p className="text-xs text-warning-content mt-0.5">
                ⚠ Drug name uncertain — please verify
                {med.correction_confidence != null &&
                  ` (${med.correction_confidence}% match)`}
              </p>
            )}
            {med.corrected_from && !med.flagged && (
              <p className="text-xs text-mute mt-0.5">
                Auto-corrected from &ldquo;{med.corrected_from}&rdquo;
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-mute font-semibold uppercase tracking-wide">
                Dosage
              </label>
              <input
                type="text"
                value={med.dosage}
                onChange={(e) => onChange({ ...med, dosage: e.target.value })}
                placeholder="e.g. 500mg"
                className={clsx(
                  "w-full text-sm bg-transparent border-b pb-0.5 focus:outline-none mt-0.5",
                  isDosageMissing
                    ? "border-warning/60 placeholder-warning-content/50"
                    : "border-ink/20 focus:border-positive"
                )}
              />
              {isDosageMissing && (
                <p className="text-xs text-warning-content mt-0.5">Not stated</p>
              )}
            </div>
            <div>
              <label className="text-xs text-mute font-semibold uppercase tracking-wide">
                Frequency
              </label>
              <select
                value={med.frequency}
                onChange={(e) => onChange({ ...med, frequency: e.target.value })}
                className="w-full text-sm bg-transparent border-b border-ink/20 pb-0.5 focus:outline-none mt-0.5 focus:border-positive"
              >
                {FREQUENCY_OPTIONS.map(({ value, label }) => (
                  <option key={value || "none"} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-mute font-semibold uppercase tracking-wide">
                Duration
              </label>
              <input
                type="text"
                value={med.duration}
                onChange={(e) => onChange({ ...med, duration: e.target.value })}
                placeholder="e.g. 5 days"
                className="w-full text-sm bg-transparent border-b border-ink/20 pb-0.5 focus:outline-none mt-0.5 focus:border-positive"
              />
            </div>
          </div>

          <input
            type="text"
            value={med.instruction}
            onChange={(e) => onChange({ ...med, instruction: e.target.value })}
            placeholder="Instruction (e.g. after food)"
            className="w-full text-xs text-body bg-transparent border-b border-ink/10 pb-0.5 focus:outline-none focus:border-positive"
          />
        </div>

        <button
          onClick={onRemove}
          aria-label="Remove medication"
          className="text-mute hover:text-negative mt-1 flex-shrink-0 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function ReviewScreen({
  structured: initialStructured,
  patient,
  transcription,
  patientId,
  onApprove,
  onReDictate,
  onStructuredChange,
  onTranscriptionAppend,
  isApproving,
}: ReviewScreenProps) {
  const [rx, setRx] = useState<StructuredPrescription>(initialStructured);
  const savedSnapshot = useRef(JSON.stringify(initialStructured));
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [addError, setAddError] = useState<string | null>(null);

  const isDirty = JSON.stringify(rx) !== savedSnapshot.current;
  useUnsavedChanges(isDirty && !isApproving);

  const updateRx = useCallback(
    (next: StructuredPrescription) => {
      setRx(next);
      onStructuredChange?.(next);
    },
    [onStructuredChange]
  );

  useEffect(() => {
    setRx(initialStructured);
    savedSnapshot.current = JSON.stringify(initialStructured);
    setAcknowledged(new Set());
  }, [initialStructured]);

  const handleAddMoreMerged = useCallback(
    (addition: StructuredPrescription, addedTranscription: string) => {
      const merged = mergeAddedMedications(rx, addition);
      updateRx(merged);
      onTranscriptionAppend?.(addedTranscription);
      setAddError(null);
    },
    [rx, updateRx, onTranscriptionAppend]
  );

  const allergyFlaggedMeds = useMemo(
    () => rx.medications.filter((m) => m.drug_name.trim() && isAllergyFlag(m)),
    [rx.medications]
  );

  const hasNamedDrug = rx.medications.some((m) => m.drug_name.trim());
  const hasFlaggedDrugs = rx.medications.some((m) => m.flagged && !isAllergyFlag(m));
  const hasMissingDosage = rx.medications.some(
    (m) => m.drug_name.trim() && !m.dosage.trim()
  );
  const allAllergiesAcknowledged =
    allergyFlaggedMeds.length === 0 ||
    allergyFlaggedMeds.every((m) => acknowledged.has(m.drug_name.toUpperCase()));

  const handleMedChange = useCallback((index: number, updated: MedicationItem) => {
    updateRx({
      ...rx,
      medications: rx.medications.map((m, i) => (i === index ? updated : m)),
    });
  }, [rx, updateRx]);

  const handleRemoveMed = useCallback((index: number) => {
    updateRx({
      ...rx,
      medications: rx.medications.filter((_, i) => i !== index),
    });
  }, [rx, updateRx]);

  const handleAddMed = () => {
    updateRx({
      ...rx,
      medications: [
        ...rx.medications,
        {
          drug_name: "",
          dosage: "",
          frequency: "OD",
          duration: "",
          instruction: "",
          corrected_from: null,
          correction_confidence: null,
          flagged: false,
        },
      ],
    });
  };

  const toggleAcknowledgment = (drugName: string) => {
    const key = drugName.toUpperCase();
    setAcknowledged((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleApproveClick = () => {
    const acknowledgments: AllergyAcknowledgment[] = allergyFlaggedMeds
      .filter((m) => acknowledged.has(m.drug_name.toUpperCase()))
      .map((m) => ({
        drug_name: m.drug_name,
        allergy_drug: m.allergy_drug ?? m.drug_name,
        reaction: m.allergy_warning ?? null,
      }));
    onApprove(rx, acknowledgments.length > 0 ? acknowledgments : undefined);
  };

  const canApprove = hasNamedDrug && allAllergiesAcknowledged && !isApproving;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (canApprove) handleApproveClick();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide">
              Reviewing for
            </p>
            <p className="font-black text-lg text-ink">
              {patient.name},{" "}
              <span className="font-normal text-body text-base">
                {patient.age}Y / {patient.sex}
              </span>
            </p>
          </div>
          <button
            onClick={onReDictate}
            className="text-xs font-semibold text-body hover:text-ink underline"
            title="Discard and record the full prescription again"
          >
            ↺ Start over
          </button>
        </div>

        <p className="text-sm text-body leading-6">
          Edit any AI-suggested prescription fields inline before approving.
          Corrections are applied immediately and included in the final PDF.
        </p>
      </div>

      {transcription && (
        <details className="text-xs text-mute">
          <summary className="cursor-pointer font-semibold hover:text-body">
            View transcription
          </summary>
          <p className="mt-1 bg-canvas-soft rounded-lg p-2 italic">
            &ldquo;{transcription}&rdquo;
          </p>
        </details>
      )}

      {rx.same_as_last_time && (
        <div className="bg-warning/10 border border-warning rounded-xl p-3 text-sm text-warning-content">
          ⚠ Doctor said &ldquo;same as last time&rdquo; — please fill in
          medications manually or select from history.
        </div>
      )}

      {allergyFlaggedMeds.map((med) => (
        <div
          key={med.drug_name}
          className="bg-negative/10 border border-negative/40 rounded-xl p-3 space-y-2"
        >
          <p className="text-sm font-semibold text-negative">
            ⚠ {med.drug_name} prescribed — patient allergic
            {med.allergy_warning ? ` (${med.allergy_warning})` : ""}
          </p>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged.has(med.drug_name.toUpperCase())}
              onChange={() => toggleAcknowledgment(med.drug_name)}
              className="rounded border-negative/50 text-negative focus:ring-negative"
            />
            I confirm this is intentional
          </label>
        </div>
      ))}

      <div>
        <label className="text-xs font-semibold text-mute uppercase tracking-wide">
          Diagnosis / Complaint
        </label>
        <input
          type="text"
          value={rx.diagnosis}
          onChange={(e) => updateRx({ ...rx, diagnosis: e.target.value })}
          placeholder="e.g. Type 2 Diabetes, Hypertension"
          className="w-full mt-1 border border-ink/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-positive"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-mute uppercase tracking-wide">
            Medications
          </label>
          {(hasFlaggedDrugs || hasMissingDosage) && (
            <span className="text-xs font-semibold text-warning-content bg-warning/10 px-2 py-0.5 rounded-pill">
              ⚠ Review highlighted fields
            </span>
          )}
        </div>

        <div className="space-y-2">
          {rx.medications.map((med, i) => (
            <MedRow
              key={i}
              med={med}
              index={i}
              onChange={(updated) => handleMedChange(i, updated)}
              onRemove={() => handleRemoveMed(i)}
            />
          ))}
        </div>

        <AddMoreMedicine
          patientId={patientId}
          onMerged={handleAddMoreMerged}
          onError={setAddError}
          disabled={isApproving}
        />
        {addError && (
          <p className="text-xs text-negative mt-2">{addError}</p>
        )}

        <button
          onClick={handleAddMed}
          className="mt-2 w-full border-2 border-dashed border-ink/15 rounded-xl py-2 text-sm text-mute hover:border-positive hover:text-positive transition-colors"
        >
          + Add medication
        </button>
      </div>

      <div>
        <label className="text-xs font-semibold text-mute uppercase tracking-wide">
          Advice
        </label>
        <textarea
          value={rx.advice}
          onChange={(e) => updateRx({ ...rx, advice: e.target.value })}
          placeholder="General advice…"
          rows={2}
          className="w-full mt-1 border border-ink/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-positive resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-mute uppercase tracking-wide">
          Follow-up
        </label>
        <input
          type="text"
          value={rx.follow_up}
          onChange={(e) => updateRx({ ...rx, follow_up: e.target.value })}
          placeholder="e.g. Review after 2 weeks"
          className="w-full mt-1 border border-ink/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-positive"
        />
      </div>

      <button
        onClick={handleApproveClick}
        disabled={!canApprove}
        aria-label="Approve prescription (Ctrl+Enter)"
        className={clsx(
          "w-full py-3.5 rounded-xl font-bold text-base transition-all",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-green focus-visible:ring-offset-2",
          canApprove
            ? "bg-green text-ink hover:bg-green-hover active:scale-[0.99]"
            : "bg-canvas-soft text-mute cursor-not-allowed"
        )}
      >
        {isApproving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Generating PDF…
          </span>
        ) : (
          <>
            ✓ Approve &amp; Print{" "}
            <span className="text-xs font-normal opacity-60 ml-1">Ctrl+Enter</span>
          </>
        )}
      </button>

      {!hasNamedDrug && (
        <p className="text-xs text-mute text-center">
          Add at least one medication to approve.
        </p>
      )}
      {hasNamedDrug && !allAllergiesAcknowledged && (
        <p className="text-xs text-negative text-center">
          Acknowledge all allergy warnings before approving.
        </p>
      )}
    </div>
  );
}
