"use client";

import { useEffect, useRef } from "react";

export interface WaveformStripProps {
  /** Normalised 0–1 envelope covering the whole clip. */
  peaks: readonly number[];
  durationMs: number;
  pxPerMs: number;
  /** Current horizontal scroll offset of the track, in px. */
  viewportLeft: number;
  viewportWidth: number;
  height?: number;
}

/**
 * Audio envelope drawn beneath the word track.
 *
 * Only the visible slice is rendered, into a canvas the size of the viewport
 * that is repositioned as the track scrolls. A canvas spanning the full
 * timeline is not an option: at the largest zoom a 30-minute clip is over
 * 400,000px wide, far past the ~32,767px per-axis limit browsers enforce, and
 * the allocation alone would be hundreds of megabytes.
 */
export function WaveformStrip({
  peaks,
  durationMs,
  pxPerMs,
  viewportLeft,
  viewportWidth,
  height = 30,
}: WaveformStripProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || peaks.length === 0 || viewportWidth <= 0) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(viewportWidth * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext("2d");
    if (ctx === null) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, viewportWidth, height);

    const mid = height / 2;
    const msPerPeak = durationMs / peaks.length;

    // Muted on purpose: the waveform is a reference for finding word onsets,
    // not the focus of the track.
    ctx.fillStyle = "rgba(255, 90, 44, 0.38)";

    // One bar per device pixel column: more would be invisible, fewer would
    // alias speech bursts into silence.
    for (let x = 0; x < viewportWidth; x += 1) {
      const timeMs = (viewportLeft + x) / pxPerMs;
      if (timeMs < 0 || timeMs > durationMs) continue;

      const peakIndex = Math.floor(timeMs / msPerPeak);
      const peak = peaks[peakIndex] ?? 0;
      const barHeight = Math.max(1, peak * (height - 4));

      ctx.fillRect(x, mid - barHeight / 2, 1, barHeight);
    }
  }, [peaks, durationMs, pxPerMs, viewportLeft, viewportWidth, height]);

  if (peaks.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute bottom-0"
      style={{
        left: viewportLeft,
        width: viewportWidth,
        height,
      }}
    />
  );
}
