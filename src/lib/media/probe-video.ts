"use client";

import type { AspectRatioId } from "@/core";
import { aspectFromSize } from "@/core";

export interface VideoMetadata {
  durationSeconds: number;
  width: number;
  height: number;
  /** Nearest supported bucket, used for labelling and caption sizing. */
  aspect: AspectRatioId;
  /** The source's exact ratio, preserved for the export canvas. */
  ratio: number;
  objectUrl: string;
}

/**
 * Reads a video's real duration and intrinsic dimensions.
 *
 * Uses a detached `<video>` element rather than ffmpeg: the browser parses only
 * the container header to satisfy `loadedmetadata`, so this is near-instant and
 * costs no memory, whereas probing through ffmpeg.wasm would mean loading the
 * whole file into wasm memory just to read a header.
 *
 * This is what makes aspect ratio auto-detected rather than user-selected.
 *
 * The returned `objectUrl` is owned by the caller and must be released with
 * `URL.revokeObjectURL` — a leaked one pins the entire video file in memory,
 * which on a 500MB upload is immediately noticeable.
 */
export const probeVideo = (file: Blob): Promise<VideoMetadata> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");

    // Never attached to the DOM, so it must be told not to try playing.
    video.preload = "metadata";
    video.muted = true;

    const cleanup = (): void => {
      video.onloadedmetadata = null;
      video.onerror = null;
    };

    video.onloadedmetadata = () => {
      cleanup();

      const width = video.videoWidth;
      const height = video.videoHeight;
      const duration = video.duration;

      if (!Number.isFinite(duration) || duration <= 0) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not read this video's duration."));
        return;
      }

      if (width <= 0 || height <= 0) {
        // Audio-only file, or a codec the browser cannot decode. Either way
        // there is no video track to caption.
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not read this video's dimensions."));
        return;
      }

      resolve({
        durationSeconds: duration,
        width,
        height,
        aspect: aspectFromSize({ width, height }),
        ratio: width / height,
        objectUrl,
      });
    };

    video.onerror = () => {
      cleanup();
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "This browser can't read that video format. Try an MP4 or WebM.",
        ),
      );
    };

    video.src = objectUrl;
  });
