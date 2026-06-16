"use client";
/**
 * VoiceCapture — push-to-talk UI: button, live waveform, upload, permission help.
 */
import { useCallback, useRef, useState } from "react";
import { clsx } from "clsx";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { VoiceButton } from "@/components/VoiceButton";
import { Waveform } from "@/components/Waveform";
import { MicrophonePermissionModal } from "@/components/MicrophonePermissionModal";
import { captureVoice } from "@/lib/api";

interface VoiceCaptureProps {
  onCaptured: (payload: {
    blob: Blob;
    recordingId: string;
    durationSeconds: number;
  }) => void | Promise<void>;
  onStartRecording?: () => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceCapture({
  onCaptured,
  onStartRecording,
  onError,
  disabled = false,
  className,
}: VoiceCaptureProps) {
  const [toast, setToast] = useState<string | null>(null);
  // Holds the in-flight "start consultation" task so the mic can activate
  // immediately while it runs in parallel; awaited before upload.
  const startTaskRef = useRef<Promise<void> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const {
    visualState,
    isRecording,
    startRecording,
    stopRecording,
    analyser,
    permissionDenied,
    clearPermissionDenied,
    setVisualState,
    markSuccess,
    markError,
  } = useVoiceRecorder({
    onSilenceDetected: () => showToast("No audio detected"),
    onMaxDurationReached: () => showToast("Maximum recording length reached"),
  });

  const handleStart = useCallback(async () => {
    // Kick off consultation creation in parallel so mic activation isn't gated
    // on a backend round-trip. (onStartRecording handles its own errors.)
    startTaskRef.current = Promise.resolve(onStartRecording?.()).then(() => {});
    await startRecording();
  }, [startRecording, onStartRecording]);

  const handleStop = useCallback(async () => {
    setVisualState("processing");
    const blob = await stopRecording();
    if (!blob) {
      setVisualState("idle");
      return;
    }

    try {
      // Ensure the parallel consultation-start finished before uploading.
      if (startTaskRef.current) {
        await startTaskRef.current;
        startTaskRef.current = null;
      }
      const capture = await captureVoice(blob);
      await onCaptured({
        blob,
        recordingId: capture.recording_id,
        durationSeconds: capture.duration_seconds,
      });
      markSuccess();
    } catch (err) {
      markError();
      onError?.(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    }
  }, [stopRecording, setVisualState, onCaptured, markSuccess, markError, onError]);

  return (
    <div className={clsx("flex flex-col items-center gap-4 py-4", className)}>
      <Waveform analyser={analyser} active={isRecording} />
      <VoiceButton
        visualState={disabled ? "idle" : visualState}
        onStart={handleStart}
        onStop={handleStop}
        disabled={disabled}
      />

      {toast && (
        <div
          role="status"
          className="rounded-xl bg-warning/20 px-4 py-2 text-sm font-medium text-warning-content"
        >
          {toast}
        </div>
      )}

      <MicrophonePermissionModal
        open={permissionDenied}
        onClose={clearPermissionDenied}
      />
    </div>
  );
}
