"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { clsx } from "clsx";
import {
  createPatient,
  getRecentPatients,
  linkPrescriptionPatient,
  searchPatients,
  searchResultToPatient,
  type Patient,
  type PatientRecent,
  type PatientSearchResult,
} from "@/lib/api";
import { normalizePhone, validatePhone } from "@/lib/profile-constants";
import { ConditionChips } from "@/components/ConditionChips";

export interface PatientQuickSelectHandle {
  openNewPatientModal: (prefillName?: string) => void;
}

interface PatientQuickSelectProps {
  selected: Patient | null;
  onSelect: (patient: Patient | null) => void;
  prescriptionId?: string | null;
  compact?: boolean;
  /** Hide the inline “+ New patient” link (use footer action instead). */
  hideHeaderNewPatient?: boolean;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatLastVisit(iso: string | null | undefined): string {
  if (!iso) return "No visits";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function genderLabel(sex: string): string {
  if (sex === "M") return "M";
  if (sex === "F") return "F";
  return sex;
}

export const PatientQuickSelect = forwardRef<PatientQuickSelectHandle, PatientQuickSelectProps>(
  function PatientQuickSelect(
    {
      selected,
      onSelect,
      prescriptionId,
      compact = false,
      hideHeaderNewPatient = false,
    },
    ref
  ) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [recent, setRecent] = useState<PatientRecent[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    age: "",
    phone: "",
    sex: "" as "" | "M" | "F",
  });

  const loadRecent = useCallback(async () => {
    try {
      const data = await getRecentPatients(8);
      setRecent(data);
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchPatients(query.trim());
        setResults(data);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pick = useCallback(
    async (p: Patient) => {
      if (prescriptionId) {
        try {
          await linkPrescriptionPatient(prescriptionId, p.id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not link patient");
          return;
        }
      }
      onSelect(p);
      setQuery("");
      setShowDropdown(false);
      setError(null);
    },
    [onSelect, prescriptionId]
  );

  const openNewPatientModal = useCallback((prefillName?: string) => {
    setForm({
      name: prefillName ?? "",
      age: "",
      phone: "",
      sex: "",
    });
    setShowModal(true);
    setShowDropdown(false);
    setError(null);
  }, []);

  useImperativeHandle(ref, () => ({ openNewPatientModal }), [openNewPatientModal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    const age = parseInt(form.age, 10);
    if (!age || age < 1 || age > 119) {
      setError("Enter a valid age (1–119).");
      return;
    }

    setCreating(true);
    try {
      const patient = await createPatient({
        name: form.name.trim(),
        age,
        phone: normalizePhone(form.phone),
        sex: form.sex || "M",
      });
      await pick(patient);
      setShowModal(false);
      setForm({ name: "", age: "", phone: "", sex: "" });
      loadRecent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create patient");
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setQuery("");
      setShowDropdown(false);
      setResults([]);
    }
    if (e.key === "Enter" && showDropdown && results.length > 0) {
      e.preventDefault();
      pick(searchResultToPatient(results[0]));
    }
  };

  return (
    <div className={clsx("space-y-4", compact && "space-y-3")} ref={wrapRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          placeholder="Patient name or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-canvas border border-ink/15 rounded-pill px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green/50"
        />
        {showDropdown && query.trim() && (
          <div className="absolute z-40 top-full mt-1 w-full bg-canvas border border-ink/10 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {searching ? (
              <p className="text-xs text-mute py-3 text-center">Searching…</p>
            ) : results.length === 0 ? (
              <button
                type="button"
                onClick={() => openNewPatientModal(query.trim())}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-positive hover:bg-canvas-soft"
              >
                + Add {query.trim()} as new patient
              </button>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => pick(searchResultToPatient(r))}
                  className="w-full text-left px-3 py-2.5 hover:bg-canvas-soft border-b border-ink/5 last:border-0 flex items-center gap-3"
                >
                  <span className="w-9 h-9 rounded-full bg-green/30 text-ink font-bold text-xs flex items-center justify-center shrink-0">
                    {initials(r.full_name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">
                      {r.full_name}
                      <span className="text-mute font-normal ml-1.5">
                        {r.age} {genderLabel(r.gender)}
                      </span>
                    </p>
                    <p className="text-xs text-mute truncate">
                      {r.phone ?? "No phone"}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-positive-deep bg-green-pale px-2 py-0.5 rounded-pill shrink-0">
                    {formatLastVisit(r.last_visit_date)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-negative">{error}</p>
      )}

      {selected ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-green-pale border border-green/40 rounded-xl px-4 py-3">
            <span className="w-11 h-11 rounded-full bg-green/40 text-ink font-bold text-sm flex items-center justify-center shrink-0">
              {initials(selected.name)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink truncate">
                {selected.name}
                <span className="text-body font-semibold ml-1.5">
                  {selected.age} {genderLabel(selected.sex)}
                </span>
              </p>
              <p className="text-xs text-mute">{selected.phone ?? "No phone"}</p>
            </div>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="w-7 h-7 rounded-full hover:bg-green/30 text-mute hover:text-ink flex items-center justify-center text-lg leading-none shrink-0"
              aria-label="Clear patient"
            >
              ×
            </button>
          </div>
          <ConditionChips patientId={selected.id} />
        </div>
      ) : (
        !compact && (
          <p className="text-xs text-mute">
            {prescriptionId
              ? "Search and select a patient to link to this prescription"
              : "No patient selected — optional for quick Rx"}
          </p>
        )
      )}

      {!compact && !selected && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-mute uppercase tracking-wide">Recent</p>
            {!hideHeaderNewPatient && (
              <button
                type="button"
                onClick={() => openNewPatientModal()}
                className="text-xs font-semibold text-positive hover:text-positive-deep"
              >
                + New patient
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {recent.slice(0, 8).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-ink/10 bg-canvas hover:bg-canvas-soft transition-colors text-center"
              >
                <span className="w-9 h-9 rounded-full bg-green/30 text-ink font-bold text-xs flex items-center justify-center">
                  {initials(p.name)}
                </span>
                <span className="text-[10px] font-semibold text-ink leading-tight line-clamp-2">
                  {p.name.split(" ")[0]}
                </span>
                <span className="text-[9px] text-mute">{formatLastVisit(p.last_visit_at)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-canvas rounded-xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-ink">New patient</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                className="w-full border border-ink/15 rounded-md px-3 py-2.5 text-sm"
                placeholder="Full name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className="w-full border border-ink/15 rounded-md px-3 py-2.5 text-sm"
                placeholder="Age *"
                type="number"
                min={1}
                max={119}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                required
              />
              <input
                className="w-full border border-ink/15 rounded-md px-3 py-2.5 text-sm"
                placeholder="Phone (10 digits) *"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <div className="flex gap-2">
                <span className="text-xs text-mute self-center">Gender:</span>
                {(["M", "F"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, sex: form.sex === g ? "" : g })}
                    className={clsx(
                      "rounded-pill px-4 py-1 text-sm font-semibold border",
                      form.sex === g
                        ? "bg-green border-green text-ink"
                        : "border-ink/15 text-body"
                    )}
                  >
                    {g}
                  </button>
                ))}
                <span className="text-[10px] text-mute self-center">optional</span>
              </div>
              {error && <p className="text-xs text-negative">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-pill border border-ink/15 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-pill bg-green text-ink py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {creating ? "Adding…" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});
