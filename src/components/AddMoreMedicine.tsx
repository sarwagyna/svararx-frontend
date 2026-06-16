"use client";

import { useCallback, useState } from "react";
import { clsx } from "clsx";
import { VoiceCapture } from "@/components/VoiceCapture";
import {
  structureTranscription,
  transcribeVoiceRecording,
  type StructuredPrescription,
} from "@/lib/api";

const ADD_MORE_STRUCTURE_PROMPT =
  "The doctor is adding more medications to an existing prescription. " +
  "Extract ONLY the new medication(s) from this dictation. " +
  "Leave diagnosis, advice, and follow_up as empty strings unless explicitly stated for the new drugs.\n\n";

export function mergeAddedMedications(
  existing: StructuredPrescription,
  addition: StructuredPrescription
): StructuredPrescription {
  const kept = existing.medications.filter((m) => m.drug_name.trim());
  const added = addition.medications.filter((m) => m.drug_name.trim());
  return {
    ...existing,
    medications: [...kept, ...added],
    diagnosis: existing.diagnosis || addition.diagnosis,
    advice:
      existing.advice && addition.advice
        ? `${existing.advice}; ${addition.advice}`
        : existing.advice || addition.advice,
    follow_up: existing.follow_up || addition.follow_up,
  };
}

interface AddMoreMedicineProps {
  patientId?: string;
  onMerged: (addition: StructuredPrescription, addedTranscription: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function AddMoreMedicine({
  patientId,
  onMerged,
  onError,
  disabled = false,
}: AddMoreMedicineProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"voice" | "type">("voice");
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);

  const structureAddition = useCallback(
    async (transcript: string) => {
      const trimmed = transcript.trim();
      if (!trimmed) {
        throw new Error("No dictation text to add.");
      }

      const result = await structureTranscription(
        ADD_MORE_STRUCTURE_PROMPT + trimmed,
        patientId
      );

      const newMeds = result.structured.medications.filter((m) =>
        m.drug_name.trim()
      );
      if (newMeds.length === 0) {
        throw new Error("No medications found — try again or type manually.");
      }

      return { structured: result.structured, transcript: trimmed };
    },
    [patientId]
  );

  const handleVoiceCaptured = useCallback(
    async ({
      recordingId,
    }: {
      blob: Blob;
      recordingId: string;
      durationSeconds: number;
    }) => {
      setProcessing(true);
      try {
        const stt = await transcribeVoiceRecording(recordingId);
        const { structured, transcript } = await structureAddition(stt.transcript);
        onMerged(structured, transcript);
        setOpen(false);
        setText("");
      } catch (err) {
        onError(
          err instanceof Error ? err.message : "Could not add medications."
        );
      } finally {
        setProcessing(false);
      }
    },
    [onError, onMerged, structureAddition]
  );

  const handleTypeSubmit = async () => {
    setProcessing(true);
    try {
      const { structured, transcript } = await structureAddition(text);
      onMerged(structured, transcript);
      setOpen(false);
      setText("");
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Could not add medications."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-xl border border-positive/30 bg-positive/5 overflow-hidden">
      <button
        type="button"
        disabled={disabled || processing}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-positive/10 transition-colors disabled:opacity-50"
      >
        <span className="text-sm font-semibold text-positive-deep">
          + Add more medicine
        </span>
        <span className="text-xs text-body">{open ? "Hide" : "Voice or type"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-positive/20">
          <p className="text-xs text-body pt-3">
            Dictate or type only the additional drug(s). Existing medications stay
            on the list.
          </p>

          <div className="flex gap-2">
            {(["voice", "type"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMode(tab)}
                className={clsx(
                  "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
                  mode === tab
                    ? "bg-green text-ink"
                    : "bg-canvas-soft text-body hover:text-ink"
                )}
              >
                {tab === "voice" ? "🎙 Voice" : "⌨ Type"}
              </button>
            ))}
          </div>

          {processing && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-body">
              <div className="w-5 h-5 border-2 border-green-pale border-t-positive rounded-full animate-spin" />
              Adding medications…
            </div>
          )}

          {!processing && mode === "voice" && (
            <VoiceCapture onCaptured={handleVoiceCaptured} onError={onError} />
          )}

          {!processing && mode === "type" && (
            <div className="space-y-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Also add Azithromycin 500mg OD for 3 days before food"
                rows={3}
                className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-positive resize-none"
              />
              <button
                type="button"
                onClick={handleTypeSubmit}
                disabled={!text.trim()}
                className="w-full bg-green text-ink font-semibold rounded-xl py-2.5 text-sm hover:bg-green-hover disabled:opacity-50"
              >
                Add to prescription →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
