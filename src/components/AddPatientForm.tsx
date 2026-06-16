"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { createPatient } from "@/lib/api";
import { useSaveFeedback, useUnsavedChanges } from "@/lib/save-feedback";
import { normalizePhone, validatePhone } from "@/lib/profile-constants";

const inputClass =
  "w-full bg-canvas border border-ink/15 rounded-md px-4 py-3 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition";

interface AddPatientFormProps {
  onSuccess?: (patientId: string) => void;
  redirectToDetail?: boolean;
  className?: string;
}

export function AddPatientForm({
  onSuccess,
  redirectToDetail = true,
  className,
}: AddPatientFormProps) {
  const router = useRouter();
  const { notifySaved } = useSaveFeedback();
  const [form, setForm] = useState({
    name: "",
    age: "",
    phone: "",
    sex: "" as "" | "M" | "F" | "O",
    abha_id: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formDirty = Boolean(
    form.name.trim() || form.age || form.phone.trim() || form.abha_id.trim() || form.sex
  );
  useUnsavedChanges(formDirty && !creating);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setCreating(true);
    try {
      const patient = await createPatient({
        name: form.name.trim(),
        age,
        phone: normalizePhone(form.phone),
        sex: form.sex || "M",
        abha_id: form.abha_id.trim() || undefined,
      });
      onSuccess?.(patient.id);
      notifySaved("Patient created");
      if (redirectToDetail) {
        router.push(`/patients/${patient.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create patient.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={clsx("space-y-4", className)}>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-body">Full name *</span>
        <input
          type="text"
          placeholder="Patient full name"
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
            placeholder="Age"
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
            placeholder="10-digit mobile"
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
          placeholder="Ayushman Bharat Health Account ID"
          value={form.abha_id}
          onChange={(e) => setForm({ ...form, abha_id: e.target.value })}
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
        disabled={creating}
        className="w-full bg-green text-ink font-semibold rounded-xl px-6 py-3 text-sm hover:bg-green-hover disabled:opacity-50 transition-colors"
      >
        {creating ? "Registering patient…" : "Register patient"}
      </button>
    </form>
  );
}
