"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  getPatient,
  getPatientHistory,
  getPatientVisitDetail,
  openPrescriptionPdf,
  type Patient,
  type VisitHistoryItem,
  type VisitHistoryDetail,
  type HistoryDrugItem,
} from "@/lib/api";

function formatVisitDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
  return `${date} · ${time}`;
}

function visitTitle(visit: VisitHistoryItem): string {
  if (visit.chief_complaint) return visit.chief_complaint;
  if (visit.diagnosis) return visit.diagnosis;
  if (visit.drugs.length > 0) {
    const preview = visit.drugs
      .slice(0, 2)
      .map((d) => d.name)
      .join(", ");
    return visit.drugs.length > 2 ? `${preview} +${visit.drugs.length - 2}` : preview;
  }
  if (visit.status === "draft") return "Draft prescription";
  return "Consultation";
}

function visitStatusLabel(status: string): string {
  if (status === "draft") return "Draft";
  if (status === "pdf_generated") return "Printed";
  if (status === "approved") return "Approved";
  return status.replace(/_/g, " ");
}

type DrugStatus = "new" | "continued" | "stopped" | "none";

function normalizeDrugKey(d: HistoryDrugItem) {
  return d.name.trim().toUpperCase();
}

function compareDrugs(
  current: HistoryDrugItem[],
  previous: HistoryDrugItem[] | null
): Map<string, DrugStatus> {
  const status = new Map<string, DrugStatus>();
  if (!previous) {
    current.forEach((d) => status.set(normalizeDrugKey(d), "none"));
    return status;
  }
  const prevKeys = new Set(previous.map(normalizeDrugKey));
  const currKeys = new Set(current.map(normalizeDrugKey));

  current.forEach((d) => {
    const key = normalizeDrugKey(d);
    status.set(key, prevKeys.has(key) ? "continued" : "new");
  });
  previous.forEach((d) => {
    const key = normalizeDrugKey(d);
    if (!currKeys.has(key)) {
      status.set(key, "stopped");
    }
  });
  return status;
}

function DrugChip({
  drug,
  status,
  showCompare,
}: {
  drug: HistoryDrugItem;
  status: DrugStatus;
  showCompare: boolean;
}) {
  const label = [drug.name, drug.dose, drug.frequency].filter(Boolean).join(" · ");
  return (
    <span
      className={clsx(
        "inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-pill",
        !showCompare || status === "none" || status === "continued"
          ? "bg-canvas-soft text-ink"
          : status === "new"
            ? "bg-green-pale text-positive-deep ring-1 ring-green/40"
            : "bg-negative/10 text-negative line-through"
      )}
    >
      {label}
      {showCompare && status === "new" && (
        <span className="ml-1 text-[10px] uppercase tracking-wide opacity-70">new</span>
      )}
      {showCompare && status === "stopped" && (
        <span className="ml-1 text-[10px] uppercase tracking-wide opacity-70">stopped</span>
      )}
    </span>
  );
}

