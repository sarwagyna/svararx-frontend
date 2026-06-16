"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  getConsultationRecord,
  updateConsultationRecord,
  generateConsultationRecord,
  type ConsultationRecord,
  type EmrRecordContent,
} from "@/lib/api";
import { useSaveFeedback, useUnsavedChanges } from "@/lib/save-feedback";
import { ClinicalTestsEditor, PatientRecordAttachments } from "@/components/PatientRecordFiles";

const inputClass =
  "w-full rounded-xl border border-ink/10 bg-canvas px-3 py-2 text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/40";

const textareaClass = `${inputClass} min-h-[72px] resize-y`;

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function listToLines(items: string[]): string {
  return items.join("\n");
}

function normalizeContent(content: EmrRecordContent): EmrRecordContent {
  return {
    ...content,
    clinical_tests: content.clinical_tests ?? [],
  };
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-ink/8 bg-canvas overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-canvas-soft transition-colors"
      >
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className="text-mute text-xs">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 pb-4 space-y-3 border-t border-ink/8">{children}</div>}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] font-medium text-mute uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

function buildEditorSnapshot(
  content: EmrRecordContent,
  aiSummary: string,
  visitType: string
) {
  return JSON.stringify({ content, aiSummary, visitType });
}

interface EmrRecordEditorProps {
  consultationId: string;
  onSaved?: (record: ConsultationRecord) => void;
}

export function EmrRecordEditor({ consultationId, onSaved }: EmrRecordEditorProps) {
  const { notifySaved } = useSaveFeedback();
  const savedSnapshot = useRef("");
  const [record, setRecord] = useState<ConsultationRecord | null>(null);
  const [content, setContent] = useState<EmrRecordContent | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [visitType, setVisitType] = useState<"new" | "follow_up" | "emergency">("new");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyRecord = useCallback((data: ConsultationRecord) => {
    const c = normalizeContent(structuredClone(data.content));
    const summary = data.ai_summary ?? "";
    const vt = data.visit.visit_type;
    setRecord(data);
    setContent(c);
    setAiSummary(summary);
    setVisitType(vt);
    savedSnapshot.current = buildEditorSnapshot(c, summary, vt);
  }, []);

  const isDirty =
    !loading &&
    content !== null &&
    buildEditorSnapshot(content, aiSummary, visitType) !== savedSnapshot.current;
  useUnsavedChanges(isDirty);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConsultationRecord(consultationId);
      applyRecord(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load patient record.");
    } finally {
      setLoading(false);
    }
  }, [consultationId, applyRecord]);

  useEffect(() => {
    load();
  }, [load]);

  const regenerateFromTranscript = async () => {
    if (!record) return;
    const transcript =
      record.transcripts.corrected ||
      record.transcripts.approved ||
      record.transcripts.raw;
    if (!transcript?.trim()) return;

    setGenerating(true);
    setError(null);
    try {
      const updated = await generateConsultationRecord(
        consultationId,
        transcript,
        true
      );
      applyRecord(updated);
      notifySaved("Record updated from transcript");
      onSaved?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI structuring failed.");
    } finally {
      setGenerating(false);
    }
  };

  const save = async (approve = false) => {
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateConsultationRecord(consultationId, {
        content,
        ai_summary: aiSummary.trim() || null,
        visit_type: visitType,
        record_status: approve ? "approved" : "draft",
      });
      applyRecord(updated);
      notifySaved(approve ? "Record approved" : "Draft saved");
      onSaved?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save patient record.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="rounded-2xl border border-negative/25 bg-negative/5 px-4 py-3 text-sm text-negative">
        {error}
      </div>
    );
  }

  if (!record || !content) return null;

  const v = record.vitals;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-ink/8 bg-canvas p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-mute">
              {new Date(record.visit.date_time).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Kolkata",
              })}
              {" · "}
              {record.visit.doctor_name}
              {record.visit.clinic_name && ` · ${record.visit.clinic_name}`}
            </p>
            <h2 className="text-lg font-bold text-ink mt-1">{record.patient.full_name}</h2>
            <p className="text-sm text-body">
              {record.patient.age != null && `${record.patient.age}Y`}
              {record.patient.gender && ` · ${record.patient.gender}`}
              {record.patient.phone && ` · ${record.patient.phone}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                "text-[10px] font-semibold uppercase px-2.5 py-1 rounded-pill",
                record.record_status === "approved"
                  ? "bg-green-pale text-positive-deep"
                  : "bg-warning/15 text-warning-content"
              )}
            >
              {record.record_status}
            </span>
            <select
              value={visitType}
              onChange={(e) =>
                setVisitType(e.target.value as typeof visitType)
              }
              className="text-xs rounded-xl border border-ink/10 px-2 py-1.5 bg-canvas"
            >
              <option value="new">New visit</option>
              <option value="follow_up">Follow-up</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
        </div>

        {record.prescription_id && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-ink/8 text-xs">
            <Link
              href={`/prescribe?draft=${record.prescription_id}`}
              className="font-semibold text-positive hover:underline"
            >
              Open prescription →
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-negative/25 bg-negative/5 px-4 py-3 text-sm text-negative">
          {error}
        </div>
      )}

      <Section title="AI visit summary">
        <textarea
          className={textareaClass}
          value={aiSummary}
          onChange={(e) => setAiSummary(e.target.value)}
          placeholder="Concise clinical summary for this visit…"
        />
        {(record.transcripts.raw || record.transcripts.corrected) && (
          <button
            type="button"
            disabled={generating || saving}
            onClick={regenerateFromTranscript}
            className="text-xs font-semibold text-positive hover:underline disabled:opacity-50"
          >
            {generating ? "Structuring…" : "Regenerate from transcript with AI"}
          </button>
        )}
      </Section>

      <Section title="Chief complaints">
        <textarea
          className={textareaClass}
          value={listToLines(content.chief_complaints)}
          onChange={(e) =>
            setContent({ ...content, chief_complaints: linesToList(e.target.value) })
          }
          placeholder="One complaint per line"
        />
      </Section>

      <Section title="History">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Present illness">
            <textarea
              className={textareaClass}
              value={content.history.present_illness}
              onChange={(e) =>
                setContent({
                  ...content,
                  history: { ...content.history, present_illness: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Past medical history">
            <textarea
              className={textareaClass}
              value={content.history.past_medical_history}
              onChange={(e) =>
                setContent({
                  ...content,
                  history: { ...content.history, past_medical_history: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Surgical history">
            <textarea
              className={textareaClass}
              value={content.history.surgical_history}
              onChange={(e) =>
                setContent({
                  ...content,
                  history: { ...content.history, surgical_history: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Family history">
            <textarea
              className={textareaClass}
              value={content.history.family_history}
              onChange={(e) =>
                setContent({
                  ...content,
                  history: { ...content.history, family_history: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Allergy history">
            <textarea
              className={textareaClass}
              value={content.history.allergy_history}
              onChange={(e) =>
                setContent({
                  ...content,
                  history: { ...content.history, allergy_history: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Current medications">
            <textarea
              className={textareaClass}
              value={content.history.current_medications}
              onChange={(e) =>
                setContent({
                  ...content,
                  history: { ...content.history, current_medications: e.target.value },
                })
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="Vitals" defaultOpen={Boolean(v.bp_systolic || v.weight_kg)}>
        {v.bp_systolic || v.weight_kg || v.temperature_f ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {v.bp_systolic != null && (
              <p>
                <span className="text-mute text-xs block">BP</span>
                <span className="font-semibold">{v.bp_systolic}/{v.bp_diastolic}</span>
              </p>
            )}
            {v.pulse_bpm != null && (
              <p>
                <span className="text-mute text-xs block">Pulse</span>
                <span className="font-semibold">{v.pulse_bpm} bpm</span>
              </p>
            )}
            {v.temperature_f != null && (
              <p>
                <span className="text-mute text-xs block">Temp</span>
                <span className="font-semibold">{v.temperature_f}°F</span>
              </p>
            )}
            {v.spo2_percent != null && (
              <p>
                <span className="text-mute text-xs block">SpO₂</span>
                <span className="font-semibold">{v.spo2_percent}%</span>
              </p>
            )}
            {v.weight_kg != null && (
              <p>
                <span className="text-mute text-xs block">Weight</span>
                <span className="font-semibold">{v.weight_kg} kg</span>
              </p>
            )}
            {v.bmi != null && (
              <p>
                <span className="text-mute text-xs block">BMI</span>
                <span className="font-semibold">{v.bmi}</span>
              </p>
            )}
            {v.random_blood_sugar_mg_dl != null && (
              <p>
                <span className="text-mute text-xs block">Sugar</span>
                <span className="font-semibold">{v.random_blood_sugar_mg_dl} mg/dL</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-mute">No vitals recorded for this visit.</p>
        )}
      </Section>

      <Section title="Examination findings">
        <textarea
          className={textareaClass}
          value={listToLines(content.examination_findings)}
          onChange={(e) =>
            setContent({
              ...content,
              examination_findings: linesToList(e.target.value),
            })
          }
          placeholder="One finding per line"
        />
      </Section>

      <Section title="Diagnosis">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Primary diagnosis">
            <input
              className={inputClass}
              value={content.diagnosis.primary}
              onChange={(e) =>
                setContent({
                  ...content,
                  diagnosis: { ...content.diagnosis, primary: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Provisional diagnosis">
            <input
              className={inputClass}
              value={content.diagnosis.provisional}
              onChange={(e) =>
                setContent({
                  ...content,
                  diagnosis: { ...content.diagnosis, provisional: e.target.value },
                })
              }
            />
          </Field>
          <Field label="ICD code">
            <input
              className={inputClass}
              value={content.diagnosis.icd_code ?? ""}
              onChange={(e) =>
                setContent({
                  ...content,
                  diagnosis: {
                    ...content.diagnosis,
                    icd_code: e.target.value || null,
                  },
                })
              }
            />
          </Field>
          <Field label="Secondary diagnoses">
            <input
              className={inputClass}
              value={content.diagnosis.secondary.join(", ")}
              onChange={(e) =>
                setContent({
                  ...content,
                  diagnosis: {
                    ...content.diagnosis,
                    secondary: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                })
              }
              placeholder="Comma-separated"
            />
          </Field>
        </div>
      </Section>

      <Section title="Prescription">
        {content.prescription.length === 0 ? (
          <p className="text-sm text-mute">No medicines on this visit record.</p>
        ) : (
          <ul className="space-y-2">
            {content.prescription.map((med, i) => (
              <li
                key={`${med.drug_name}-${i}`}
                className="rounded-xl border border-ink/8 px-3 py-2 text-sm"
              >
                <p className="font-semibold text-ink">{med.drug_name}</p>
                <p className="text-xs text-mute mt-0.5">
                  {[med.dose, med.frequency, med.duration, med.food_timing]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {med.notes && <p className="text-xs text-body mt-0.5">{med.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Investigations ordered">
        <textarea
          className={textareaClass}
          value={listToLines(content.investigations_ordered)}
          onChange={(e) =>
            setContent({
              ...content,
              investigations_ordered: linesToList(e.target.value),
            })
          }
          placeholder="CBC, RBS, X-ray…"
        />
      </Section>

      <Section title="Clinical test results" defaultOpen={content.clinical_tests.length > 0}>
        <ClinicalTestsEditor
          tests={content.clinical_tests}
          onChange={(clinical_tests) => setContent({ ...content, clinical_tests })}
        />
      </Section>

      <Section title="Uploaded files">
        <PatientRecordAttachments
          consultationId={consultationId}
          attachments={record.attachments}
          onUpdated={(updated) => {
            if (updated) {
              applyRecord(updated);
            } else {
              load();
            }
          }}
          onTestsExtracted={(tests) => {
            setContent((prev) =>
              prev
                ? {
                    ...prev,
                    clinical_tests: [
                      ...prev.clinical_tests,
                      ...tests.filter(
                        (t) =>
                          !prev.clinical_tests.some(
                            (e) =>
                              e.test_name === t.test_name &&
                              e.value === t.value &&
                              e.unit === t.unit
                          )
                      ),
                    ],
                  }
                : prev
            );
          }}
        />
      </Section>

      <Section title="Advice & follow-up">
        <Field label="Patient advice">
          <textarea
            className={textareaClass}
            value={listToLines(content.advice)}
            onChange={(e) =>
              setContent({ ...content, advice: linesToList(e.target.value) })
            }
            placeholder="One advice per line"
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Follow-up instructions">
            <textarea
              className={textareaClass}
              value={content.follow_up.instructions}
              onChange={(e) =>
                setContent({
                  ...content,
                  follow_up: { ...content.follow_up, instructions: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Next visit date">
            <input
              type="date"
              className={inputClass}
              value={content.follow_up.next_visit_date ?? ""}
              onChange={(e) =>
                setContent({
                  ...content,
                  follow_up: {
                    ...content.follow_up,
                    next_visit_date: e.target.value || null,
                  },
                })
              }
            />
          </Field>
        </div>
      </Section>

      {(record.transcripts.raw || record.transcripts.corrected) && (
        <Section title="Transcript" defaultOpen={false}>
          <p className="text-xs text-body whitespace-pre-wrap font-mono bg-canvas-soft rounded-xl p-3 max-h-40 overflow-y-auto">
            {record.transcripts.corrected || record.transcripts.raw}
          </p>
        </Section>
      )}

      <div className="flex flex-wrap gap-2 pt-2 sticky bottom-0 bg-canvas-soft py-3 -mx-1 px-1">
        <button
          type="button"
          disabled={saving}
          onClick={() => save(false)}
          className="rounded-2xl border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink hover:border-green disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => save(true)}
          className="rounded-2xl bg-green text-ink px-5 py-2.5 text-sm font-semibold hover:bg-green-hover disabled:opacity-50"
        >
          Approve record
        </button>
      </div>
    </div>
  );
}
