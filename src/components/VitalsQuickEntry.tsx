"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  recordVitals,
  type BloodSugarType,
  type VitalCreate,
  type VitalFlag,
  type VitalReading,
} from "@/lib/api";
import { useSaveFeedback, useUnsavedChanges } from "@/lib/save-feedback";
import { vitalFlagLabel } from "@/lib/vitals";

const inputClass =
  "w-full bg-canvas border border-ink/15 rounded-md px-3 py-3 text-lg text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition text-center";

const FLAG_STYLES: Record<VitalFlag["flag"], string> = {
  high_bp: "text-negative",
  low_bp: "text-warning-content",
  high_sugar: "text-negative",
  low_spo2: "text-negative",
};

interface VitalsQuickEntryProps {
  patientId: string;
  consultationId?: string | null;
  onSaved?: (reading: VitalReading, flags: VitalFlag[]) => void;
}

export function VitalsQuickEntry({
  patientId,
  consultationId,
  onSaved,
}: VitalsQuickEntryProps) {
  const { notifySaved } = useSaveFeedback();
  const [bpSystolic, setBpSystolic] = useState("");
  const [bpDiastolic, setBpDiastolic] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");
  const [bloodSugarType, setBloodSugarType] = useState<BloodSugarType>("fasting");
  const [spo2, setSpo2] = useState("");
  const [temperature, setTemperature] = useState("");
  const [pulse, setPulse] = useState("");
  const [flags, setFlags] = useState<VitalFlag[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const parseIntOrNull = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number.parseInt(trimmed, 10);
    return Number.isFinite(n) ? n : null;
  };

  const parseFloatOrNull = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number.parseFloat(trimmed);
    return Number.isFinite(n) ? n : null;
  };

  const hasAnyValue =
    bpSystolic ||
    bpDiastolic ||
    weightKg ||
    bloodSugar ||
    spo2 ||
    temperature ||
    pulse;

  useUnsavedChanges(Boolean(hasAnyValue) && !saved);

  const handleSubmit = async () => {
    if (!hasAnyValue) return;

    const payload: VitalCreate = {
      patient_id: patientId,
      consultation_id: consultationId ?? null,
      bp_systolic: parseIntOrNull(bpSystolic),
      bp_diastolic: parseIntOrNull(bpDiastolic),
      weight_kg: parseFloatOrNull(weightKg),
      blood_sugar_mg_dl: parseIntOrNull(bloodSugar),
      blood_sugar_type: bloodSugar ? bloodSugarType : null,
      spo2_percent: parseIntOrNull(spo2),
      temperature_f: parseFloatOrNull(temperature),
      pulse_bpm: parseIntOrNull(pulse),
    };

    setSaving(true);
    setError(null);
    setSaved(false);
    setFlags([]);

    try {
      const result = await recordVitals(payload);
      setFlags(result.flags);
      setSaved(true);
      notifySaved("Vitals saved");
      onSaved?.(result.vitals, result.flags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vitals.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-canvas rounded-xl p-5 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-bold text-ink">Vitals</h2>
        <p className="text-xs text-mute mt-0.5">Enter only what you measured — all fields optional.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-body mb-1.5 block">Blood Pressure</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={bpSystolic}
              onChange={(e) => setBpSystolic(e.target.value)}
              placeholder="Sys"
              className={inputClass}
              aria-label="Systolic BP"
            />
            <input
              type="number"
              inputMode="numeric"
              value={bpDiastolic}
              onChange={(e) => setBpDiastolic(e.target.value)}
              placeholder="Dia"
              className={inputClass}
              aria-label="Diastolic BP"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-body mb-1.5 block">Weight (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="—"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-body mb-1.5 block">Pulse (bpm)</label>
          <input
            type="number"
            inputMode="numeric"
            value={pulse}
            onChange={(e) => setPulse(e.target.value)}
            placeholder="—"
            className={inputClass}
          />
        </div>

        <div className="col-span-2">
          <label className="text-xs font-semibold text-body mb-1.5 block">Blood Sugar (mg/dL)</label>
          <input
            type="number"
            inputMode="numeric"
            value={bloodSugar}
            onChange={(e) => setBloodSugar(e.target.value)}
            placeholder="—"
            className={inputClass}
          />
          {bloodSugar && (
            <div className="flex gap-2 mt-2">
              {(["fasting", "pp", "random"] as BloodSugarType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBloodSugarType(type)}
                  className={clsx(
                    "flex-1 rounded-pill px-3 py-1.5 text-xs font-semibold border transition-colors",
                    bloodSugarType === type
                      ? "bg-green text-ink border-green"
                      : "bg-canvas border-ink/15 text-mute hover:border-ink/30"
                  )}
                >
                  {type === "pp" ? "PP" : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-body mb-1.5 block">SpO₂ (%)</label>
          <input
            type="number"
            inputMode="numeric"
            value={spo2}
            onChange={(e) => setSpo2(e.target.value)}
            placeholder="—"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-body mb-1.5 block">Temp (°F)</label>
          <input
            type="number"
            inputMode="decimal"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="—"
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-negative">{error}</p>
      )}

      {flags.length > 0 && (
        <div className="rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 space-y-1">
          {flags.map((f) => (
            <p key={f.flag} className={clsx("text-sm font-semibold", FLAG_STYLES[f.flag])}>
              ⚠ {vitalFlagLabel(f.flag)}
            </p>
          ))}
        </div>
      )}

      {saved && flags.length === 0 && (
        <p className="text-sm text-positive font-semibold">Vitals saved.</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!hasAnyValue || saving}
        className="w-full bg-green text-ink font-semibold rounded-xl py-3 text-sm hover:bg-green-hover disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Save Vitals"}
      </button>
    </div>
  );
}
