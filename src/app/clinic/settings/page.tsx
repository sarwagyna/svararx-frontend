"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { ClinicAppShell } from "@/components/ClinicAppShell";
import { PageContent } from "@/components/PageContent";
import { getClinicSettings, updateClinicSettings } from "@/lib/api";
import { INDIAN_STATES, normalizePhone, validatePhone } from "@/lib/profile-constants";

const inputClass =
  "w-full bg-canvas border border-ink/15 rounded-md px-4 py-3 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition";

function ClinicSettingsContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [form, setForm] = useState({
    clinic_name: "",
    clinic_address: "",
    clinic_address_line2: "",
    clinic_city: "",
    clinic_state: "Andhra Pradesh",
    clinic_pin: "",
    clinic_phone: "",
  });

  useEffect(() => {
    getClinicSettings()
      .then((s) => {
        setPlan(s.plan);
        setForm({
          clinic_name: s.clinic_name,
          clinic_address: s.clinic_address,
          clinic_address_line2: s.clinic_address_line2,
          clinic_city: s.clinic_city,
          clinic_state: s.clinic_state || "Andhra Pradesh",
          clinic_pin: s.clinic_pin,
          clinic_phone: s.clinic_phone,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneErr = validatePhone(form.clinic_phone);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateClinicSettings({
        ...form,
        clinic_phone: form.clinic_phone.trim() ? normalizePhone(form.clinic_phone) : "",
      });
      setSuccess("Clinic settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ClinicAppShell>
        <PageContent>
          <p className="text-body py-8">Loading…</p>
        </PageContent>
      </ClinicAppShell>
    );
  }

  return (
    <ClinicAppShell>
      <PageContent size="narrow" className="pb-16 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Clinic management</h1>
          <p className="text-sm text-body mt-1">
            Configure clinic details shown on prescriptions and the clinic dashboard.
          </p>
          <p className="text-xs text-mute mt-2">Current plan: {plan}</p>
        </div>

        {error && (
          <div className="rounded-md bg-negative/10 border border-negative/30 text-negative text-sm px-4 py-3">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-pale border border-green/30 text-positive-deep text-sm px-4 py-3">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="space-y-4 bg-canvas rounded-xl border border-ink/10 p-6 shadow-sm"
        >
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Clinic name</span>
            <input
              className={inputClass}
              value={form.clinic_name}
              onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Address line 1</span>
            <textarea
              className={inputClass}
              rows={2}
              value={form.clinic_address}
              onChange={(e) => setForm({ ...form, clinic_address: e.target.value })}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Address line 2 (optional)</span>
            <input
              className={inputClass}
              value={form.clinic_address_line2}
              onChange={(e) => setForm({ ...form, clinic_address_line2: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-body">City</span>
              <input
                className={inputClass}
                value={form.clinic_city}
                onChange={(e) => setForm({ ...form, clinic_city: e.target.value })}
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-body">PIN code</span>
              <input
                className={inputClass}
                value={form.clinic_pin}
                onChange={(e) => setForm({ ...form, clinic_pin: e.target.value })}
                required
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">State</span>
            <select
              className={inputClass}
              value={form.clinic_state}
              onChange={(e) => setForm({ ...form, clinic_state: e.target.value })}
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Phone (10 digits)</span>
            <input
              className={inputClass}
              inputMode="numeric"
              value={form.clinic_phone}
              onChange={(e) => setForm({ ...form, clinic_phone: e.target.value })}
            />
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/clinic")}
              className="flex-1 border border-ink/30 text-ink font-semibold rounded-xl px-6 py-3 text-sm"
            >
              ← Dashboard
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] bg-green text-ink font-semibold rounded-xl px-6 py-3 text-sm hover:bg-green-hover disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
      </PageContent>
    </ClinicAppShell>
  );
}

export default function ClinicSettingsPage() {
  return (
    <OnboardingGuard>
      <ClinicSettingsContent />
    </OnboardingGuard>
  );
}
