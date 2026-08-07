"use client";

import type { CanvasSize, ExportResolution } from "@/core";
import { RESOLUTIONS, canvasForSource } from "@/core";

/**
 * Device capability checks for export.
 *
 * The point is to fail *before* a 4K encode rather than after: on a mid-range
 * phone an over-ambitious export does not error, it kills the tab — losing the
 * user's edits along with it.
 */

export const supportsWebCodecs = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.VideoEncoder !== "undefined" &&
  typeof window.VideoDecoder !== "undefined" &&
  typeof window.VideoFrame !== "undefined";

/**
 * Coarse mobile detection.
 *
 * Uses pointer type and screen size rather than the user-agent string alone,
 * because UA sniffing gets iPadOS wrong — it reports as a Mac while having a
 * phone-class memory ceiling.
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const smallScreen = Math.min(window.screen.width, window.screen.height) < 820;
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  return (coarsePointer && smallScreen) || uaMobile;
};

/** Chromium-only; undefined elsewhere, so absence is never treated as failure. */
const deviceMemoryGb = (): number | null => {
  const value = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  return typeof value === "number" ? value : null;
};

export interface ResolutionAvailability {
  resolution: ExportResolution;
  allowed: boolean;
  /** User-facing explanation when blocked. */
  reason: string | null;
}

/**
 * Whether a resolution can be offered on this device.
 *
 * 4K is desktop-only by policy and additionally gated on reported memory. When
 * the browser does not report memory we allow it — refusing on missing data
 * would block every Safari and Firefox desktop user, who are perfectly capable
 * of the encode.
 */
export const resolutionAvailability = (
  resolution: ExportResolution,
): ResolutionAvailability => {
  const spec = RESOLUTIONS[resolution];

  if (spec.desktopOnly && isMobileDevice()) {
    return {
      resolution,
      allowed: false,
      reason: "4K is available on desktop.",
    };
  }

  const memory = deviceMemoryGb();
  if (memory !== null && spec.approxMemoryMb / 1024 > memory / 2) {
    return {
      resolution,
      allowed: false,
      reason: `This device reports ${memory}GB of memory — not enough headroom for ${spec.label}.`,
    };
  }

  return { resolution, allowed: true, reason: null };
};

/**
 * Export dimensions for a source at a chosen tier.
 *
 * Never upscales. A 720p source exported "at 4K" would be four times the file
 * for exactly the same detail, so the tier acts as a ceiling, not a target.
 */
export const exportDimensions = (
  source: CanvasSize,
  resolution: ExportResolution,
): CanvasSize => {
  const target = canvasForSource(source, resolution);
  return source.height <= target.height ? source : target;
};
