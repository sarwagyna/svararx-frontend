"use client";
/**
 * Waveform — live frequency bars from Web Audio AnalyserNode.
 */
import { useEffect, useRef } from "react";

interface WaveformProps {
  analyser: AnalyserNode | null;
  active: boolean;
}

export function Waveform({ analyser, active }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !active) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const barCount = 32;

    const draw = () => {
      analyser.getByteFrequencyData(buffer);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const step = Math.floor(buffer.length / barCount);
      const gap = 2;
      const barWidth = (width - gap * (barCount - 1)) / barCount;

      for (let i = 0; i < barCount; i++) {
        const value = buffer[i * step] / 255;
        const barHeight = Math.max(4, value * height);
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        ctx.fillStyle = "#9fe870";
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, active]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={64}
      className="w-full max-w-xs h-16"
      aria-hidden
      role="presentation"
    />
  );
}
