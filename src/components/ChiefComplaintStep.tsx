"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  CHIEF_COMPLAINT_CHIPS,
  buildChiefComplaint,
} from "@/lib/chiefComplaints";

interface ChiefComplaintStepProps {
  selectedTags: string[];
  freeText: string;
  onTagsChange: (tags: string[]) => void;
  onFreeTextChange: (text: string) => void;
  disabled?: boolean;
}

export function ChiefComplaintStep({
  selectedTags,
  freeText,
  onTagsChange,
  onFreeTextChange,
  disabled = false,
}: ChiefComplaintStepProps) {
  const [showPrompt, setShowPrompt] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowPrompt(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleTag = (tag: string) => {
    if (disabled) return;
    onTagsChange(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag]
    );
  };

  const { chief_complaint } = buildChiefComplaint(selectedTags, freeText);

  return (
    <div className="space-y-4">
      <p
        className={clsx(
          "text-sm font-semibold text-body text-center transition-opacity duration-700",
          showPrompt ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
        )}
      >
        What&apos;s the patient here for?
      </p>

      <div className="grid grid-cols-3 gap-2">
        {CHIEF_COMPLAINT_CHIPS.map((chip) => {
          const selected = selectedTags.includes(chip);
          return (
            <button
              key={chip}
              type="button"
              disabled={disabled}
              onClick={() => toggleTag(chip)}
              className={clsx(
                "text-xs font-semibold px-2 py-2.5 rounded-lg border transition-colors text-center leading-tight",
                selected
                  ? "bg-green border-green text-ink"
                  : "bg-canvas-soft border-ink/10 text-body hover:border-green/50 hover:bg-green-pale/40",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {chip}
            </button>
          );
        })}
      </div>

      <input
        type="text"
        value={freeText}
        onChange={(e) => onFreeTextChange(e.target.value)}
        disabled={disabled}
        placeholder="Other complaint…"
        className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-sm text-ink placeholder:text-mute focus:outline-none focus:border-positive focus:ring-1 focus:ring-green/40"
      />

      {chief_complaint && (
        <p className="text-xs text-mute">
          Selected: <span className="text-ink font-semibold">{chief_complaint}</span>
        </p>
      )}
    </div>
  );
}

export function ComplaintTags({
  tags,
  freeText,
}: {
  tags: string[];
  freeText: string;
}) {
  const items = [...tags, ...(freeText.trim() ? [freeText.trim()] : [])];
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {items.map((tag) => (
        <span
          key={tag}
          className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-green-pale text-positive-deep"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
