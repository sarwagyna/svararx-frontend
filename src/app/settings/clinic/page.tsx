"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { AppShell } from "@/components/AppShell";
import { PageContent, PageHeader } from "@/components/PageContent";
import { SettingsTiles } from "@/components/SettingsTiles";
import {
  getDoctorProfile,
  setDoctorPin,
  upgradeToClinic,
  type DoctorMeProfile,
} from "@/lib/api";
import {
  INDIAN_STATES,
  normalizePhone,
  validatePhone,
} from "@/lib/profile-constants";

const inputClass =
  "w-full bg-canvas border border-ink/15 rounded-md px-4 py-3 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition";

function isPlaceholder(value: string | null | undefined): boolean {
  const v = (value || "").trim();
  return !v || v === "—" || v === "-" || v === "000000";
}

export default function ClinicTeamSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<DoctorMeProfile | null>(null);

  const [clinic, setClinic] = useState({
    clinic_name: "",
    clinic_address: "",
    clinic_city: "",
    clinic_state: "Andhra Pradesh",
    clinic_pin: "",
    clinic_phone: "",
  });
  const [approvalPin, setApprovalPin] = useState("");
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const p = await getDoctorProfile();
        setProfile(p);
        setClinic({
          clinic_name: isPlaceholder(p.clinic_name) ? "" : p.clinic_name || "",
          clinic_address: isPlaceholder(p.clinic_address) ? "" : p.clinic_address || "",
          clinic_city: isPlaceholder(p.clinic_city) ? "" : p.clinic_city || "",
          clinic_state: p.clinic_state || "Andhra Pradesh",
          clinic_pin: isPlaceholder(p.clinic_pin) ? "" : p.clinic_pin || "",
          clinic_phone: p.clinic_phone || "",
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const needsNewPin = !profile?.has_approval_pin;
    if (needsNewPin && approvalPin.length !== 4) {
      setError("Enter a 4-digit approval PIN.");
      return;
    }
    const phoneErr = validatePhone(clinic.clinic_phone);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await upgradeToClinic({
        ...clinic,
        clinic_phone: clinic.clinic_phone.trim()
          ? normalizePhone(clinic.clinic_phone)
          : "",
        ...(needsNewPin ? { approval_pin: approvalPin } : {}),
      });
      setProfile(updated);
      setSuccess("Your practice is now set up as a multi-doctor clinic.");
      setApprovalPin("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upgrade failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setError("Enter a 4-digit PIN.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await setDoctorPin(newPin);
      setProfile((p) => (p ? { ...p, has_approval_pin: true } : p));
      setNewPin("");
      setSuccess("Approval PIN updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update PIN.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageContent size="narrow">
          <p className="text-center text-mute py-8">Loading…</p>
        </PageContent>
      </AppShell>
    );
  }

  const isSolo = profile?.practice_mode !== "clinic";

  return (
    <AppShell>
      <PageContent className="space-y-6 pb-16">
        <PageHeader
          title="Clinic team"
          subtitle={
            isSolo
              ? "Upgrade from solo practice to a multi-doctor clinic."
              : "Multi-doctor clinic mode is enabled for your practice."
          }
          actions={
            <Link
              href="/settings/profile"
              className="text-sm font-semibold text-positive hover:text-positive-deep"
            >
              ← Settings
            </Link>
          }
        />

        <SettingsTiles currentPath="/settings/clinic" />

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

        {isSolo ? (
          <section className="bg-canvas border border-ink/10 rounded-xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-ink">Upgrade to multi-doctor clinic</h2>
              <p className="text-sm text-body mt-2 leading-relaxed">
                You&apos;re on solo mode today — prescribing goes straight to the Rx screen.
                Upgrading enables a clinic dashboard, doctor picker, and approval PINs for
                workspace access and staff. Team features activate once you add another doctor.
              </p>
            </div>

            <form onSubmit={handleUpgrade} className="space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-body">Clinic name</span>
                <input
                  className={inputClass}
                  value={clinic.clinic_name}
                  onChange={(e) => setClinic({ ...clinic, clinic_name: e.target.value })}
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-body">Address</span>
                <textarea
                  className={clsx(inputClass, "min-h-[80px] resize-y")}
                  value={clinic.clinic_address}
                  onChange={(e) => setClinic({ ...clinic, clinic_address: e.target.value })}
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-sm font-semibold text-body">City</span>
                  <input
                    className={inputClass}
                    value={clinic.clinic_city}
                    onChange={(e) => setClinic({ ...clinic, clinic_city: e.target.value })}
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-semibold text-body">Postal PIN code</span>
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={clinic.clinic_pin}
                    onChange={(e) => setClinic({ ...clinic, clinic_pin: e.target.value })}
                    required
                    maxLength={6}
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-body">State</span>
                <select
                  className={inputClass}
                  value={clinic.clinic_state}
                  onChange={(e) => setClinic({ ...clinic, clinic_state: e.target.value })}
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-body">Clinic phone</span>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="9876543210"
                  value={clinic.clinic_phone}
                  onChange={(e) => setClinic({ ...clinic, clinic_phone: e.target.value })}
                />
              </label>

              <div className="bg-canvas-soft rounded-xl p-4 border border-ink/10 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Why an approval PIN?</p>
                  <p className="text-xs text-body mt-1 leading-relaxed">
                    This is not your email password. It is a quick 4-digit gesture for clinic
                    mode — separate from how you sign in with Google or email.
                  </p>
                </div>
                <ul className="text-xs text-body space-y-1.5 list-disc pl-4">
                  <li>
                    <span className="font-semibold text-ink">Open doctor workspaces</span> — tap
                    Enter on the clinic dashboard, then enter that doctor&apos;s PIN.
                  </li>
                  <li>
                    <span className="font-semibold text-ink">Staff can approve Rx</span> — a
                    compounder finalizes a prescription only after the treating doctor&apos;s PIN.
                  </li>
                  <li>
                    <span className="font-semibold text-ink">Keeps Rx accountable</span> — every
                    printed prescription is tied to the doctor who approved it.
                  </li>
                </ul>

                {profile?.has_approval_pin ? (
                  <p className="text-xs text-positive font-semibold bg-green-pale/50 rounded-lg px-3 py-2">
                    You already set an approval PIN during solo setup. We&apos;ll keep using it —
                    change it anytime after upgrade below.
                  </p>
                ) : (
                  <label className="block space-y-2 pt-1">
                    <span className="text-sm font-semibold text-body">
                      Set your approval PIN <span className="text-negative">*</span>
                    </span>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={approvalPin}
                      onChange={(e) =>
                        setApprovalPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      placeholder="••••"
                      className="w-full text-center text-2xl tracking-[0.4em] font-bold border border-ink/20 rounded-lg py-3 bg-canvas"
                      required
                    />
                    <p className="text-[11px] text-mute">
                      Pick something you&apos;ll remember — you&apos;ll enter it when opening your
                      workspace from the clinic dashboard.
                    </p>
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green text-ink font-semibold rounded-xl px-6 py-4 text-base hover:bg-green-hover transition-colors disabled:opacity-60"
              >
                {submitting ? "Upgrading…" : "Upgrade to multi-doctor clinic →"}
              </button>
            </form>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="bg-green-pale/50 border border-green/30 rounded-xl p-6">
              <h2 className="text-lg font-bold text-ink">Multi-doctor clinic active</h2>
              <p className="text-sm text-body mt-2 leading-relaxed">
                Your practice is configured for multiple doctors. Until you invite another
                doctor, you&apos;ll still prescribe directly — the doctor picker and clinic
                dashboard unlock automatically when your team grows.
              </p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="mt-4 rounded-pill bg-green text-ink px-5 py-2.5 text-sm font-semibold hover:bg-green-hover transition-colors"
              >
                Go to dashboard
              </button>
            </section>

            <section className="bg-canvas border border-ink/10 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-ink">Approval PIN</h2>
              <p className="text-sm text-body">
                {profile?.has_approval_pin
                  ? "Update your 4-digit PIN used for doctor selection and staff approvals."
                  : "Set your 4-digit PIN — required before other doctors can act as you."}
              </p>
              <form onSubmit={handleUpdatePin} className="space-y-3 max-w-xs">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  className="w-full text-center text-2xl tracking-[0.4em] font-bold border border-ink/20 rounded-lg py-3"
                />
                <button
                  type="submit"
                  disabled={submitting || newPin.length !== 4}
                  className="w-full rounded-pill border border-ink/20 px-5 py-2.5 text-sm font-semibold hover:bg-canvas-soft transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving…" : profile?.has_approval_pin ? "Update PIN" : "Set PIN"}
                </button>
              </form>
            </section>

            <section className="bg-canvas border border-ink/10 rounded-xl p-6">
              <h2 className="text-lg font-bold text-ink">Clinic details</h2>
              <p className="text-sm text-body mt-2">
                Update name, address, and contact on{" "}
                <Link href="/settings/profile" className="text-positive font-semibold underline">
                  Profile settings
                </Link>{" "}
                or{" "}
                <Link href="/settings/letterhead" className="text-positive font-semibold underline">
                  Letterhead
                </Link>
                .
              </p>
            </section>
          </div>
        )}
      </PageContent>
    </AppShell>
  );
}
