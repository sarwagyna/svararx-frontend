"use client";
/**
 * VoiceButton — icon-only push-to-talk control (80px+, pointer events).
 */
import { useEffect, useRef } from "react";
import { clsx } from "clsx";
import type { VisualState } from "@/hooks/useVoiceRecorder";

interface VoiceButtonProps {
  visualState: VisualState;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={clsx("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function VoiceButton({
  visualState,
  onStart,
  onStop,
  disabled = false,
}: VoiceButtonProps) {
  const spaceHeldRef = useRef(false);
  const isRecording = visualState === "recording";
  const isProcessing = visualState === "processing";
  const locked = disabled || isProcessing || visualState === "success";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || locked) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      if (!spaceHeldRef.current && !isRecording) {
        spaceHeldRef.current = true;
        onStart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (spaceHeldRef.current) {
        spaceHeldRef.current = false;
        if (isRecording) onStop();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isRecording, locked, onStart, onStop]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (locked) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (!isRecording) onStart();
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isRecording) onStop();
  };

  return (
    <div className="relative flex items-center justify-center">
      {visualState === "recording" && (
        <span
          className="absolute inset-0 m-auto h-[88px] w-[88px] rounded-full animate-recpulse pointer-events-none"
          aria-hidden
        />
      )}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        disabled={locked}
        aria-label={
          visualState === "recording"
            ? "Recording"
            : visualState === "processing"
            ? "Processing"
            : "Hold to record"
        }
        aria-pressed={isRecording}
        className={clsx(
          "relative z-10 flex h-[88px] w-[88px] min-h-[80px] min-w-[80px] select-none touch-none items-center justify-center rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
          {
            "bg-mute/30 text-body focus-visible:ring-mute": visualState === "idle",
            "bg-negative text-white focus-visible:ring-negative": visualState === "recording",
            "bg-canvas-soft text-mute cursor-wait": visualState === "processing",
            "bg-positive text-white focus-visible:ring-positive": visualState === "success",
            "bg-negative text-white animate-shake focus-visible:ring-negative": visualState === "error",
            "opacity-40 cursor-not-allowed": disabled,
          }
        )}
      >
        {visualState === "processing" && <SpinnerIcon className="h-8 w-8" />}
        {visualState === "success" && <CheckIcon className="h-10 w-10" />}
        {(visualState === "idle" || visualState === "recording" || visualState === "error") && (
          <MicIcon className="h-9 w-9" />
        )}
      </button>
    </div>
  );
}
