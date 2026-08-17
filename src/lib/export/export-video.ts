"use client";

import { convertMedia, webcodecsController } from "@remotion/webcodecs";
import type { CaptionPage, CaptionStyleConfig, ExportResolution } from "@/core";
import { VIDEO_FPS } from "@/core";
import { drawCaptions } from "./draw-captions";
import { exportDimensions, supportsWebCodecs } from "./capabilities";
import { ensureCaptionFontLoaded, resolveFontFamily } from "./fonts";
import { drawWatermark } from "./watermark";

export class ExportError extends Error {
  readonly code:
    | "unsupported"
    | "cancelled"
    | "out_of_memory"
    | "encode_failed";

  constructor(code: ExportError["code"], message: string) {
    super(message);
    this.name = "ExportError";
    this.code = code;
  }
}

export interface ExportProgress {
  /** 0–1, or -1 while the duration is still unknown. */
  ratio: number;
  encodedFrames: number;
  bytesWritten: number;
}

export interface ExportOptions {
  file: File;
  pages: readonly CaptionPage[];
  config: CaptionStyleConfig;
  source: { width: number; height: number };
  resolution: ExportResolution;
  /** Free tier burns in a watermark; paid does not. */
  watermark: boolean;
  onProgress?: (progress: ExportProgress) => void;
}

export interface ExportHandle {
  /** Resolves with the finished MP4. */
  result: Promise<Blob>;
  cancel: () => void;
}

/**
 * Burns captions into the video, entirely in the browser.
 *
 * `convertMedia` owns demuxing, decoding, encoding, muxing and audio
 * passthrough; our only job is `onVideoFrame`, where the decoded frame is drawn
 * to a canvas, captions are painted over it, and a new frame is returned.
 *
 * Three contracts from Remotion's `processFrame` that must be honoured exactly,
 * or the export throws mid-run:
 *
 *  1. The returned frame must match the input's `displayWidth`/`displayHeight`.
 *     Resolution changes therefore go through the `resize` option, which runs
 *     *before* this callback — so captions are drawn at final output size and
 *     never resampled.
 *  2. `timestamp` and `duration` must be carried across verbatim.
 *  3. The input frame must NOT be closed here. Remotion closes it once a
 *     different frame is returned; closing it too would be a double free.
 *
 * The video never leaves the device — this is the whole privacy architecture,
 * and it is why export costs us nothing per minute.
 */
