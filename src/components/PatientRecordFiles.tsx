"use client";

import { useRef, useState } from "react";
import {
  deleteRecordAttachment,
  ocrRecordAttachment,
  openRecordAttachment,
  uploadRecordAttachment,
  type ClinicalTestResult,
  type ConsultationRecord,
  type RecordAttachment,
  type RecordAttachmentCategory,
} from "@/lib/api";
import { useSaveFeedback } from "@/lib/save-feedback";

const CATEGORIES: { value: RecordAttachmentCategory; label: string }[] = [
  { value: "lab_report", label: "Lab report" },
  { value: "imaging", label: "Imaging" },
  { value: "document", label: "Document" },
  { value: "other", label: "Other" },
];

function formatSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PatientRecordAttachmentsProps {
  consultationId: string;
  attachments: RecordAttachment[];
  onUpdated: (record: ConsultationRecord | null, attachments?: RecordAttachment[]) => void;
  onTestsExtracted?: (tests: ClinicalTestResult[]) => void;
}

export function PatientRecordAttachments({
  consultationId,
  attachments,
  onUpdated,
  onTestsExtracted,
}: PatientRecordAttachmentsProps) {
  const { notifySaved } = useSaveFeedback();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<RecordAttachmentCategory>("lab_report");
  const [uploading, setUploading] = useState(false);
  const [ocrId, setOcrId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const att = await uploadRecordAttachment(consultationId, file, category);
        if (category === "lab_report" || file.type === "application/pdf") {
          setOcrId(att.id);
          try {
            const result = await ocrRecordAttachment(consultationId, att.id, true);
            if (result.record) {
              onUpdated(result.record);
              notifySaved(
                result.clinical_tests.length > 0
                  ? "Lab results extracted"
                  : "File uploaded"
              );
            } else if (result.clinical_tests.length > 0) {
              onTestsExtracted?.(result.clinical_tests);
              notifySaved("Lab results extracted");
            } else {
              notifySaved("File uploaded");
            }
          } catch (ocrErr) {
            setError(
              ocrErr instanceof Error
                ? `Uploaded, but OCR failed: ${ocrErr.message}`
                : "Uploaded, but OCR failed."
            );
          } finally {
            setOcrId(null);
          }
        } else {
          notifySaved("File uploaded");
        }
      }
      onUpdated(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const runOcr = async (attachmentId: string) => {
    setOcrId(attachmentId);
    setError(null);
    try {
      const result = await ocrRecordAttachment(consultationId, attachmentId, true);
      if (result.record) onUpdated(result.record);
      else if (result.clinical_tests.length > 0) onTestsExtracted?.(result.clinical_tests);
      notifySaved(
        result.clinical_tests.length > 0 ? "Lab results extracted" : "OCR complete"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed.");
    } finally {
      setOcrId(null);
    }
  };

  const remove = async (attachmentId: string) => {
    setError(null);
    try {
      await deleteRecordAttachment(consultationId, attachmentId);
      onUpdated(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete file.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as RecordAttachmentCategory)}
          className="text-xs rounded-xl border border-ink/10 px-2 py-1.5 bg-canvas"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:border-green disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="text-[10px] text-mute">PDF, JPEG, PNG · max 10 MB</span>
      </div>

      {error && (
        <p className="text-xs text-negative">{error}</p>
      )}

      {attachments.length === 0 ? (
        <p className="text-sm text-mute">
          Upload lab reports, imaging, or documents. Lab reports are OCR-scanned into clinical test results.
        </p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="rounded-xl border border-ink/8 px-3 py-2.5 flex flex-wrap items-start justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{att.filename}</p>
                <p className="text-[10px] text-mute mt-0.5 capitalize">
                  {(att.category ?? "other").replace("_", " ")}
                  {att.file_size ? ` · ${formatSize(att.file_size)}` : ""}
                  {att.ocr_status === "done" && " · OCR done"}
                  {att.ocr_status === "failed" && " · OCR failed"}
                </p>
                {att.ocr_text && (
                  <p className="text-xs text-body mt-1 line-clamp-2">{att.ocr_text}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openRecordAttachment(consultationId, att.id, att.filename)}
                  className="text-xs font-semibold text-positive hover:underline"
                >
                  View
                </button>
                {(att.category === "lab_report" || att.mime_type === "application/pdf") && (
                  <button
                    type="button"
                    disabled={ocrId === att.id}
                    onClick={() => runOcr(att.id)}
                    className="text-xs font-semibold text-ink hover:text-positive disabled:opacity-50"
                  >
                    {ocrId === att.id ? "Extracting…" : "OCR"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(att.id)}
                  className="text-xs font-semibold text-negative hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function emptyTest(): ClinicalTestResult {
  return {
    test_name: "",
    value: "",
    unit: "",
    reference_range: "",
    flag: "unknown",
    sample_date: null,
    lab_name: "",
    notes: "",
  };
}

interface ClinicalTestsEditorProps {
  tests: ClinicalTestResult[];
  onChange: (tests: ClinicalTestResult[]) => void;
}

export function ClinicalTestsEditor({ tests, onChange }: ClinicalTestsEditorProps) {
  const update = (index: number, patch: Partial<ClinicalTestResult>) => {
    onChange(tests.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const remove = (index: number) => {
    onChange(tests.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {tests.length === 0 ? (
        <p className="text-sm text-mute">
          No lab results yet. Upload a lab report or add tests manually.
        </p>
      ) : (
        <div className="space-y-2">
          {tests.map((test, i) => (
            <div
              key={`${test.test_name}-${i}`}
              className="rounded-xl border border-ink/8 p-3 grid grid-cols-2 md:grid-cols-4 gap-2"
            >
              <input
                className="col-span-2 md:col-span-1 rounded-lg border border-ink/10 px-2 py-1.5 text-xs"
                placeholder="Test name"
                value={test.test_name}
                onChange={(e) => update(i, { test_name: e.target.value })}
              />
              <input
                className="rounded-lg border border-ink/10 px-2 py-1.5 text-xs"
                placeholder="Value"
                value={test.value}
                onChange={(e) => update(i, { value: e.target.value })}
              />
              <input
                className="rounded-lg border border-ink/10 px-2 py-1.5 text-xs"
                placeholder="Unit"
                value={test.unit}
                onChange={(e) => update(i, { unit: e.target.value })}
              />
              <input
                className="rounded-lg border border-ink/10 px-2 py-1.5 text-xs"
                placeholder="Reference range"
                value={test.reference_range}
                onChange={(e) => update(i, { reference_range: e.target.value })}
              />
              <select
                className="rounded-lg border border-ink/10 px-2 py-1.5 text-xs"
                value={test.flag}
                onChange={(e) =>
                  update(i, { flag: e.target.value as ClinicalTestResult["flag"] })
                }
              >
                <option value="unknown">Flag</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="low">Low</option>
                <option value="critical">Critical</option>
              </select>
              <input
                type="date"
                className="rounded-lg border border-ink/10 px-2 py-1.5 text-xs"
                value={test.sample_date ?? ""}
                onChange={(e) =>
                  update(i, { sample_date: e.target.value || null })
                }
              />
              <input
                className="col-span-2 rounded-lg border border-ink/10 px-2 py-1.5 text-xs"
                placeholder="Lab name"
                value={test.lab_name}
                onChange={(e) => update(i, { lab_name: e.target.value })}
              />
              <div className="col-span-2 md:col-span-4 flex justify-between items-center gap-2">
                <input
                  className="flex-1 rounded-lg border border-ink/10 px-2 py-1.5 text-xs"
                  placeholder="Notes"
                  value={test.notes}
                  onChange={(e) => update(i, { notes: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-xs font-semibold text-negative shrink-0"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange([...tests, emptyTest()])}
        className="text-xs font-semibold text-positive hover:underline"
      >
        + Add test result
      </button>
    </div>
  );
}

export function flagClass(flag: ClinicalTestResult["flag"]) {
  if (flag === "high" || flag === "low" || flag === "critical") return "text-negative";
  if (flag === "normal") return "text-positive";
  return "text-body";
}
