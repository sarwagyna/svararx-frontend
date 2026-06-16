"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Cropper, { type Area } from "react-easy-crop";
import { clsx } from "clsx";
import { AppShell } from "@/components/AppShell";
import { PageContent, PageHeader } from "@/components/PageContent";
import { ProfilePlanTile } from "@/components/ProfilePlanTile";
import { SettingsTiles } from "@/components/SettingsTiles";
import { useSaveFeedback, useUnsavedChanges } from "@/lib/save-feedback";
import {
  getDoctorProfile,
  updateDoctorProfile,
  uploadDoctorLogo,
  uploadDoctorSignature,
  type DoctorMeProfile,
} from "@/lib/api";
import { getCroppedImageBlob } from "@/lib/crop-image";
import {
  INDIAN_STATES,
  LANGUAGE_OPTIONS,
  SPECIALIZATIONS,
  normalizePhone,
  validateMci,
  validatePhone,
} from "@/lib/profile-constants";

const inputClass =
  "w-full bg-canvas border border-ink/15 rounded-md px-4 py-3 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition";

function SectionCard({
  title,
  children,
  onSave,
  saving,
  dirty,
}: {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}) {
  return (
    <section className="bg-canvas border border-ink/10 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {dirty && (
          <span className="text-xs font-semibold text-warning-content bg-warning/30 rounded-pill px-2.5 py-0.5">
            Unsaved
          </span>
        )}
      </div>
      {children}
      <button
        type="button"
        onClick={onSave}
        disabled={!dirty || saving}
        className={clsx(
          "w-full sm:w-auto rounded-pill px-6 py-2.5 text-sm font-semibold transition-colors",
          dirty && !saving
            ? "bg-green text-ink hover:bg-green-hover"
            : "bg-canvas-soft text-mute cursor-not-allowed"
        )}
      >
        {saving ? "Saving…" : "Save section"}
      </button>
    </section>
  );
}

