"use client";
/**
 * /prescribe — Main prescription flow page.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { VoiceCapture } from "@/components/VoiceCapture";
import { PatientQuickSelect, type PatientQuickSelectHandle } from "@/components/PatientQuickSelect";
import { ChiefComplaintStep } from "@/components/ChiefComplaintStep";
import { ReviewScreen } from "@/components/ReviewScreen";
import { VitalsQuickEntry } from "@/components/VitalsQuickEntry";
const VitalsSparkline = dynamic(
  () => import("@/components/VitalsSparkline").then((m) => m.VitalsSparkline),
  { ssr: false, loading: () => <div className="h-24 rounded-xl bg-canvas-soft animate-pulse" aria-hidden /> }
);
import { AppShell } from "@/components/AppShell";
import { PageContent } from "@/components/PageContent";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { DoctorSessionGuard } from "@/components/DoctorSessionGuard";
import { buildChiefComplaint } from "@/lib/chiefComplaints";
import { useSaveFeedback } from "@/lib/save-feedback";
import {
  transcribeAndStructure,
  structureTranscription,
  approvePrescription,
  getMe,
  getClinicUxContext,
  getPatient,
  getPrescriptionDetail,
  getActiveConsultation,
  startConsultation,
  completeConsultation,
  type ClinicUxContext,
  type DoctorProfile,
  type Patient,
  type StructuredPrescription,
  type AllergyAcknowledgment,
} from "@/lib/api";
import { PinApproveModal, DoctorCard } from "@/components/ClinicSessionUI";
import {
  cacheClinicContext,
  getActiveDoctorId,
  setActiveDoctorId,
} from "@/lib/clinic-session";

type FlowStep =
  | "loading"
  | "record"
  | "transcribing"
  | "structuring"
  | "review"
  | "approved";

type RecordSection = "patient" | "complaint" | "dictate";

const RECORD_FLOW: RecordSection[] = ["patient", "complaint", "dictate"];

function recordSectionFromIndex(index: number): RecordSection {
  return RECORD_FLOW[index] ?? "patient";
}

function indexFromRecordSection(section: RecordSection): number {
  return RECORD_FLOW.indexOf(section);
}

const EMPTY_STRUCTURED: StructuredPrescription = {
  medications: [],
  diagnosis: "",
  advice: "",
  follow_up: "",
  same_as_last_time: false,
};

export default function PrescribePage() {
  return (
    <OnboardingGuard>
      <DoctorSessionGuard>
        <PrescribeFlow />
      </DoctorSessionGuard>
    </OnboardingGuard>
  );
}

function PrescribeFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notifySaved } = useSaveFeedback();
  const [step, setStep] = useState<FlowStep>("loading");
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitalsRefreshKey, setVitalsRefreshKey] = useState(0);
  const [complaintTags, setComplaintTags] = useState<string[]>([]);
  const [complaintFreeText, setComplaintFreeText] = useState("");
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const consultationIdRef = useRef<string | null>(null);
  const [transcription, setTranscription] = useState("");
  const [manualText, setManualText] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [structured, setStructured] = useState<StructuredPrescription | null>(null);
  const [draftPrescriptionId, setDraftPrescriptionId] = useState<string | null>(null);
  const [approveResult, setApproveResult] = useState<{
    prescription_id: string;
    pdf_url: string | null;
    pdf_base64: string | null;
    consultation_id?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [recordSection, setRecordSection] = useState<RecordSection>("patient");
  const [clinicCtx, setClinicCtx] = useState<ClinicUxContext | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [visitDoctorId, setVisitDoctorId] = useState<string | null>(null);
  const pendingApproveRef = useRef<{
    rx: StructuredPrescription;
    acks?: AllergyAcknowledgment[];
  } | null>(null);
  const patientQuickSelectRef = useRef<PatientQuickSelectHandle>(null);

  const goToRecordSection = useCallback((section: RecordSection) => {
    setRecordSection(section);
    setStep("record");
    setError(null);
  }, []);

  const resetComplaint = useCallback(() => {
    setComplaintTags([]);
    setComplaintFreeText("");
    setConsultationId(null);
    consultationIdRef.current = null;
  }, []);

  const ensureConsultation = useCallback(async () => {
    if (consultationIdRef.current) return consultationIdRef.current;

    const { chief_complaint, tags } = buildChiefComplaint(
      complaintTags,
      complaintFreeText
    );

    try {
      const active = await getActiveConsultation();
      if (active) {
        consultationIdRef.current = active.id;
        setConsultationId(active.id);
        return active.id;
      }
    } catch {
      /* no active */
    }

    try {
      const created = await startConsultation({
        patient_id: patient?.id,
        chief_complaint,
        tags,
      });
      consultationIdRef.current = created.id;
      setConsultationId(created.id);
      return created.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("active consultation")) {
        const active = await getActiveConsultation();
        if (active) {
          consultationIdRef.current = active.id;
          setConsultationId(active.id);
          return active.id;
        }
      }
      throw err;
    }
  }, [complaintTags, complaintFreeText, patient?.id]);

  useEffect(() => {
    (async () => {
      try {
        // Token is already ensured by the guards (and authFetch self-heals on
        // 401), so skip the extra exchange and fetch profile + context together.
        const [profile, ctx] = await Promise.all([getMe(), getClinicUxContext()]);
        setDoctor(profile);
        cacheClinicContext(ctx);
        setClinicCtx(ctx);

        if (ctx.is_solo && ctx.doctors[0]) {
          setActiveDoctorId(ctx.doctors[0].id);
          setVisitDoctorId(ctx.doctors[0].id);
        } else if (ctx.membership_role === "compounder") {
          const stored = getActiveDoctorId();
          if (stored) setVisitDoctorId(stored);
        } else {
          setVisitDoctorId(getActiveDoctorId());
        }

        const draftId = searchParams.get("draft");
        if (draftId) {
          try {
            const detail = await getPrescriptionDetail(draftId);
            if (detail.status !== "draft") {
              setError("This prescription has already been finalized.");
              setRecordSection("patient");
              setStep("record");
              return;
            }
            setDraftPrescriptionId(detail.id);
            setStructured(detail.structured);
            setTranscription(detail.raw_transcription ?? "");

            const tags = detail.structured.chief_complaint_tags ?? [];
            if (tags.length > 0) setComplaintTags(tags);
            const complaint = detail.structured.chief_complaint;
            if (complaint) setComplaintFreeText(complaint);

            const patientId = searchParams.get("patient") ?? detail.patient_id;
            if (patientId) {
              try {
                setPatient(await getPatient(patientId));
              } catch {
                /* patient may have been removed */
              }
            }
            setStep("review");
            return;
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Could not load draft prescription."
            );
            setRecordSection("patient");
            setStep("record");
            return;
          }
        }

        const patientId = searchParams.get("patient");
        if (patientId) {
          try {
            setPatient(await getPatient(patientId));
          } catch {
            /* ignore invalid pre-selection */
          }
        }
        setRecordSection("patient");
        setStep("record");
      } catch {
        router.push("/onboarding");
      }
    })();
  }, [router, searchParams]);

  const handleStartRecording = useCallback(async () => {
    try {
      await ensureConsultation();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start consultation."
      );
    }
  }, [ensureConsultation]);

  const handleVoiceCaptured = useCallback(
    async ({
      blob,
    }: {
      blob: Blob;
      recordingId: string;
      durationSeconds: number;
    }) => {
      setStep("transcribing");
      setError(null);

      const { chief_complaint } = buildChiefComplaint(
        complaintTags,
        complaintFreeText
      );

      try {
        const result = await transcribeAndStructure(blob, {
          patientId: patient?.id,
          chiefComplaint: chief_complaint,
          consultationId: consultationIdRef.current ?? undefined,
        });
        setTranscription(result.corrected_transcription);

        if (result.groq_error) {
          setError("Prescription structuring failed — please type the dictation manually.");
          setShowManual(true);
          setManualText(result.corrected_transcription);
          setRecordSection("dictate");
          setStep("record");
          return;
        }

        setStructured(result.structured);
        setDraftPrescriptionId(result.prescription_id);
        setStep("review");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Processing failed. Please try again."
        );
        setRecordSection("dictate");
        setStep("record");
      }
    },
    [patient?.id, complaintTags, complaintFreeText]
  );

  const handleManualSubmit = async () => {
    const text = manualText.trim();
    if (!text) return;

    setTranscription(text);
    setStep("structuring");
    setError(null);

    try {
      await ensureConsultation();
      const structureResult = await structureTranscription(text, patient?.id);
      setStructured(structureResult.structured);
      setStep("review");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Structuring failed. Please try again."
      );
      setRecordSection("dictate");
      setStep("record");
    }
  };

  const doApprove = async (
    approvedRx: StructuredPrescription,
    allergyAcknowledgments?: AllergyAcknowledgment[],
    approvalToken?: string
  ) => {
    if (!patient) {
      setError("Select a patient before approving, or continue with an anonymous quick Rx after adding one.");
      return;
    }

    setIsApproving(true);
    setError(null);

    try {
      const activeDoctor = visitDoctorId ?? getActiveDoctorId() ?? undefined;
      const result = await approvePrescription({
        patient_id: patient.id,
        raw_transcription: transcription,
        structured: approvedRx,
        prescription_id: draftPrescriptionId ?? undefined,
        consultation_id: consultationIdRef.current ?? undefined,
        allergy_acknowledgments: allergyAcknowledgments,
        approval_token: approvalToken,
        approving_doctor_id: activeDoctor,
      });

      setApproveResult({
        ...result,
        consultation_id: consultationIdRef.current,
      });
      setStep("approved");
      notifySaved("Prescription approved");

      if (result.pdf_url) {
        window.open(result.pdf_url, "_blank");
      } else if (result.pdf_base64) {
        printBase64Pdf(result.pdf_base64);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Approval failed. Please try again."
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleApprove = async (
    approvedRx: StructuredPrescription,
    allergyAcknowledgments?: AllergyAcknowledgment[]
  ) => {
    if (!patient) {
      setError("Select a patient before approving, or continue with an anonymous quick Rx after adding one.");
      return;
    }

    if (clinicCtx?.requires_pin_to_approve) {
      const doctorId = visitDoctorId ?? getActiveDoctorId();
      if (!doctorId) {
        setError("Select the consulting doctor before approving.");
        return;
      }
      pendingApproveRef.current = { rx: approvedRx, acks: allergyAcknowledgments };
      setPinModalOpen(true);
      return;
    }

    await doApprove(approvedRx, allergyAcknowledgments);
  };

  const handlePinVerified = async (approvalToken: string) => {
    const pending = pendingApproveRef.current;
    pendingApproveRef.current = null;
    if (!pending) return;
    await doApprove(pending.rx, pending.acks, approvalToken);
  };

  const handleReDictate = () => {
    setStructured(null);
    setDraftPrescriptionId(null);
    setTranscription("");
    setManualText("");
    setRecordSection("dictate");
    setStep("record");
  };

  const handleNewPrescription = async () => {
    if (consultationIdRef.current) {
      try {
        await completeConsultation(consultationIdRef.current);
      } catch {
        /* best effort */
      }
    }
    resetComplaint();
    setRecordSection("patient");
    setStep("record");
    setStructured(null);
    setDraftPrescriptionId(null);
    setTranscription("");
    setManualText("");
    setApproveResult(null);
    setError(null);
  };

  const handleNewPatient = async () => {
    setPatient(null);
    await handleNewPrescription();
    requestAnimationFrame(() => patientQuickSelectRef.current?.openNewPatientModal());
  };

  const handlePatientChange = (p: Patient | null) => {
    setPatient(p);
  };

  const handleProgressNavigate = useCallback(
    (index: number) => {
      setError(null);
      if (index <= 2) {
        goToRecordSection(recordSectionFromIndex(index));
        return;
      }
      if (index === 3) {
        setStep("review");
        setStructured((prev) => prev ?? EMPTY_STRUCTURED);
        return;
      }
      if (approveResult) {
        setStep("approved");
      } else {
        setStep("review");
        setStructured((prev) => prev ?? EMPTY_STRUCTURED);
      }
    },
    [approveResult, goToRecordSection]
  );

  const placeholderPatient: Patient = patient ?? {
    id: "",
    name: "Anonymous",
    age: 0,
    sex: "—",
    phone: null,
    created_at: new Date().toISOString(),
  };

  const { chief_complaint } = buildChiefComplaint(complaintTags, complaintFreeText);

  return (
    <AppShell right={<span>{doctor?.name ?? ""}</span>}>
      <PageContent size="narrow">
        {step !== "loading" && (
          <StepIndicator
            step={step}
            patientSelected={!!patient}
            recordSection={recordSection}
            onNavigate={handleProgressNavigate}
          />
        )}

        {error && (
          <div className="mb-4 bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-sm text-negative">
            {error}
          </div>
        )}

        {clinicCtx?.membership_role === "compounder" &&
          !visitDoctorId &&
          clinicCtx.doctors.length > 0 && (
            <div className="mb-4 bg-canvas rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-lg font-bold text-ink">Consulting doctor</h2>
              <p className="text-sm text-body">
                Select the doctor for this visit. You stay logged in — PIN is only needed at approve.
              </p>
              {clinicCtx.doctors.map((d) => (
                <DoctorCard
                  key={d.id}
                  doctor={d}
                  selected={false}
                  onSelect={() => {
                    setVisitDoctorId(d.id);
                    setActiveDoctorId(d.id);
                  }}
                />
              ))}
            </div>
          )}

        {step === "loading" && (
          <div className="bg-canvas rounded-xl p-8 shadow-sm flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
            <p className="font-bold text-ink">Loading your profile…</p>
          </div>
        )}

        {(step === "record" || step === "transcribing" || step === "structuring") && (
          <>
            {step === "record" && recordSection === "patient" && (
              <div className="bg-canvas rounded-xl p-5 shadow-sm space-y-4">
                <div>
                  <h1 className="text-xl font-black text-ink mb-1">Select Patient</h1>
                  <p className="text-sm text-body mb-4">
                    Link this prescription to a patient, then continue to chief complaint.
                  </p>
                  <PatientQuickSelect
                    ref={patientQuickSelectRef}
                    hideHeaderNewPatient
                    selected={patient}
                    onSelect={handlePatientChange}
                  />
                </div>

                {patient && (
                  <>
                    <VitalsQuickEntry
                      patientId={patient.id}
                      consultationId={consultationId}
                      onSaved={() => setVitalsRefreshKey((k) => k + 1)}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-ink mb-3">Vitals History</h3>
                      <VitalsSparkline key={vitalsRefreshKey} patientId={patient.id} />
                    </div>
                  </>
                )}

                <StepNav
                  onSecondary={() => patientQuickSelectRef.current?.openNewPatientModal()}
                  secondaryLabel="New patient"
                  onNext={() => goToRecordSection("complaint")}
                  nextLabel="Continue to Complaint →"
                />
              </div>
            )}

            {step === "record" && recordSection === "complaint" && (
              <div className="bg-canvas rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-ink mb-1">Chief Complaint</h2>
                <p className="text-sm text-body mb-4">
                  Add tags or notes for this visit, then continue to dictate the prescription.
                </p>
                <ChiefComplaintStep
                  selectedTags={complaintTags}
                  freeText={complaintFreeText}
                  onTagsChange={setComplaintTags}
                  onFreeTextChange={setComplaintFreeText}
                />

                <StepNav
                  onBack={() => goToRecordSection("patient")}
                  backLabel="← Patient"
                  onNext={() => goToRecordSection("dictate")}
                  nextLabel="Continue to Dictate →"
                />
              </div>
            )}

            {step === "record" && recordSection === "dictate" && (
              <div className="bg-canvas rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-ink mb-1">Dictate Prescription</h2>
                <p className="text-sm text-body mb-4">
                  Hold the button and speak. Release when done to generate the prescription.
                </p>

                <VoiceCapture
                  onStartRecording={handleStartRecording}
                  onCaptured={handleVoiceCaptured}
                  onError={setError}
                />

                <div className="mt-4">
                  <button
                    onClick={() => setShowManual(!showManual)}
                    className="text-xs text-mute hover:text-body underline"
                  >
                    {showManual ? "Hide" : "Type prescription instead"}
                  </button>
                  {showManual && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        placeholder="Type the prescription dictation here…"
                        rows={4}
                        className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-positive resize-none"
                      />
                      <button
                        onClick={handleManualSubmit}
                        disabled={!manualText.trim()}
                        className="w-full bg-green text-ink font-semibold rounded-xl py-2.5 text-sm hover:bg-green-hover disabled:opacity-50"
                      >
                        Structure →
                      </button>
                    </div>
                  )}
                </div>

                <StepNav
                  onBack={() => goToRecordSection("complaint")}
                  backLabel="← Complaint"
                />
              </div>
            )}

            {(step === "transcribing" || step === "structuring") && (
              <div className="bg-canvas rounded-xl p-8 shadow-sm flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
                <p className="font-bold text-ink">
                  {step === "transcribing" ? "Transcribing audio…" : "Structuring prescription…"}
                </p>
                {chief_complaint && (
                  <p className="text-xs text-mute">Complaint: {chief_complaint}</p>
                )}
              </div>
            )}
          </>
        )}

        {step === "review" && (
          <div className="bg-canvas rounded-xl p-6 shadow-sm space-y-4">
            {!patient && (
              <p className="text-sm text-warning-content bg-warning/20 rounded-lg px-3 py-2">
                No patient selected — search above to link a patient before approving.
              </p>
            )}
            <PatientQuickSelect
              selected={patient}
              onSelect={handlePatientChange}
              prescriptionId={draftPrescriptionId && !patient ? draftPrescriptionId : null}
            />
            {chief_complaint && (
              <p className="text-xs text-mute">
                Chief complaint:{" "}
                <span className="font-semibold text-ink">{chief_complaint}</span>
              </p>
            )}
            <ReviewScreen
              structured={structured ?? EMPTY_STRUCTURED}
              patient={placeholderPatient}
              patientId={patient?.id}
              transcription={transcription}
              onApprove={handleApprove}
              onReDictate={handleReDictate}
              onStructuredChange={setStructured}
              onTranscriptionAppend={(text) =>
                setTranscription((prev) =>
                  prev.trim() ? `${prev.trim()} ${text.trim()}` : text.trim()
                )
              }
              isApproving={isApproving}
            />
          </div>
        )}

        {step === "approved" && approveResult && (
          <div className="bg-canvas rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-positive rounded-full flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-black text-ink">Prescription Approved</p>
                <p className="text-sm text-mute">
                  ID: {approveResult.prescription_id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            {patient && (
              <div className="bg-green-pale rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-positive-deep">
                  {patient.name} · {patient.age}Y / {patient.sex}
                </p>
                {chief_complaint && (
                  <p className="text-xs text-body mt-1">{chief_complaint}</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {approveResult.pdf_url && (
                <a
                  href={approveResult.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[120px] bg-ink text-canvas text-center font-semibold rounded-xl py-3 text-sm hover:bg-ink/90"
                >
                  Print PDF
                </a>
              )}
              {approveResult.pdf_base64 && (
                <button
                  onClick={() => printBase64Pdf(approveResult.pdf_base64!)}
                  className="flex-1 min-w-[120px] bg-ink text-canvas font-semibold rounded-xl py-3 text-sm hover:bg-ink/90"
                >
                  Print PDF
                </button>
              )}
              {patient && approveResult.consultation_id && (
                <Link
                  href={`/patients/${patient.id}?tab=record&visit=${approveResult.consultation_id}#record`}
                  className="flex-1 min-w-[120px] text-center border border-positive/30 text-positive font-semibold rounded-xl py-3 text-sm hover:bg-green-pale"
                >
                  Patient record
                </Link>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-canvas-soft">
              <button
                type="button"
                onClick={handleNewPatient}
                className="flex-1 inline-flex items-center justify-center gap-2 border border-green/50 bg-canvas text-positive-deep font-semibold rounded-xl px-4 py-3.5 text-sm hover:bg-green-pale hover:border-green transition-colors"
              >
                <NewPatientIcon />
                New patient
              </button>
              <Link
                href="/"
                className="flex-[2] inline-flex items-center justify-center gap-2 bg-green text-ink font-semibold rounded-xl px-6 py-3.5 text-sm hover:bg-green-hover transition-colors"
              >
                Continue to dashboard
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        )}
      </PageContent>

      <PinApproveModal
        open={pinModalOpen}
        doctorId={visitDoctorId ?? getActiveDoctorId() ?? ""}
        doctorName={
          clinicCtx?.doctors.find((d) => d.id === (visitDoctorId ?? getActiveDoctorId()))?.name ??
          doctor?.name ??
          "Doctor"
        }
        prescriptionId={draftPrescriptionId ?? undefined}
        onClose={() => {
          setPinModalOpen(false);
          pendingApproveRef.current = null;
        }}
        onVerified={(token) => handlePinVerified(token)}
      />
    </AppShell>
  );
}

function printBase64Pdf(base64: string) {
  const byteChars = atob(base64);
  const byteNums = Array.from(byteChars, (c) => c.charCodeAt(0));
  const byteArray = new Uint8Array(byteNums);
  const blob = new Blob([byteArray], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      win.print();
      URL.revokeObjectURL(url);
    };
  }
}

function NewPatientIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path strokeLinecap="round" d="M20 8v6M23 11h-6" />
    </svg>
  );
}

function StepNav({
  onBack,
  backLabel,
  onSecondary,
  secondaryLabel,
  onNext,
  nextLabel,
}: {
  onBack?: () => void;
  backLabel?: string;
  onSecondary?: () => void;
  secondaryLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
}) {
  if (!onBack && !onNext && !onSecondary) return null;

  return (
    <div className="flex gap-3 pt-6 mt-6 border-t border-canvas-soft">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-ink/30 text-ink font-semibold rounded-xl px-6 py-3.5 text-sm hover:bg-canvas-soft transition-colors"
        >
          {backLabel ?? "← Back"}
        </button>
      ) : null}
      {onSecondary ? (
        <button
          type="button"
          onClick={onSecondary}
          className="flex-1 inline-flex items-center justify-center gap-2 border border-green/50 bg-canvas text-positive-deep font-semibold rounded-xl px-4 py-3.5 text-sm hover:bg-green-pale hover:border-green transition-colors"
        >
          <NewPatientIcon />
          <span>{secondaryLabel ?? "New patient"}</span>
        </button>
      ) : null}
      {onNext ? (
        <button
          type="button"
          onClick={onNext}
          className={clsx(
            "bg-green text-ink font-semibold rounded-xl px-6 py-3.5 text-sm hover:bg-green-hover transition-colors",
            onSecondary || onBack ? "flex-[2]" : "flex-1 w-full"
          )}
        >
          {nextLabel ?? "Continue →"}
        </button>
      ) : null}
    </div>
  );
}

function StepIndicator({
  step,
  patientSelected,
  recordSection,
  onNavigate,
}: {
  step: FlowStep;
  patientSelected: boolean;
  recordSection: RecordSection;
  onNavigate: (index: number) => void;
}) {
  const steps = [
    patientSelected ? "Patient ✓" : "Patient",
    "Complaint",
    "Dictate",
    "Review",
    "Done",
  ];

  const activeIndex =
    step === "approved"
      ? 4
      : step === "review"
      ? 3
      : step === "transcribing" || step === "structuring"
      ? 2
      : step === "record"
      ? indexFromRecordSection(recordSection)
      : 0;

  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => (
        <div key={`step-${i}-${label}`} className="flex items-center gap-2 flex-1">
          <button
            type="button"
            onClick={() => onNavigate(i)}
            className={clsx(
              "flex items-center gap-1.5 text-xs font-semibold transition-colors rounded-lg px-0.5 py-0.5 hover:opacity-80",
              i <= activeIndex ? "text-positive" : "text-mute"
            )}
            aria-label={`Go to ${label}`}
            aria-current={i === activeIndex ? "step" : undefined}
          >
            <div
              className={clsx(
                "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                i < activeIndex
                  ? "bg-positive text-white"
                  : i === activeIndex
                  ? "bg-green text-ink"
                  : "bg-canvas-soft text-mute"
              )}
            >
              {i < activeIndex ? "✓" : i + 1}
            </div>
            <span className="hidden sm:inline">{label}</span>
          </button>
          {i < steps.length - 1 && (
            <button
              type="button"
              onClick={() => onNavigate(i + 1)}
              className={clsx(
                "flex-1 h-0.5 rounded min-w-[8px] cursor-pointer",
                i < activeIndex ? "bg-positive" : "bg-canvas-soft"
              )}
              aria-label={`Go to ${steps[i + 1]}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
