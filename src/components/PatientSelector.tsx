"use client";
/**
 * PatientSelector — search existing patients or register a new one.
 */
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { listPatients, createPatient, type Patient } from "@/lib/api";

interface PatientSelectorProps {
  onSelect: (patient: Patient) => void;
  selectedPatient: Patient | null;
}

export function PatientSelector({
  onSelect,
  selectedPatient,
}: PatientSelectorProps) {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    age: "",
    sex: "M" as "M" | "F" | "Other",
    phone: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const results = await listPatients({ q });
      setPatients(results.items);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(query);
  }, [query, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.age) return;

    setCreating(true);
    setError(null);
    try {
      const patient = await createPatient({
        name: newForm.name.trim(),
        age: parseInt(newForm.age),
        sex: newForm.sex,
        phone: newForm.phone.trim(),
      });
      onSelect(patient);
      setShowNew(false);
      setNewForm({ name: "", age: "", sex: "M", phone: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create patient");
    } finally {
      setCreating(false);
    }
  };

  if (selectedPatient) {
    return (
      <div className="flex items-center justify-between bg-green-pale rounded-xl px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-0.5">
            Patient
          </p>
          <p className="font-bold text-ink">
            {selectedPatient.name},{" "}
            <span className="font-normal text-body">
              {selectedPatient.age}Y / {selectedPatient.sex}
            </span>
          </p>
          {selectedPatient.phone && (
            <p className="text-xs text-mute">{selectedPatient.phone}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={() => onSelect(null as unknown as Patient)}
            className="text-xs text-mute hover:text-ink underline underline-offset-2"
          >
            Change
          </button>
          <Link
            href={`/patients/${selectedPatient.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-positive hover:text-positive-deep underline underline-offset-2"
          >
            History →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-ink">
          Select Patient
        </label>
        <button
          onClick={() => setShowNew(!showNew)}
          className="text-xs font-semibold text-positive hover:text-positive-deep"
        >
          {showNew ? "← Back to search" : "+ New patient"}
        </button>
      </div>

      {showNew ? (
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            placeholder="Full name *"
            value={newForm.name}
            onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            required
            className="w-full border border-ink/20 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-positive"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Age *"
              min={0}
              max={150}
              value={newForm.age}
              onChange={(e) => setNewForm({ ...newForm, age: e.target.value })}
              required
              className="border border-ink/20 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-positive"
            />
            <select
              value={newForm.sex}
              onChange={(e) =>
                setNewForm({
                  ...newForm,
                  sex: e.target.value as "M" | "F" | "Other",
                })
              }
              className="border border-ink/20 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-positive bg-white"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={newForm.phone}
            onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
            className="w-full border border-ink/20 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-positive"
          />
          {error && <p className="text-xs text-negative">{error}</p>}
          <button
            type="submit"
            disabled={creating}
            className="w-full bg-green text-ink font-semibold rounded-xl py-2.5 text-sm hover:bg-green-hover disabled:opacity-50"
          >
            {creating ? "Registering…" : "Register Patient"}
          </button>
        </form>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-ink/20 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-positive"
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {loading ? (
              <p className="text-xs text-mute py-2 text-center">Searching…</p>
            ) : patients.length === 0 ? (
              <p className="text-xs text-mute py-2 text-center">
                No patients found.{" "}
                <button
                  onClick={() => setShowNew(true)}
                  className="underline text-positive"
                >
                  Register new
                </button>
              </p>
            ) : (
              patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className={clsx(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm",
                    "hover:bg-canvas-soft transition-colors",
                    "flex items-center justify-between"
                  )}
                >
                  <span className="font-semibold text-ink">{p.name}</span>
                  <span className="text-mute text-xs">
                    {p.age}Y / {p.sex}
                    {p.phone ? ` · ${p.phone}` : ""}
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
