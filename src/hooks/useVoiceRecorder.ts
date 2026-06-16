"use client";
/**
 * useVoiceRecorder — push-to-talk with Web Audio analyser, 120s cap, silence detection.
 */
import { useState, useRef, useCallback, useEffect } from "react";

export type RecorderState = "idle" | "recording" | "processing";
export type VisualState = "idle" | "recording" | "processing" | "success" | "error";

const MAX_RECORDING_MS = 120_000;
const SILENCE_RMS_THRESHOLD = 0.01;
const SILENCE_TOAST_MS = 3_000;

const MOBILE_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
};

function getBestMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function computeRms(analyser: AnalyserNode, buffer: Uint8Array): number {
  analyser.getByteTimeDomainData(buffer as Uint8Array<ArrayBuffer>);
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    const sample = (buffer[i] - 128) / 128;
    sum += sample * sample;
  }
  return Math.sqrt(sum / buffer.length);
}

interface UseVoiceRecorderOptions {
  onSilenceDetected?: () => void;
  onMaxDurationReached?: () => void;
}

interface UseVoiceRecorderReturn {
  state: RecorderState;
  visualState: VisualState;
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  audioBlob: Blob | null;
  error: string | null;
  clearError: () => void;
  analyser: AnalyserNode | null;
  permissionDenied: boolean;
  clearPermissionDenied: () => void;
  setVisualState: (state: VisualState) => void;
  markSuccess: () => void;
  markError: () => void;
}

export function useVoiceRecorder(
  options: UseVoiceRecorderOptions = {}
): UseVoiceRecorderReturn {
  const { onSilenceDetected, onMaxDurationReached } = options;

  const [state, setState] = useState<RecorderState>("idle");
  const [visualState, setVisualState] = useState<VisualState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const resolveRef = useRef<((blob: Blob | null) => void) | null>(null);
  const mimeTypeRef = useRef("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceRafRef = useRef<number | null>(null);
  const silenceStartedRef = useRef<number | null>(null);
  const silenceToastShownRef = useRef(false);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRecordingRef = useRef<() => Promise<Blob | null>>(async () => null);

  const cleanupAudioGraph = useCallback(() => {
    if (silenceRafRef.current !== null) {
      cancelAnimationFrame(silenceRafRef.current);
      silenceRafRef.current = null;
    }
    silenceStartedRef.current = null;
    silenceToastShownRef.current = false;
    analyserRef.current = null;
    setAnalyser(null);
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const markSuccess = useCallback(() => {
    setVisualState("success");
    window.setTimeout(() => setVisualState("idle"), 1500);
  }, []);

  const markError = useCallback(() => {
    setVisualState("error");
    window.setTimeout(() => setVisualState("idle"), 1500);
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }

      if (!mediaRecorderRef.current || state !== "recording") {
        resolve(null);
        return;
      }

      resolveRef.current = resolve;
      mediaRecorderRef.current.stop();
    });
  }, [state]);

  stopRecordingRef.current = stopRecording;

  const monitorSilence = useCallback(() => {
    const node = analyserRef.current;
    if (!node) return;

    const buffer = new Uint8Array(node.fftSize);
    const tick = () => {
      if (!analyserRef.current) return;
      const rms = computeRms(analyserRef.current, buffer);
      const now = performance.now();

      if (rms < SILENCE_RMS_THRESHOLD) {
        if (silenceStartedRef.current === null) {
          silenceStartedRef.current = now;
        } else if (
          !silenceToastShownRef.current &&
          now - silenceStartedRef.current >= SILENCE_TOAST_MS
        ) {
          silenceToastShownRef.current = true;
          onSilenceDetected?.();
        }
      } else {
        silenceStartedRef.current = null;
      }

      silenceRafRef.current = requestAnimationFrame(tick);
    };

    silenceRafRef.current = requestAnimationFrame(tick);
  }, [onSilenceDetected]);

  const startRecording = useCallback(async () => {
    if (state === "recording") return;

    setError(null);
    setAudioBlob(null);
    setVisualState("idle");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: MOBILE_AUDIO_CONSTRAINTS,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.7;
      source.connect(analyserNode);
      analyserRef.current = analyserNode;
      setAnalyser(analyserNode);
      monitorSilence();

      const mimeType = getBestMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: 32000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || "audio/webm",
        });
        setAudioBlob(blob);
        setState("idle");

        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        cleanupAudioGraph();

        if (resolveRef.current) {
          resolveRef.current(blob);
          resolveRef.current = null;
        }
      };

      recorder.onerror = () => {
        setError("Recording error. Please try again.");
        setState("idle");
        setVisualState("error");
        streamRef.current?.getTracks().forEach((t) => t.stop());
        cleanupAudioGraph();
        if (resolveRef.current) {
          resolveRef.current(null);
          resolveRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setState("recording");
      setVisualState("recording");

      maxDurationTimerRef.current = setTimeout(() => {
        onMaxDurationReached?.();
        void stopRecordingRef.current();
      }, MAX_RECORDING_MS);
    } catch (err) {
      cleanupAudioGraph();
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setPermissionDenied(true);
        setError("Microphone access denied.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError("No microphone found.");
        markError();
      } else {
        setError("Could not start recording.");
        markError();
      }
      setState("idle");
      setVisualState("idle");
    }
  }, [state, cleanupAudioGraph, monitorSilence, onMaxDurationReached, markError]);

  useEffect(() => {
    return () => {
      if (maxDurationTimerRef.current) clearTimeout(maxDurationTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cleanupAudioGraph();
    };
  }, [cleanupAudioGraph]);

  return {
    state,
    visualState,
    isRecording: state === "recording",
    startRecording,
    stopRecording,
    audioBlob,
    error,
    clearError: () => setError(null),
    analyser,
    permissionDenied,
    clearPermissionDenied: () => setPermissionDenied(false),
    setVisualState,
    markSuccess,
    markError,
  };
}
