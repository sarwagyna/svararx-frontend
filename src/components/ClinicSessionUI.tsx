"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";

interface PinApproveModalProps {
  open: boolean;
  doctorName: string;
  doctorId: string;
  prescriptionId?: string;
  onClose: () => void;
  onVerified: (approvalToken: string, doctorId: string) => void;
}

export function PinApproveModal({
  open,
  doctorName,
  doctorId,
  prescriptionId,
  onClose,
  onVerified,
}: PinApproveModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setPin("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const submit = useCallback(async () => {
    if (pin.length !== 4) {
      setError("Enter the 4-digit PIN.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { verifyDoctorPin } = await import("@/lib/api");
      const result = await verifyDoctorPin(doctorId, pin, prescriptionId);
      onVerified(result.approval_token, result.doctor_id);
      setPin("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect PIN.");
    } finally {
      setLoading(false);
    }
  }, [doctorId, onClose, onVerified, pin, prescriptionId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-4">
      <div
        className="w-full max-w-sm bg-canvas rounded-2xl shadow-xl p-6"
        role="dialog"
        aria-labelledby="pin-approve-title"
      >
        <h2 id="pin-approve-title" className="text-lg font-bold text-ink mb-1">
          Doctor approval
        </h2>
        <p className="text-sm text-body mb-5">
          {doctorName} — enter 4-digit PIN to approve this prescription only.
        </p>

        {error && (
          <p className="text-sm text-negative mb-3">{error}</p>
        )}

        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="••••"
          className="w-full text-center text-3xl tracking-[0.5em] font-black border border-ink/20 rounded-xl py-4 mb-4 focus:outline-none focus:ring-2 focus:ring-green/50"
          aria-label="Doctor PIN"
        />

        <button
          type="button"
          disabled={loading || pin.length !== 4}
          onClick={submit}
          className="w-full bg-green text-ink font-semibold rounded-xl py-3 mb-2 disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Unlock approve"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full text-sm text-body underline underline-offset-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Inline PIN pad for doctor selection (multi-doctor prescribe session). */
export function PinEntry({
  doctorName,
  onSubmit,
  onCancel,
  loading,
  error,
  submitLabel = "Continue to prescribe →",
}: {
  doctorName: string;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
}) {
  const [pin, setPin] = useState("");

  return (
    <div className="mx-auto w-full max-w-md bg-canvas rounded-2xl border border-ink/10 p-6 lg:p-8 shadow-sm">
      <h2 className="text-xl font-bold text-ink mb-1">{doctorName}</h2>
      <p className="text-sm text-body mb-4">Enter your 4-digit PIN to open the doctor workspace.</p>
      {error && <p className="text-sm text-negative mb-3">{error}</p>}
      <div className="flex flex-col items-center gap-4">
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="w-full max-w-[12rem] text-center text-3xl tracking-[0.5em] font-black border border-ink/20 rounded-xl py-4"
          autoFocus
        />
        <button
          type="button"
          disabled={loading || pin.length !== 4}
          onClick={() => onSubmit(pin)}
          className="w-full max-w-xs bg-green text-ink font-semibold rounded-xl py-3 disabled:opacity-50"
        >
          {loading ? "Verifying…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-body underline">
          ← Choose another doctor
        </button>
      </div>
    </div>
  );
}

export function DoctorCard({
  doctor,
  selected,
  onSelect,
}: {
  doctor: { id: string; name: string; speciality: string; has_pin: boolean };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "w-full text-left rounded-xl p-4 border-2 transition-colors",
        selected ? "border-green bg-green-pale/30" : "border-ink/10 bg-canvas hover:border-ink/30"
      )}
    >
      <p className="font-bold text-ink">{doctor.name}</p>
      <p className="text-sm text-body">{doctor.speciality}</p>
      {!doctor.has_pin && (
        <p className="text-xs text-warning-content mt-1">PIN not set — ask doctor to complete setup</p>
      )}
    </button>
  );
}
