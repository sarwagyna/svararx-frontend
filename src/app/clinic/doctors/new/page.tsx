"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { ClinicAppShell } from "@/components/ClinicAppShell";
import { PageContent } from "@/components/PageContent";
import { createClinicDoctor } from "@/lib/api";
import { SPECIALIZATIONS } from "@/lib/profile-constants";

const inputClass =
  "w-full bg-canvas border border-ink/15 rounded-md px-4 py-3 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition";

function AddDoctorContent() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    qualifications: "",
    mci_reg_number: "",
    state_council_reg: "",
    specialization: "General Physician",
    approval_pin: "",
    role: "doctor" as "doctor" | "compounder",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.approval_pin.length !== 4) {
      setError("Enter a 4-digit approval PIN for this doctor.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createClinicDoctor({
        full_name: form.full_name.trim(),
        qualifications: form.qualifications.trim(),
        mci_reg_number: form.mci_reg_number.trim(),
        state_council_reg: form.state_council_reg.trim() || undefined,
        specialization: form.specialization.trim(),
        approval_pin: form.approval_pin,
        role: form.role,
      });
      router.replace("/clinic");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add doctor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ClinicAppShell>
      <PageContent size="narrow" className="pb-16">
        <h1 className="text-2xl font-bold text-ink mb-2">Add doctor</h1>
        <p className="text-sm text-body mb-6">
          Create a doctor profile for your clinic. They will use their PIN on the clinic
          dashboard to open their workspace.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-negative/10 border border-negative/30 text-negative text-sm px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-canvas rounded-xl border border-ink/10 p-6 shadow-sm">
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Full name</span>
            <input
              className={inputClass}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Qualifications</span>
            <input
              className={inputClass}
              placeholder="MBBS, MD"
              value={form.qualifications}
              onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">MCI registration number</span>
            <input
              className={inputClass}
              value={form.mci_reg_number}
              onChange={(e) => setForm({ ...form, mci_reg_number: e.target.value })}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">State council reg. (optional)</span>
            <input
              className={inputClass}
              value={form.state_council_reg}
              onChange={(e) => setForm({ ...form, state_council_reg: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Specialization</span>
            <select
              className={inputClass}
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            >
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Role</span>
            <select
              className={inputClass}
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as "doctor" | "compounder" })
              }
            >
              <option value="doctor">Doctor</option>
              <option value="compounder">Compounder / staff</option>
            </select>
          </label>
          <div className="bg-canvas-soft rounded-xl p-4 border border-ink/10">
            <p className="text-sm font-semibold text-ink mb-1">Approval PIN</p>
            <p className="text-xs text-body mb-2">
              4-digit PIN this doctor uses to open their workspace from the clinic dashboard.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={form.approval_pin}
              onChange={(e) =>
                setForm({
                  ...form,
                  approval_pin: e.target.value.replace(/\D/g, "").slice(0, 4),
                })
              }
              className="w-full text-center text-2xl tracking-[0.4em] font-bold border border-ink/20 rounded-lg py-3"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/clinic")}
              className="flex-1 border border-ink/30 text-ink font-semibold rounded-xl px-6 py-3 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] bg-green text-ink font-semibold rounded-xl px-6 py-3 text-sm hover:bg-green-hover disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Add doctor →"}
            </button>
          </div>
        </form>
      </PageContent>
    </ClinicAppShell>
  );
}

export default function AddClinicDoctorPage() {
  return (
    <OnboardingGuard>
      <AddDoctorContent />
    </OnboardingGuard>
  );
}