function VisitNode({
  patientId,
  visit,
  previousVisit,
  compareMode,
  isLast,
  recordHref,
}: {
  patientId: string;
  visit: VisitHistoryItem;
  previousVisit: VisitHistoryItem | null;
  compareMode: boolean;
  isLast: boolean;
  recordHref?: (consultationId: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<VisitHistoryDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const title = visitTitle(visit);
  const isDraft = visit.status === "draft";

  const toggle = async () => {
    if (!expanded && !detail) {
      setLoading(true);
      try {
        const loaded = await getPatientVisitDetail(patientId, visit.id);
        setDetail(loaded);
      } catch {
        setDetail(null);
      } finally {
        setLoading(false);
      }
    }
    setExpanded((v) => !v);
  };

  const drugs = detail?.drugs ?? visit.drugs;
  const prevDrugs = previousVisit?.drugs ?? null;
  const drugStatus = compareMode
    ? compareDrugs(drugs, prevDrugs)
    : new Map<string, DrugStatus>();

  const stoppedFromPrev =
    compareMode && prevDrugs
      ? prevDrugs.filter(
          (d) => drugStatus.get(normalizeDrugKey(d)) === "stopped"
        )
      : [];

  return (
    <div className="relative flex gap-4">
      {/* Timeline rail */}
      <div className="flex flex-col items-center flex-shrink-0 w-4">
        <div
          className={clsx(
            "w-3 h-3 rounded-full border-2 border-canvas z-10",
            isDraft
              ? "bg-warning ring-2 ring-warning/30"
              : "bg-green ring-2 ring-green-pale"
          )}
        />
        {!isLast && <div className="w-px flex-1 bg-ink/10 min-h-[2rem]" />}
      </div>

      {/* Visit card */}
      <div className={clsx("flex-1 min-w-0 pb-5", isLast && "pb-0")}>
        <div className="bg-canvas rounded-xl shadow-sm overflow-hidden">
          <div className="w-full px-4 py-3 flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={toggle}
              className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
            >
              <p className="text-xs font-semibold text-mute">
                {formatVisitDate(visit.created_at)}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="font-bold text-sm text-ink truncate">{title}</p>
                <span
                  className={clsx(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-pill flex-shrink-0",
                    isDraft
                      ? "bg-warning/20 text-warning-content"
                      : "bg-green-pale text-positive-deep"
                  )}
                >
                  {visitStatusLabel(visit.status ?? "approved")}
                </span>
              </div>
              {visit.diagnosis && visit.diagnosis !== title && (
                <p className="text-xs text-body mt-0.5 truncate">
                  Dx: {visit.diagnosis}
                </p>
              )}
              <p className="text-xs text-body mt-0.5">
                {drugs.length} drug{drugs.length !== 1 ? "s" : ""}
              </p>
            </button>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {(visit.consultation_id || detail?.consultation_id) && recordHref && (() => {
                const cid = visit.consultation_id ?? detail?.consultation_id;
                if (!cid) return null;
                return (
                  <Link
                    href={recordHref(cid)}
                    className="text-xs font-semibold text-positive hover:text-positive-deep px-2 py-1 rounded-lg hover:bg-green-pale transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Record
                  </Link>
                );
              })()}
              {isDraft && (
                <Link
                  href={`/prescribe?draft=${visit.id}&patient=${patientId}`}
                  className="text-xs font-semibold text-positive hover:text-positive-deep px-2 py-1 rounded-lg hover:bg-green-pale transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Continue
                </Link>
              )}
              {visit.pdf_url && (
                <button
                  type="button"
                  onClick={() => openPrescriptionPdf(visit.id).catch(() => {})}
                  className="p-1.5 rounded-lg text-mute hover:text-positive hover:bg-green-pale transition-colors"
                  aria-label="View PDF"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={toggle}
                className="p-1.5 rounded-lg text-mute hover:text-ink hover:bg-canvas-soft transition-colors"
                aria-label={expanded ? "Collapse visit" : "Expand visit"}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={clsx(
                    "w-4 h-4 transition-transform duration-200",
                    expanded && "rotate-180"
                  )}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {expanded && (
            <div className="border-t border-canvas-soft px-4 py-3 space-y-3">
              {loading && (
                <div className="flex justify-center py-2">
                  <div className="w-5 h-5 border-2 border-green-pale border-t-positive rounded-full animate-spin" />
                </div>
              )}
              {!loading && detail?.diagnosis && (
                <p className="text-xs text-body">
                  <span className="font-semibold text-ink">Diagnosis: </span>
                  {detail.diagnosis}
                </p>
              )}
              {!loading && detail?.advice && (
                <p className="text-xs text-body">
                  <span className="font-semibold text-ink">Advice: </span>
                  {detail.advice}
                </p>
              )}
              {!loading && drugs.length === 0 && stoppedFromPrev.length === 0 && (
                <p className="text-xs text-mute">No drugs recorded.</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {drugs.map((d, i) => (
                  <DrugChip
                    key={`${d.name}-${i}`}
                    drug={d}
                    status={drugStatus.get(normalizeDrugKey(d)) ?? "none"}
                    showCompare={compareMode && !!previousVisit}
                  />
                ))}
                {stoppedFromPrev.map((d, i) => (
                  <DrugChip
                    key={`stopped-${d.name}-${i}`}
                    drug={d}
                    status="stopped"
                    showCompare
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PatientHistoryPanelProps {
  patientId: string | null;
  onClose: () => void;
  embedded?: boolean;
  recordHref?: (consultationId: string) => string;
}

export function PatientHistoryPanel({
  patientId,
  onClose,
  embedded = false,
  recordHref,
}: PatientHistoryPanelProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const load = useCallback(async (id: string, page = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      if (!append) {
        const p = await getPatient(id);
        setPatient(p);
      }
      const h = await getPatientHistory(id, page, 20, !append);
      setHistory((prev) => (append ? [...prev, ...h.items] : h.items));
      setHistoryTotal(h.total);
      setHistoryPage(h.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history.");
      if (!append) {
        setPatient(null);
        setHistory([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (patientId) {
      setCompareMode(false);
      load(patientId);
    } else {
      setPatient(null);
      setHistory([]);
      setError(null);
    }
  }, [patientId, load]);

  if (!patientId) return null;

  const timelineBody = (
    <>
      {history.length > 1 && (
        <div className={clsx("py-3 border-b border-canvas-soft flex-shrink-0", embedded ? "px-4" : "px-5")}>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={compareMode}
              onClick={() => setCompareMode((v) => !v)}
              className={clsx(
                "relative w-10 h-5 rounded-pill transition-colors flex-shrink-0",
                compareMode ? "bg-green" : "bg-ink/20"
              )}
            >
              <span
                className={clsx(
                  "absolute top-0.5 left-0.5 w-4 h-4 bg-canvas rounded-full shadow transition-transform",
                  compareMode && "translate-x-5"
                )}
              />
            </button>
            <span className="text-sm font-semibold text-ink">
              Compare with last visit
            </span>
          </label>
          {compareMode && (
            <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-mute">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green" /> New
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-canvas-soft ring-1 ring-ink/20" />{" "}
                Continued
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-negative/40" /> Stopped
              </span>
            </div>
          )}
        </div>
      )}

      <div className={clsx("flex-1 overflow-y-auto py-4", embedded ? "px-4" : "px-5")}>
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-green-pale border-t-positive rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-sm text-negative">
            {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="text-center py-10">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-10 h-10 text-mute mx-auto mb-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-semibold text-ink">
              First visit for this patient
            </p>
            <p className="text-xs text-mute mt-1">
              Prescription history will appear here after the first consult.
            </p>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div className="pl-1">
            {history.map((visit, index) => (
              <VisitNode
                key={visit.id}
                patientId={patientId}
                visit={visit}
                previousVisit={history[index + 1] ?? null}
                compareMode={compareMode}
                isLast={index === history.length - 1}
                recordHref={recordHref}
              />
            ))}
            {history.length < historyTotal && (
              <div className="flex justify-center pt-2 pb-4">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => load(patientId, historyPage + 1, true)}
                  className={clsx(
                    "text-sm font-semibold px-4 py-2 rounded-xl border transition-colors",
                    loadingMore
                      ? "text-mute border-ink/10 cursor-wait"
                      : "text-positive border-green/40 hover:bg-green-pale"
                  )}
                >
                  {loadingMore
                    ? "Loading…"
                    : `Load older visits (${historyTotal - history.length} more)`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="bg-canvas rounded-xl shadow-sm overflow-hidden">
        {timelineBody}
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-ink/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Patient visit history"
        className={clsx(
          "fixed z-50 bg-canvas shadow-xl flex flex-col",
          "inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl",
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:w-full sm:max-w-md sm:rounded-none sm:rounded-l-xl sm:max-h-none"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-canvas-soft flex-shrink-0">
          <div className="min-w-0">
            {patient ? (
              <>
                <p className="text-xs font-semibold text-mute uppercase tracking-wide">
                  Visit history
                </p>
                <h2 className="text-lg font-black text-ink truncate">
                  {patient.name}
                </h2>
                <p className="text-xs text-body">
                  {patient.age}Y / {patient.sex}
                  {historyTotal > 0 && (
                    <span> · {historyTotal} visit{historyTotal !== 1 ? "s" : ""}</span>
                  )}
                </p>
              </>
            ) : (
              <div className="h-12 w-40 bg-canvas-soft rounded animate-pulse" />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-mute hover:text-ink hover:bg-canvas-soft transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {timelineBody}
      </div>
    </>
  );
}