export default function ProfileSettingsPage() {
  const { notifySaved } = useSaveFeedback();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DoctorMeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [personal, setPersonal] = useState({
    full_name: "",
    qualifications: "",
    mci_reg_number: "",
    state_council_reg: "",
    specialization: "",
    languages: [] as string[],
  });
  const [savedPersonal, setSavedPersonal] = useState(personal);

  const [clinic, setClinic] = useState({
    clinic_name: "",
    clinic_address: "",
    clinic_city: "",
    clinic_state: "Andhra Pradesh",
    clinic_pin: "",
    clinic_phone: "",
  });
  const [savedClinic, setSavedClinic] = useState(clinic);

  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingClinic, setSavingClinic] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const sigInputRef = useRef<HTMLInputElement>(null);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const applyProfile = useCallback((p: DoctorMeProfile) => {
    setProfile(p);
    const pData = {
      full_name: p.full_name,
      qualifications: p.qualifications,
      mci_reg_number: p.mci_reg_number,
      state_council_reg: p.state_council_reg ?? "",
      specialization: p.specialization,
      languages: p.languages?.length ? p.languages : ["Telugu", "English"],
    };
    const cData = {
      clinic_name: p.clinic_name ?? "",
      clinic_address: p.clinic_address ?? "",
      clinic_city: p.clinic_city ?? "",
      clinic_state: p.clinic_state ?? "Andhra Pradesh",
      clinic_pin: p.clinic_pin ?? "",
      clinic_phone: p.clinic_phone ?? "",
    };
    setPersonal(pData);
    setSavedPersonal(pData);
    setClinic(cData);
    setSavedClinic(cData);
  }, []);

  useEffect(() => {
    getDoctorProfile()
      .then(applyProfile)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [applyProfile]);

  const personalDirty =
    JSON.stringify(personal) !== JSON.stringify(savedPersonal);
  const clinicDirty = JSON.stringify(clinic) !== JSON.stringify(savedClinic);
  const anyDirty = personalDirty || clinicDirty;
  useUnsavedChanges(anyDirty);

  const toggleLanguage = (lang: string) => {
    setPersonal((prev) => {
      const has = prev.languages.includes(lang);
      const next = has
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang];
      return { ...prev, languages: next.length ? next : prev.languages };
    });
  };

  const savePersonal = async () => {
    const mciErr = validateMci(personal.mci_reg_number);
    if (mciErr) {
      setError(mciErr);
      return;
    }
    setSavingPersonal(true);
    setError(null);
    try {
      const updated = await updateDoctorProfile({
        full_name: personal.full_name.trim(),
        qualifications: personal.qualifications.trim(),
        mci_reg_number: personal.mci_reg_number.trim(),
        state_council_reg: personal.state_council_reg.trim(),
        specialization: personal.specialization.trim(),
        languages: personal.languages,
      });
      applyProfile(updated);
      notifySaved("Personal details saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingPersonal(false);
    }
  };

  const saveClinic = async () => {
    const phoneErr = validatePhone(clinic.clinic_phone);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    setSavingClinic(true);
    setError(null);
    try {
      const updated = await updateDoctorProfile({
        clinic_name: clinic.clinic_name.trim(),
        clinic_address: clinic.clinic_address.trim(),
        clinic_city: clinic.clinic_city.trim(),
        clinic_state: clinic.clinic_state.trim(),
        clinic_pin: clinic.clinic_pin.trim(),
        clinic_phone: clinic.clinic_phone.trim()
          ? normalizePhone(clinic.clinic_phone)
          : "",
      });
      applyProfile(updated);
      notifySaved("Clinic details saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingClinic(false);
    }
  };

  const onSignatureSelected = async (file: File | null) => {
    if (!file) return;
    setUploadingSig(true);
    setError(null);
    try {
      const { signature_url } = await uploadDoctorSignature(file);
      setProfile((p) => (p ? { ...p, signature_url } : p));
      notifySaved("Signature uploaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signature upload failed");
    } finally {
      setUploadingSig(false);
      if (sigInputRef.current) sigInputRef.current.value = "";
    }
  };

  const onLogoFile = (file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoCropSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const confirmLogoCrop = async () => {
    if (!logoCropSrc || !croppedArea) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const blob = await getCroppedImageBlob(logoCropSrc, croppedArea, 400);
      const { clinic_logo_url } = await uploadDoctorLogo(blob);
      setProfile((p) => (p ? { ...p, clinic_logo_url } : p));
      notifySaved("Clinic logo uploaded");
      setLogoCropSrc(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageContent size="narrow">
          <p className="text-center text-mute py-8">Loading profile…</p>
        </PageContent>
      </AppShell>
    );
  }

  return (
    <AppShell
      right={
        anyDirty ? (
          <span className="text-xs font-semibold text-warning-content bg-warning/40 rounded-pill px-2 py-0.5">
            Unsaved changes
          </span>
        ) : undefined
      }
    >
      <PageContent className="space-y-6 pb-16">
        <PageHeader
          title="Profile settings"
          subtitle="Update your details for prescriptions and letterhead."
          actions={
            <Link
              href="/settings/letterhead"
              className="text-sm font-semibold text-positive hover:text-positive-deep"
            >
              Edit clinic letterhead →
            </Link>
          }
        />

        {error && (
          <div className="rounded-md bg-negative/10 border border-negative/30 text-negative text-sm px-4 py-3">
            {error}
          </div>
        )}

        <SettingsTiles currentPath="/settings/profile" />

        {profile && (
          <ProfilePlanTile
            subscriptionTier={profile.subscription_tier}
            subscriptionExpiresAt={profile.subscription_expires_at}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Personal"
          dirty={personalDirty}
          saving={savingPersonal}
          onSave={savePersonal}
        >
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Full name</span>
            <input
              className={inputClass}
              value={personal.full_name}
              onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Qualifications</span>
            <input
              className={inputClass}
              placeholder="MBBS, MD (Medicine)"
              value={personal.qualifications}
              onChange={(e) => setPersonal({ ...personal, qualifications: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">MCI registration number</span>
            <input
              className={inputClass}
              value={personal.mci_reg_number}
              onChange={(e) => setPersonal({ ...personal, mci_reg_number: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">State medical council reg.</span>
            <input
              className={inputClass}
              value={personal.state_council_reg}
              onChange={(e) => setPersonal({ ...personal, state_council_reg: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Specialization</span>
            <select
              className={inputClass}
              value={personal.specialization}
              onChange={(e) => setPersonal({ ...personal, specialization: e.target.value })}
            >
              {!SPECIALIZATIONS.includes(personal.specialization) && personal.specialization && (
                <option value={personal.specialization}>{personal.specialization}</option>
              )}
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-body">Languages spoken</legend>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => {
                const active = personal.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={clsx(
                      "rounded-pill px-3 py-1 text-sm font-semibold border transition-colors",
                      active
                        ? "bg-green border-green text-ink"
                        : "bg-canvas border-ink/15 text-body hover:border-ink/30"
                    )}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </SectionCard>

        <SectionCard
          title="Clinic"
          dirty={clinicDirty}
          saving={savingClinic}
          onSave={saveClinic}
        >
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Clinic name</span>
            <input
              className={inputClass}
              value={clinic.clinic_name}
              onChange={(e) => setClinic({ ...clinic, clinic_name: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-body">Address</span>
            <textarea
              className={clsx(inputClass, "min-h-[80px] resize-y")}
              value={clinic.clinic_address}
              onChange={(e) => setClinic({ ...clinic, clinic_address: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-body">City</span>
              <input
                className={inputClass}
                value={clinic.clinic_city}
                onChange={(e) => setClinic({ ...clinic, clinic_city: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-body">PIN</span>
              <input
                className={inputClass}
                value={clinic.clinic_pin}
                onChange={(e) => setClinic({ ...clinic, clinic_pin: e.target.value })}
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
            <span className="text-sm font-semibold text-body">Phone (10 digits)</span>
            <input
              className={inputClass}
              inputMode="numeric"
              placeholder="9876543210"
              value={clinic.clinic_phone}
              onChange={(e) => setClinic({ ...clinic, clinic_phone: e.target.value })}
            />
          </label>
        </SectionCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-canvas border border-ink/10 rounded-lg p-5 space-y-4">
          <h2 className="text-lg font-bold text-ink">Signature</h2>
          <p className="text-sm text-body">
            Take a photo of your signature on white paper. The background will be removed
            automatically.
          </p>
          {profile?.signature_url && (
            <div className="rounded-md border border-ink/10 bg-canvas-soft p-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.signature_url}
                alt="Your signature"
                className="max-h-[75px] max-w-[200px] object-contain"
              />
            </div>
          )}
          <input
            ref={sigInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onSignatureSelected(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            disabled={uploadingSig}
            onClick={() => sigInputRef.current?.click()}
            className="rounded-pill border border-ink/20 px-5 py-2.5 text-sm font-semibold hover:bg-canvas-soft transition-colors disabled:opacity-50"
          >
            {uploadingSig ? "Uploading…" : profile?.signature_url ? "Replace signature" : "Upload signature"}
          </button>
        </section>

        <section className="bg-canvas border border-ink/10 rounded-lg p-5 space-y-4">
          <h2 className="text-lg font-bold text-ink">Clinic logo</h2>
          {profile?.clinic_logo_url && (
            <div className="rounded-md border border-ink/10 bg-canvas-soft p-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.clinic_logo_url}
                alt="Clinic logo"
                className="h-24 w-24 object-contain rounded-md"
              />
            </div>
          )}
          <label className="inline-block rounded-pill border border-ink/20 px-5 py-2.5 text-sm font-semibold hover:bg-canvas-soft transition-colors cursor-pointer">
            {uploadingLogo ? "Uploading…" : profile?.clinic_logo_url ? "Replace logo" : "Upload logo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploadingLogo}
              onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </section>
        </div>
      </PageContent>

      {logoCropSrc && (
        <div className="fixed inset-0 z-[100] bg-ink/70 flex flex-col">
          <div className="relative flex-1 min-h-[280px]">
            <Cropper
              image={logoCropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, area) => setCroppedArea(area)}
            />
          </div>
          <div className="bg-canvas p-4 space-y-3">
            <label className="block text-sm text-body">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLogoCropSrc(null)}
                className="flex-1 rounded-pill border border-ink/20 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadingLogo || !croppedArea}
                onClick={confirmLogoCrop}
                className="flex-1 rounded-pill bg-green text-ink py-2.5 text-sm font-semibold hover:bg-green-hover disabled:opacity-50"
              >
                {uploadingLogo ? "Uploading…" : "Crop & upload"}
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