export const exportVideo = ({
  file,
  pages,
  config,
  source,
  resolution,
  watermark,
  onProgress,
}: ExportOptions): ExportHandle => {
  if (!supportsWebCodecs()) {
    return {
      result: Promise.reject(
        new ExportError(
          "unsupported",
          "This browser can't export video. Try Chrome or Edge on desktop.",
        ),
      ),
      cancel: () => undefined,
    };
  }

  const controller = webcodecsController();
  const target = exportDimensions(source, resolution);

  let canvas: OffscreenCanvas | null = null;
  let ctx: OffscreenCanvasRenderingContext2D | null = null;

  const run = async (): Promise<Blob> => {
    // Load every caption face up front. A font that arrives mid-encode would be
    // baked into the file, with the first seconds in a fallback typeface.
    const fontLoads: Array<{
      fontId: CaptionStyleConfig["fontId"];
      weight: number;
      sizePx: number;
      style?: string;
    }> = [
      {
        fontId: config.fontId,
        weight: config.fontWeight,
        sizePx: config.fontSizePx,
      },
    ];

    if (config.secondaryFontId !== undefined) {
      fontLoads.push({
        fontId: config.secondaryFontId,
        weight: config.annotationWeight > 0 ? config.annotationWeight : 500,
        sizePx: config.fontSizePx * 0.6,
      });
    }

    if (config.specialFontId !== undefined) {
      fontLoads.push({
        fontId: config.specialFontId,
        weight: 400,
        sizePx: config.fontSizePx * 0.9,
        style: "italic",
      });
      fontLoads.push({
        fontId: config.specialFontId,
        weight: 700,
        sizePx: config.fontSizePx,
      });
    }

    await Promise.all(
      fontLoads.map((font) =>
        ensureCaptionFontLoaded(
          font.weight,
          font.sizePx,
          resolveFontFamily(font.fontId),
          font.style,
        ),
      ),
    );

    try {
      const converted = await convertMedia({
        src: file,
        container: "mp4",
        videoCodec: "h264",
        audioCodec: "aac",
        controller,
        // Caps resolution without upscaling; see `exportDimensions`.
        resize: {
          mode: "max-height-width",
          maxHeight: target.height,
          maxWidth: target.width,
        },
        /**
         * Force a re-encode, always.
         *
         * This is load-bearing, not an optimisation choice. Remotion's default
         * handler copies the video track whenever it legally can — same
         * container, compatible codec, no rotation, no effective resize — which
         * is exactly the common case of an MP4/h264 phone recording exported to
         * MP4/h264. A copied track is never decoded, so `onVideoFrame` is never
         * called and the file comes out byte-identical with NO captions burned
         * in. That looked like a successful export and was the single worst bug
         * in this pipeline.
         *
         * Burning in captions means every frame must be decoded, drawn on and
         * re-encoded. There is no fast path.
         */
        onVideoTrack: () => ({
          type: "reencode",
          videoCodec: "h264",
          resize: {
            mode: "max-height-width",
            maxHeight: target.height,
            maxWidth: target.width,
          },
        }),
        onProgress: (state) => {
          onProgress?.({
            ratio: state.overallProgress ?? -1,
            encodedFrames: state.encodedVideoFrames,
            bytesWritten: state.bytesWritten,
          });
        },
        onVideoFrame: ({ frame }) => {
          const width = frame.displayWidth;
          const height = frame.displayHeight;

          // Allocated once and reused. A fresh canvas per frame would churn a
          // GPU-backed surface 1,800 times on a 60s reel.
          if (canvas === null || canvas.width !== width || canvas.height !== height) {
            canvas = new OffscreenCanvas(width, height);
            ctx = canvas.getContext("2d", { alpha: false });
          }

          if (ctx === null) {
            throw new ExportError(
              "encode_failed",
              "Couldn't open a drawing surface for the export.",
            );
          }

          ctx.drawImage(frame, 0, 0, width, height);

          // WebCodecs timestamps are microseconds.
          const timeMs = frame.timestamp / 1000;

          drawCaptions(ctx, {
            pages,
            config,
            timeMs,
            width,
            height,
            fps: VIDEO_FPS,
          });

          if (watermark) drawWatermark(ctx, width, height);

          // Timestamp and duration carried across verbatim — Remotion rejects
          // the frame otherwise. Do not close `frame`; Remotion owns it.
          return new VideoFrame(canvas, {
            timestamp: frame.timestamp,
            duration: frame.duration ?? undefined,
          });
        },
      });

      return await converted.save();
    } catch (error) {
      if (controller._internals._mediaParserController._internals.signal.aborted) {
        throw new ExportError("cancelled", "Export cancelled.");
      }

      const message = error instanceof Error ? error.message : "";
      if (/memory|allocat|abort/i.test(message)) {
        throw new ExportError(
          "out_of_memory",
          "Ran out of memory. Try exporting at a lower resolution.",
        );
      }

      throw new ExportError(
        "encode_failed",
        "Export failed. Try a lower resolution, or a different browser.",
      );
    } finally {
      canvas = null;
      ctx = null;
    }
  };

  return {
    result: run(),
    cancel: () => controller.abort(),
  };
};

/** Triggers a download without ever uploading the file anywhere. */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Revoked on the next tick — revoking synchronously can cancel the download
  // in some browsers before it has started reading the blob.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

export const exportFilename = (sourceName: string): string => {
  const stem = sourceName.replace(/\.[^.]+$/, "").slice(0, 60) || "video";
  return `${stem}-captioned.mp4`;
};
