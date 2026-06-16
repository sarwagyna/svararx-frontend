"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { AppShell } from "@/components/AppShell";
import { PageContent, PageHeader } from "@/components/PageContent";
import { PrescriptionPreview } from "@/components/PrescriptionPreview";
import { useSaveFeedback, useUnsavedChanges } from "@/lib/save-feedback";
import {
  getLetterhead,
  previewLetterheadPdf,
  saveLetterhead,
  uploadLetterheadLogo,
  type LetterheadSettings,
} from "@/lib/api";
import { INDIAN_STATES, normalizePhone, validatePhone } from "@/lib/profile-constants";

const inputClass =
  "w-full bg-canvas border border-ink/15 rounded-md px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-green/50";

export default function LetterheadSettingsPage() {
  const { notifySaved } = useSaveFeedback();
  const [loaded, setLoaded] = useState<LetterheadSettings | null>(null);
  const [form, setForm] = useState({
    clinic_name: "",
    clinic_address: "",
    clinic_address_line2: "",
    clinic_city: "",
    clinic_state: "Andhra Pradesh",
    clinic_pin: "",
    clinic_phone: "",
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLetterhead()
      .then((data) => {
        setLoaded(data);
        setForm({
          clinic_name: data.clinic_name,
          clinic_address: data.clinic_address,
          clinic_address_line2: data.clinic_address_line2,
          clinic_city: data.clinic_city,
          clinic_state: data.clinic_state,
          clinic_pin: data.clinic_pin,
          clinic_phone: data.clinic_phone,
        });
        setLogoUrl(data.clinic_logo_url);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const update = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  useUnsavedChanges(dirty);

  const handleSave = async () => {
    setError(null);
    if (form.clinic_phone.trim()) {
      const err = validatePhone(form.clinic_phone);
      if (err) {
        setError(err);
        return;
      }
    }
    setSaving(true);
    try {
      const saved = await saveLetterhead({
        ...form,
        clinic_phone: form.clinic_phone.trim() ? normalizePhone(form.clinic_phone) : "",
      });
      setLoaded(saved);
      setDirty(false);
      notifySaved("Letterhead saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLogo = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { clinic_logo_url } = await uploadLetterheadLogo(file);
      setLogoUrl(clinic_logo_url);
      notifySaved("Logo uploaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Logo upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewPdf = async () => {
    setPreviewing(true);
    setError(null);
    try {
      const { pdf_base64 } = await previewLetterheadPdf();
      const bytes = Uint8Array.from(atob(pdf_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      notifySaved("Preview opened");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewing(false);
    }
  };

  if (!loaded && !error) {
    return (
      <AppShell>
        <PageContent size="wide">
          <p className="text-center text-mute py-8">Loading…</p>
        </PageContent>
      </AppShell>
    );
  }

  const previewProps = {
    clinicName: form.clinic_name,
    doctorName: loaded?.doctor_name ?? "",
    qualifications: loaded?.qualifications ?? "",
    mciNumber: loaded?.mci_reg_number ?? "",
    stateCouncilReg: loaded?.state_council_reg ?? "",
    clinicAddress: form.clinic_address,
    clinicAddressLine2: form.clinic_address_line2,
    clinicCity: form.clinic_city,
    clinicState: form.clinic_state,
    clinicPin: form.clinic_pin,
    clinicPhone: form.clinic_phone,
    logoUrl,
    signatureUrl: loaded?.signature_url,
  };

  return (
    <AppShell
      right={
        dirty ? (
          <span className="text-xs font-semibold text-warning-content bg-warning/40 rounded-pill px-2 py-0.5">
            Unsaved
          </span>
        ) : undefined
      }
    >
      <PageContent size="wide" className="pb-16">
        <PageHeader
          title="Clinic letterhead"
          subtitle="Appears on every prescription PDF. Preview updates as you type."
          actions={
            <Link href="/settings/profile" className="text-sm text-mute hover:text-ink">
              ← Profile
            </Link>
          }
        />

        {error && (
          <div className="mb-4 rounded-md bg-negative/10 border border-negative/30 text-negative text-sm px-4 py-3">
            {error}
          </div>
        )}

        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
          <section className="bg-canvas border border-ink/10 rounded-lg p-5 space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-body">Clinic name</span>
              <input className={inputClass} value={form.clinic_name} onChange={(e) => update({ clinic_name: e.target.value })} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-body">Address line 1</span>
              <input className={inputClass} value={form.clinic_address} onChange={(e) => update({ clinic_address: e.target.value })} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-body">Address line 2</span>
              <input className={inputClass} value={form.clinic_address_line2} onChange={(e) => update({ clinic_address_line2: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-body">City</span>
                <input className={inputClass} value={form.clinic_city} onChange={(e) => update({ clinic_city: e.target.value })} />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-body">PIN</span>
                <input className={inputClass} value={form.clinic_pin} onChange={(e) => update({ clinic_pin: e.target.value })} />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-body">State</span>
              <select className={inputClass} value={form.clinic_state} onChange={(e) => update({ clinic_state: e.target.value })}>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-body">Phone</span>
              <input className={inputClass} value={form.clinic_phone} onChange={(e) => update({ clinic_phone: e.target.value })} placeholder="10 digits" />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-body">Logo (JPG/PNG, max 300px wide)</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                disabled={uploading}
                onChange={(e) => handleLogo(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </label>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty || saving}
                className={clsx(
                  "flex-1 rounded-pill py-2.5 text-sm font-semibold",
                  dirty && !saving ? "bg-green text-ink hover:bg-green-hover" : "bg-canvas-soft text-mute"
                )}
              >
                {saving ? "Saving…" : "Save letterhead"}
              </button>
              <button
                type="button"
                onClick={handlePreviewPdf}
                disabled={previewing}
                className="flex-1 rounded-pill border border-ink/20 py-2.5 text-sm font-semibold hover:bg-canvas-soft"
              >
                {previewing ? "Generating…" : "Preview prescription"}
              </button>
            </div>
          </section>

          <section className="lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-2 lg:block hidden">
              Live preview
            </p>
            <p className="text-xs text-mute mb-2 lg:hidden">Preview</p>
            <PrescriptionPreview {...previewProps} />
          </section>
        </div>
      </PageContent>

    </AppShell>
  );
}
