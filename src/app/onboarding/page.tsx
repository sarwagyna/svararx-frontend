"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolvePostLoginPath } from "@/lib/auth-routing";
import { clsx } from "clsx";
import { PrescriptionPreview } from "@/components/PrescriptionPreview";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import {
  completeOnboarding,
  setDoctorPin,
  exchangeToken,
  getOnboardingStatus,
  submitOnboardingSoloSetup,
  submitOnboardingStep1,
  submitPracticeMode,
  submitOnboardingStep2,
  submitOnboardingStep3,
  submitVoiceCalibration,
  type OnboardingStatus,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import {
  clearStoredReferralCode,
  getStoredReferralCode,
} from "@/lib/referral";
import {
  CLINIC_ONBOARDING_STEPS,
  OnboardingContentCard,
  OnboardingStepper,
  SOLO_ONBOARDING_STEPS,
} from "@/components/OnboardingStepper";

type PracticeMode = "solo" | "clinic";

const SPECIALIZATIONS = [
  "General Physician",
  "Diabetologist",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "ENT",
  "Orthopedic",
  "Gynecologist",
  "Other",
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
];

const CALIBRATION_SENTENCE =
  "Metformin 500mg roju rendu sarlu tinadaniki mundu.";

const inputClass =
  "w-full bg-canvas border border-ink rounded-md px-4 py-3.5 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition";

const PRACTICE_MODE_CHOSEN_KEY = "svararx_practice_mode_chosen";

function resumeUiStep(status: OnboardingStatus): number {
  if (status.is_solo_onboarding) {
    return status.step < 1 ? 1 : 2;
  }
  return Math.min(Math.max(status.step + 1, 1), 4);
}

function soloDisplayName(fullName: string): string {
  const name = fullName.trim() || "My Practice";
  return name.toLowerCase().startsWith("dr") ? name : `Dr. ${name}`;
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas-soft flex items-center justify-center">
          <p className="text-body">Loading setup…</p>
        </div>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uiStep, setUiStep] = useState(1);
  const [savedStep, setSavedStep] = useState(0);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("solo");
  const [showPracticeModeOnly, setShowPracticeModeOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step1, setStep1] = useState({
    full_name: "",
    qualifications: "",
    mci_reg_number: "",
    state_council_reg: "",
    specialization: "General Physician",
  });
  const [referralCode, setReferralCode] = useState("");
  const [referralLocked, setReferralLocked] = useState(false);
  const [soloPractice, setSoloPractice] = useState({
    practice_city: "",
    practice_phone: "",
  });
  const [step2, setStep2] = useState({
    clinic_name: "",
    clinic_address: "",
    clinic_city: "",
    clinic_state: "Andhra Pradesh",
    clinic_pin: "",
    clinic_phone: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [approvalPin, setApprovalPin] = useState("");

  const { isRecording, startRecording, stopRecording, error: recError } =
    useVoiceRecorder();
  const [calibrating, setCalibrating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSolo = practiceMode === "solo";
  const stepConfig = isSolo ? SOLO_ONBOARDING_STEPS : CLINIC_ONBOARDING_STEPS;
  const currentStepMeta = stepConfig.find((s) => s.id === uiStep);

  const loadStatus = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    await exchangeToken();
    const status: OnboardingStatus = await getOnboardingStatus();

    if (status.completed) {
      const path = await resolvePostLoginPath();
      router.replace(path);
      return;
    }

    setPracticeMode(status.practice_mode === "clinic" ? "clinic" : "solo");
    const practiceChosen =
      status.step >= 1 ||
      !status.needs_practice_mode_choice ||
      sessionStorage.getItem(PRACTICE_MODE_CHOSEN_KEY) === "1";
    setShowPracticeModeOnly(!practiceChosen);
    setStep1({
      full_name: status.full_name,
      qualifications: status.qualifications,
      mci_reg_number: status.mci_reg_number.startsWith("PENDING-")
        ? ""
        : status.mci_reg_number,
      state_council_reg: status.state_council_reg,
      specialization: status.specialization || "General Physician",
    });
    setSoloPractice({
      practice_city: status.clinic_city === "—" ? "" : status.clinic_city,
      practice_phone: status.clinic_phone,
    });
    setStep2({
      clinic_name: status.clinic_name,
      clinic_address: status.clinic_address,
      clinic_city: status.clinic_city,
      clinic_state: status.clinic_state || "Andhra Pradesh",
      clinic_pin: status.clinic_pin,
      clinic_phone: status.clinic_phone,
    });
    setLogoPreview(status.clinic_logo_url);
    setSigPreview(status.signature_url);

    const urlRef = searchParams.get("ref");
    const storedRef = getStoredReferralCode();
    const appliedRef = status.referral_code?.trim();
    const initialRef = appliedRef || urlRef || storedRef || "";
    setReferralCode(initialRef);
    setReferralLocked(Boolean(appliedRef));

    setSavedStep(status.step);
    setUiStep(resumeUiStep(status));
    setLoading(false);
  }, [router, searchParams]);

  useEffect(() => {
    const urlRef = searchParams.get("ref");
    if (urlRef && !referralLocked) {
      setReferralCode((prev) => prev || urlRef);
    }
  }, [searchParams, referralLocked]);

  useEffect(() => {
    loadStatus().catch(() => {
      setError("Could not load onboarding status.");
      setLoading(false);
    });
  }, [loadStatus]);

  const handlePracticeModeContinue = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitPracticeMode(practiceMode);
      sessionStorage.setItem(PRACTICE_MODE_CHOSEN_KEY, "1");
      setShowPracticeModeOnly(false);
      setUiStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save practice mode.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitOnboardingStep1({
        ...step1,
        practice_mode: practiceMode,
        referral_code: referralCode.trim() || undefined,
      });
      if (referralCode.trim()) {
        clearStoredReferralCode();
        setReferralLocked(true);
      }
      setSavedStep((s) => Math.max(s, 1));
      setUiStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClinicStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitOnboardingStep2(step2);
      setSavedStep((s) => Math.max(s, 2));
      setUiStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save clinic details.");
    } finally {
      setSubmitting(false);
    }
  };

  const ensureClinicStep2Saved = async () => {
    if (savedStep >= 2) return;
    if (!step2.clinic_name.trim() || !step2.clinic_address.trim() || !step2.clinic_city.trim()) {
      throw new Error("Complete clinic details on step 2 before continuing.");
    }
    if (step2.clinic_pin.trim().length < 4) {
      throw new Error("Enter a valid 4–10 digit clinic PIN on step 2.");
    }
    await submitOnboardingStep2(step2);
    setSavedStep(2);
  };

  const handleClinicStep3Continue = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await ensureClinicStep2Saved();
      await submitOnboardingStep3(logoFile, sigFile);
      setSavedStep((s) => Math.max(s, 3));
      setUiStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save branding.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSigFile(file);
    setSigPreview(URL.createObjectURL(file));
  };

  const finishOnboarding = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (isSolo) {
        await submitOnboardingSoloSetup({
          practice_city: soloPractice.practice_city.trim() || undefined,
          practice_phone: soloPractice.practice_phone.trim() || undefined,
          approval_pin: approvalPin.length === 4 ? approvalPin : undefined,
        });
        setSavedStep((s) => Math.max(s, 2));
        if (logoFile || sigFile) {
          await submitOnboardingStep3(logoFile, sigFile);
        }
      } else {
        if (approvalPin.length !== 4) {
          throw new Error("Enter a 4-digit approval PIN to finish clinic setup.");
        }
        await setDoctorPin(approvalPin);
      }

      await completeOnboarding();
      const path = await resolvePostLoginPath();
      router.replace(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete setup.");
      setSubmitting(false);
    }
  };

  const handleStartCalibration = async () => {
    setError(null);
    setCalibrating(true);
    await startRecording();
    timerRef.current = setTimeout(async () => {
      const blob = await stopRecording();
      setCalibrating(false);
      if (blob) {
        try {
          await submitVoiceCalibration(blob);
        } catch {
          // Non-blocking
        }
      }
      await finishOnboarding();
    }, 10000);
  };

  const handleStopCalibration = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const blob = await stopRecording();
    setCalibrating(false);
    if (blob) {
      try {
        await submitVoiceCalibration(blob);
      } catch {
        // Non-blocking
      }
    }
    await finishOnboarding();
  };

  const handleSoloFinish = async () => {
    await finishOnboarding();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-soft flex items-center justify-center">
        <p className="text-body">Loading setup…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-soft">
      {showPracticeModeOnly ? (
        <div className="max-w-lg mx-auto px-4 py-8 pb-16">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-body">SvaraRx Setup</p>
          </div>

          {error && (
            <div className="mb-6 bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-sm text-negative">
              {error}
            </div>
          )}

          <OnboardingContentCard
            title="How do you practice?"
            subtitle="Choose your setup right after sign-in. You can upgrade a solo practice to a clinic later in settings."
          >
            <div className="grid gap-3 mb-6">
              <button
                type="button"
                onClick={() => setPracticeMode("solo")}
                className={clsx(
                  "text-left rounded-xl border-2 p-4 transition-colors",
                  practiceMode === "solo"
                    ? "border-green bg-green-pale"
                    : "border-ink/15 hover:border-ink/30"
                )}
              >
                <p className="font-semibold text-ink">Solo practice</p>
                <p className="text-sm text-body mt-1">
                  Just you — minimal setup, go straight to prescribing.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPracticeMode("clinic")}
                className={clsx(
                  "text-left rounded-xl border-2 p-4 transition-colors",
                  practiceMode === "clinic"
                    ? "border-green bg-green-pale"
                    : "border-ink/15 hover:border-ink/30"
                )}
              >
                <p className="font-semibold text-ink">Multi-doctor clinic</p>
                <p className="text-sm text-body mt-1">
                  OPD or team — clinic dashboard, doctor PINs, and staff.
                </p>
              </button>
            </div>
            <button
              type="button"
              onClick={handlePracticeModeContinue}
              disabled={submitting}
              className="w-full bg-green text-ink font-semibold rounded-xl px-6 py-4 text-base hover:bg-green-hover transition-colors disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Continue →"}
            </button>
          </OnboardingContentCard>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 pb-16">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            <div className="lg:w-[280px] xl:w-[300px] shrink-0">
              <OnboardingStepper
                steps={stepConfig}
                currentStep={uiStep}
                savedStep={savedStep}
                onStepClick={setUiStep}
                practiceLabel={
                  isSolo
                    ? "Solo practice — you'll start prescribing right away"
                    : "Clinic setup — manage doctors from the clinic dashboard"
                }
              />
            </div>

            <main className="flex-1 min-w-0 max-w-2xl lg:max-w-none">
              {error && (
                <div className="mb-6 bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-sm text-negative">
                  {error}
                </div>
              )}

        {uiStep === 1 && (
          <OnboardingContentCard
            stepLabel={currentStepMeta?.stepLabel}
            title="Your profile"
            subtitle="Tell us about yourself as a registered medical practitioner."
          >
            {referralCode && !referralLocked && (
              <div className="mb-4 bg-green-pale border border-green/30 rounded-xl px-4 py-3 text-sm text-positive-deep">
                You were referred to SvaraRx. Your referral code is pre-filled below.
              </div>
            )}

            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={step1.full_name}
                  onChange={(e) => setStep1({ ...step1, full_name: e.target.value })}
                  placeholder="Dr. Priya Sharma"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Qualifications
                </label>
                <input
                  type="text"
                  value={step1.qualifications}
                  onChange={(e) =>
                    setStep1({ ...step1, qualifications: e.target.value })
                  }
                  placeholder="MBBS, MD"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  MCI registration number
                </label>
                <input
                  type="text"
                  value={step1.mci_reg_number}
                  onChange={(e) =>
                    setStep1({ ...step1, mci_reg_number: e.target.value })
                  }
                  placeholder="AP-12345"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  State council registration
                </label>
                <input
                  type="text"
                  value={step1.state_council_reg}
                  onChange={(e) =>
                    setStep1({ ...step1, state_council_reg: e.target.value })
                  }
                  placeholder="Optional"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Specialization
                </label>
                <select
                  value={step1.specialization}
                  onChange={(e) =>
                    setStep1({ ...step1, specialization: e.target.value })
                  }
                  className={inputClass}
                >
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Referral code
                  <span className="text-mute font-normal"> (optional)</span>
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Doctor ID from invite link"
                  disabled={referralLocked}
                  className={clsx(
                    inputClass,
                    referralLocked && "bg-canvas-soft text-mute cursor-not-allowed"
                  )}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green text-ink font-semibold rounded-xl px-6 py-4 text-base hover:bg-green-hover transition-colors disabled:opacity-60 mt-2"
              >
                {submitting ? "Saving…" : "Continue →"}
              </button>
            </form>
          </OnboardingContentCard>
        )}

        {uiStep === 2 && isSolo && (
          <OnboardingContentCard
            stepLabel={currentStepMeta?.stepLabel}
            title="Ready to prescribe"
            subtitle="Your practice is set up in the background. Add optional details now or change them later in settings."
          >
            <div className="space-y-5">
            <PrescriptionPreview
              clinicName={soloDisplayName(step1.full_name)}
              doctorName={step1.full_name}
              qualifications={step1.qualifications}
              mciNumber={step1.mci_reg_number}
              stateCouncilReg={step1.state_council_reg}
              clinicAddress="—"
              clinicCity={soloPractice.practice_city || "—"}
              clinicState="Andhra Pradesh"
              clinicPhone={soloPractice.practice_phone}
              logoUrl={logoPreview}
              signatureUrl={sigPreview}
            />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  City <span className="text-mute font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={soloPractice.practice_city}
                  onChange={(e) =>
                    setSoloPractice({ ...soloPractice, practice_city: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Phone <span className="text-mute font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={soloPractice.practice_phone}
                  onChange={(e) =>
                    setSoloPractice({ ...soloPractice, practice_phone: e.target.value })
                  }
                  placeholder="+91 98765 43210"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Logo <span className="text-mute font-normal">(optional)</span>
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
                  className="w-full text-sm text-body file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-green file:text-ink file:font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Signature <span className="text-mute font-normal">(optional)</span>
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleSigChange}
                  className="w-full text-sm text-body file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-green file:text-ink file:font-semibold"
                />
              </div>
              <div className="bg-canvas-soft rounded-xl p-4 border border-ink/10">
                <p className="text-sm font-semibold text-ink mb-1">
                  Approval PIN <span className="text-mute font-normal">(optional)</span>
                </p>
                <p className="text-xs text-body mb-2">
                  Set this now if you plan to add clinic staff later.
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={approvalPin}
                  onChange={(e) =>
                    setApprovalPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="••••"
                  className="w-full text-center text-2xl tracking-[0.4em] font-bold border border-ink/20 rounded-lg py-3"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUiStep(1)}
                className="flex-1 border border-ink/30 text-ink font-semibold rounded-xl px-6 py-4 text-base hover:bg-canvas-soft transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSoloFinish}
                disabled={submitting}
                className="flex-[2] bg-green text-ink font-semibold rounded-xl px-6 py-4 text-base hover:bg-green-hover transition-colors disabled:opacity-60"
              >
                {submitting ? "Starting…" : "Start prescribing →"}
              </button>
            </div>
            </div>
          </OnboardingContentCard>
        )}

        {uiStep === 2 && !isSolo && (
          <OnboardingContentCard
            stepLabel={currentStepMeta?.stepLabel}
            title="Clinic details"
            subtitle="Where does your team see patients? This appears on every prescription."
          >
            <form onSubmit={handleClinicStep2} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Clinic name
                </label>
                <input
                  type="text"
                  value={step2.clinic_name}
                  onChange={(e) =>
                    setStep2({ ...step2, clinic_name: e.target.value })
                  }
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  value={step2.clinic_address}
                  onChange={(e) =>
                    setStep2({ ...step2, clinic_address: e.target.value })
                  }
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={step2.clinic_city}
                  onChange={(e) =>
                    setStep2({ ...step2, clinic_city: e.target.value })
                  }
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  State
                </label>
                <select
                  value={step2.clinic_state}
                  onChange={(e) =>
                    setStep2({ ...step2, clinic_state: e.target.value })
                  }
                  className={inputClass}
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  PIN code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={step2.clinic_pin}
                  onChange={(e) =>
                    setStep2({ ...step2, clinic_pin: e.target.value })
                  }
                  required
                  maxLength={6}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Clinic phone
                </label>
                <input
                  type="tel"
                  value={step2.clinic_phone}
                  onChange={(e) =>
                    setStep2({ ...step2, clinic_phone: e.target.value })
                  }
                  placeholder="+91 98765 43210"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUiStep(1)}
                  className="flex-1 border border-ink/30 text-ink font-semibold rounded-xl px-6 py-4 text-base hover:bg-canvas-soft transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] bg-green text-ink font-semibold rounded-xl px-6 py-4 text-base hover:bg-green-hover transition-colors disabled:opacity-60"
                >
                  {submitting ? "Saving…" : "Continue →"}
                </button>
              </div>
            </form>
          </OnboardingContentCard>
        )}

        {uiStep === 3 && !isSolo && (
          <OnboardingContentCard
            stepLabel={currentStepMeta?.stepLabel}
            title="Prescription preview"
            subtitle="Review your letterhead. Optionally add a logo and signature."
          >
            <div className="space-y-5">
            <PrescriptionPreview
              clinicName={step2.clinic_name}
              doctorName={step1.full_name}
              qualifications={step1.qualifications}
              mciNumber={step1.mci_reg_number}
              stateCouncilReg={step1.state_council_reg}
              clinicAddress={step2.clinic_address}
              clinicCity={step2.clinic_city}
              clinicState={step2.clinic_state}
              clinicPhone={step2.clinic_phone}
              logoUrl={logoPreview}
              signatureUrl={sigPreview}
            />

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Clinic logo (optional)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
                  className="w-full text-sm text-body file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-green file:text-ink file:font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Signature image (optional)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleSigChange}
                  className="w-full text-sm text-body file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-green file:text-ink file:font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUiStep(2)}
                className="flex-1 border border-ink/30 text-ink font-semibold rounded-xl px-6 py-4 text-base hover:bg-canvas-soft transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleClinicStep3Continue}
                disabled={submitting}
                className="flex-[2] bg-green text-ink font-semibold rounded-xl px-6 py-4 text-base hover:bg-green-hover transition-colors disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Continue →"}
              </button>
            </div>
            </div>
          </OnboardingContentCard>
        )}

        {uiStep === 4 && !isSolo && (
          <OnboardingContentCard
            stepLabel={currentStepMeta?.stepLabel}
            title="Security & voice"
            subtitle="Set your approval PIN for the doctor picker. Voice calibration is optional."
          >
            <div className="bg-canvas-soft rounded-xl p-4 mb-6 border border-ink/10">
              <p className="text-sm font-semibold text-ink mb-1">
                Approval PIN <span className="text-negative">*</span>
              </p>
              <p className="text-xs text-body mb-2">
                Required for multi-doctor clinics — staff use this to act as a doctor.
              </p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={approvalPin}
                onChange={(e) =>
                  setApprovalPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="••••"
                className="w-full text-center text-2xl tracking-[0.4em] font-bold border border-ink/20 rounded-lg py-3"
              />
            </div>

            <div className="bg-canvas-soft rounded-xl p-4 mb-6 border border-ink/10">
              <p className="text-sm font-semibold text-ink mb-1">Say this sentence:</p>
              <p className="text-base text-body italic leading-relaxed">
                &ldquo;{CALIBRATION_SENTENCE}&rdquo;
              </p>
            </div>

            {(recError || error) && (
              <p className="text-sm text-negative mb-4">{recError || error}</p>
            )}

            {!isRecording && !calibrating && (
              <button
                type="button"
                onClick={handleStartCalibration}
                disabled={submitting || approvalPin.length !== 4}
                className="w-full bg-green text-ink font-semibold rounded-xl px-6 py-4 text-base hover:bg-green-hover transition-colors disabled:opacity-60 mb-3"
              >
                🎙 Record 10 seconds & finish
              </button>
            )}

            {(isRecording || calibrating) && (
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-negative/10 text-negative px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <span className="h-2 w-2 rounded-full bg-negative animate-pulse" />
                  Recording…
                </div>
                <button
                  type="button"
                  onClick={handleStopCalibration}
                  className="w-full border border-ink/30 text-ink font-semibold rounded-xl px-6 py-4 text-base"
                >
                  Stop & finish
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => finishOnboarding()}
              disabled={submitting || isRecording || approvalPin.length !== 4}
              className="w-full border-2 border-ink/20 text-ink font-semibold rounded-xl px-6 py-4 text-base hover:bg-canvas-soft transition-colors disabled:opacity-60 mb-3"
            >
              {submitting ? "Finishing…" : "Skip voice → Go to clinic dashboard"}
            </button>

            <button
              type="button"
              onClick={() => setUiStep(3)}
              disabled={isRecording}
              className="w-full text-sm text-body underline underline-offset-2"
            >
              ← Back
            </button>
          </OnboardingContentCard>
        )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
