"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CaptionPage,
  CaptionStyleConfig,
  ExportResolution,
} from "@/core";
import {
  ExportError,
  downloadBlob,
  exportFilename,
  exportVideo,
  type ExportProgress,
} from "./export-video";

export type ExportPhase = "idle" | "exporting" | "done" | "error";

export interface UseVideoExportInput {
  file: File | null;
  pages: readonly CaptionPage[];
  config: CaptionStyleConfig;
  source: { width: number; height: number } | null;
  resolution: ExportResolution;
  /**
   * Burn the watermark into this export. Derived from
   * `entitlements.watermarkFree`, not from the plan name — a week pass removes
   * the watermark without being a plan at all.
   */
  watermark: boolean;
}

/**
 * Owns export state so both the top bar and the side panel can drive the same
 * run. Keeping it in one component and lifting a callback would let the two
 * buttons start two concurrent encodes.
 */
export const useVideoExport = ({
  file,
  pages,
  config,
  source,
  resolution,
  watermark,
}: UseVideoExportInput) => {
  const [phase, setPhase] = useState<ExportPhase>("idle");
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  // Aborts an in-flight encode if the editor unmounts, so a cancelled tab does
  // not keep an encoder and its frame queue alive.
  useEffect(() => () => cancelRef.current?.(), []);

  const start = useCallback(async () => {
    if (file === null || source === null || phase === "exporting") return;

    setPhase("exporting");
    setProgress({ ratio: -1, encodedFrames: 0, bytesWritten: 0 });
    setError(null);
    setResult(null);

    const handle = exportVideo({
      file,
      pages,
      config,
      source,
      resolution,
      watermark,
      onProgress: setProgress,
    });
    cancelRef.current = handle.cancel;

    try {
      const blob = await handle.result;
      setResult(blob);
      setPhase("done");
      downloadBlob(blob, exportFilename(file.name));
    } catch (cause) {
      if (cause instanceof ExportError && cause.code === "cancelled") {
        setPhase("idle");
        return;
      }
      setError(
        cause instanceof Error ? cause.message : "Export failed. Please retry.",
      );
      setPhase("error");
    } finally {
      cancelRef.current = null;
    }
  }, [file, pages, config, source, resolution, watermark, phase]);

  const cancel = useCallback(() => cancelRef.current?.(), []);

  const redownload = useCallback(() => {
    if (result !== null && file !== null) {
      downloadBlob(result, exportFilename(file.name));
    }
  }, [result, file]);

  return { phase, progress, error, result, start, cancel, redownload };
};
